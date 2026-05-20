from ultralytics import YOLO
import glob
import os
import cv2

# -------- CONFIG --------
INPUT_FOLDER = 'Testing'              # folder with images to test (in project root)
OUTPUT_FOLDER = 'Testing_results'     # folder where annotated images will be saved
CONF_THRESHOLD = 0.5                  # confidence threshold for detections
MODEL_PATH = 'results/ppe_construction/weights/best.pt'
# ------------------------


print("🔍 Testing PPE Detection Model on custom images...")

# 1. Load model
model = YOLO(MODEL_PATH)
print("✅ Model loaded successfully!")

print("\n📊 Model can detect these classes:")
for i, name in model.names.items():
    print(f"   {i}: {name}")

# 2. Collect ALL images from Testing folder (including subfolders)
exts = ('*.jpg', '*.jpeg', '*.png', '*.bmp')
test_images = []

for ext in exts:
    test_images.extend(glob.glob(os.path.join(INPUT_FOLDER, '**', ext), recursive=True))

print(f"\n🖼 Found {len(test_images)} images in '{INPUT_FOLDER}' (including subfolders)")

if not test_images:
    print("⚠ No images found. Put any .jpg/.jpeg/.png/.bmp images into the 'Testing' folder and run again.")
    exit(0)

# 3. Prepare output folder
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# 4. Run inference on all images
for i, img_path in enumerate(test_images, start=1):
    file_name = os.path.basename(img_path)
    print(f"\n🔍 Testing: {file_name}")

    # Run detection
    results = model(img_path, conf=CONF_THRESHOLD, verbose=False)

    if results and results[0].boxes is not None and len(results[0].boxes) > 0:
        boxes = results[0].boxes
        print(f"  ✅ Found {len(boxes)} objects:")

        for box in boxes:
            class_id = int(box.cls[0])
            confidence = float(box.conf[0])
            class_name = model.names[class_id]
            print(f"    - {class_name}: {confidence:.1%}")

        # Save annotated image
        annotated = results[0].plot()
        output_path = os.path.join(OUTPUT_FOLDER, f"result_{i}_{file_name}")
        cv2.imwrite(output_path, annotated)
        print(f"  💾 Saved: {output_path}")
    else:
        print("  ⚪ No objects detected")
        img = cv2.imread(img_path)
        output_path = os.path.join(OUTPUT_FOLDER, f"result_{i}_{file_name}")
        cv2.imwrite(output_path, img)
        print(f"  💾 Saved original image (no detections): {output_path}")

print(f"\n🎉 Testing completed! Check '{OUTPUT_FOLDER}' folder for images.")
