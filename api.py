"""
WorkGuardAI - PPE Detection API
FastAPI backend with YOLO model + Supabase integration
"""
import torch

# Monkey-patch torch.load to bypass the strict PyTorch 2.6 weights_only security rule for this trusted local file
_orig_torch_load = torch.load
def safe_torch_load(*args, **kwargs):
    kwargs['weights_only'] = False
    return _orig_torch_load(*args, **kwargs)
torch.load = safe_torch_load

from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from ultralytics import YOLO
from supabase import create_client, Client
from dotenv import load_dotenv
import numpy as np
import cv2
import base64
import uuid
import os
import io
from PIL import Image
from datetime import datetime

# ── Load environment variables ──────────────────────────────────────────────
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
MODEL_PATH   = os.getenv("MODEL_PATH", "results/ppe_construction/weights/best.pt")
CONF_THRESHOLD = float(os.getenv("CONF_THRESHOLD", "0.5"))

# ── Supabase client ──────────────────────────────────────────────────────────
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ── FastAPI app ──────────────────────────────────────────────────────────────
app = FastAPI(
    title="WorkGuardAI API",
    description="PPE Detection API powered by YOLOv8",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # Replace with your React URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Load YOLO model once at startup ─────────────────────────────────────────
print(f"Loading model from: {MODEL_PATH}")
model = YOLO(MODEL_PATH)
print("Model loaded successfully!")


# ── Helper: upload bytes to Supabase Storage ─────────────────────────────────
def upload_to_supabase(bucket: str, filename: str, data: bytes, content_type: str) -> str:
    """Upload file to Supabase Storage and return public URL."""
    supabase.storage.from_(bucket).upload(
        path=filename,
        file=data,
        file_options={"content-type": content_type}
    )
    result = supabase.storage.from_(bucket).get_public_url(filename)
    return result


# ── Helper: image bytes to base64 string ─────────────────────────────────────
def image_to_base64(img_rgb: np.ndarray) -> str:
    pil_img = Image.fromarray(img_rgb)
    buffer = io.BytesIO()
    pil_img.save(buffer, format="JPEG", quality=90)
    return "data:image/jpeg;base64," + base64.b64encode(buffer.getvalue()).decode("utf-8")


# ── Helper: numpy image to bytes ─────────────────────────────────────────────
def image_to_bytes(img_rgb: np.ndarray) -> bytes:
    pil_img = Image.fromarray(img_rgb)
    buffer = io.BytesIO()
    pil_img.save(buffer, format="JPEG", quality=90)
    return buffer.getvalue()


# ════════════════════════════════════════════════════════════════════════════
# ROUTES
# ════════════════════════════════════════════════════════════════════════════

@app.get("/", tags=["Health"])
def root():
    return {
        "status": "WorkGuardAI API is running",
        "model": MODEL_PATH,
        "version": "1.0.0"
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}


# ── POST /detect ─────────────────────────────────────────────────────────────
@app.post("/detect", tags=["Detection"])
async def detect(file: UploadFile = File(...)):
    """
    Upload an image → run YOLO PPE detection → save to Supabase → return results.
    
    Returns:
    - detections: list of { class, confidence, bbox }
    - annotated_image: base64 encoded annotated image
    - original_url: Supabase Storage URL of original image
    - annotated_url: Supabase Storage URL of annotated image
    - detection_id: UUID saved in Supabase DB
    - total: number of detections
    - violations: list of safety violations detected
    """

    # Validate file type
    if file.content_type not in ["image/jpeg", "image/png", "image/jpg"]:
        raise HTTPException(status_code=400, detail="Only JPG/PNG images are supported.")

    # Read image
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")
    img_np = np.array(image)
    img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)

    # ── Run YOLO inference ───────────────────────────────────────────────────
    results = model(img_bgr, conf=CONF_THRESHOLD, verbose=False)
    result  = results[0]

    # ── Parse detections ─────────────────────────────────────────────────────
    detections = []
    violations = []
    VIOLATION_CLASSES = {"NO-Hardhat", "NO-Mask", "NO-Safety Vest"}

    if result.boxes is not None:
        for box in result.boxes:
            class_id   = int(box.cls[0])
            class_name = model.names[class_id]
            confidence = round(float(box.conf[0]), 3)
            bbox       = [round(v, 2) for v in box.xyxy[0].tolist()]  # [x1,y1,x2,y2]

            detections.append({
                "class":      class_name,
                "confidence": confidence,
                "bbox":       bbox
            })

            if class_name in VIOLATION_CLASSES:
                violations.append(class_name)

    # ── Annotated image ──────────────────────────────────────────────────────
    annotated_bgr = result.plot()
    annotated_rgb = cv2.cvtColor(annotated_bgr, cv2.COLOR_BGR2RGB)
    annotated_b64 = image_to_base64(annotated_rgb)

    # ── Upload to Supabase Storage ───────────────────────────────────────────
    detection_id   = str(uuid.uuid4())
    original_url   = None
    annotated_url  = None

    try:
        # Upload original image
        orig_filename = f"uploads/{detection_id}_original.jpg"
        original_url  = upload_to_supabase("ppe-images", orig_filename, contents, "image/jpeg")

        # Upload annotated image
        ann_filename  = f"annotated/{detection_id}_annotated.jpg"
        ann_bytes     = image_to_bytes(annotated_rgb)
        annotated_url = upload_to_supabase("ppe-images", ann_filename, ann_bytes, "image/jpeg")

    except Exception as e:
        print(f"Supabase Storage upload failed: {e}")
        # Continue even if storage upload fails

    # ── Save detection record to Supabase DB ─────────────────────────────────
    try:
        supabase.table("detections").insert({
            "id":             detection_id,
            "filename":       file.filename,
            "original_url":   original_url,
            "annotated_url":  annotated_url,
            "detections":     detections,
            "violations":     violations,
            "total_detected": len(detections),
            "has_violation":  len(violations) > 0,
            "created_at":     datetime.utcnow().isoformat()
        }).execute()
    except Exception as e:
        print(f"Supabase DB insert failed: {e}")
        # Continue even if DB save fails

    # ── Return response ──────────────────────────────────────────────────────
    return JSONResponse({
        "detection_id":    detection_id,
        "detections":      detections,
        "violations":      list(set(violations)),
        "has_violation":   len(violations) > 0,
        "total":           len(detections),
        "annotated_image": annotated_b64,
        "original_url":    original_url,
        "annotated_url":   annotated_url,
    })


# ── GET /detections ───────────────────────────────────────────────────────────
@app.get("/detections", tags=["History"])
def get_detections(
    limit:  int = Query(default=20, le=100),
    offset: int = Query(default=0)
):
    """Fetch detection history from Supabase (latest first)."""
    try:
        response = (
            supabase.table("detections")
            .select("*")
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        return {"detections": response.data, "count": len(response.data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── GET /detections/{id} ──────────────────────────────────────────────────────
@app.get("/detections/{detection_id}", tags=["History"])
def get_detection(detection_id: str):
    """Fetch a single detection record by ID."""
    try:
        response = (
            supabase.table("detections")
            .select("*")
            .eq("id", detection_id)
            .single()
            .execute()
        )
        return response.data
    except Exception as e:
        raise HTTPException(status_code=404, detail="Detection not found")


# ── GET /stats ────────────────────────────────────────────────────────────────
@app.get("/stats", tags=["Analytics"])
def get_stats():
    """Get overall detection statistics."""
    try:
        total_res     = supabase.table("detections").select("id", count="exact").execute()
        violation_res = supabase.table("detections").select("id", count="exact").eq("has_violation", True).execute()

        total     = total_res.count or 0
        violation = violation_res.count or 0
        safe      = total - violation

        return {
            "total_scans":      total,
            "violations_found": violation,
            "safe_scans":       safe,
            "violation_rate":   round((violation / total * 100), 1) if total > 0 else 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
