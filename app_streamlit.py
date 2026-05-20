import streamlit as st
from ultralytics import YOLO
import numpy as np
import cv2
from PIL import Image

# ------------- CONFIG -------------
MODEL_PATH = "results/ppe_construction/weights/best.pt"
CONF_THRESHOLD = 0.5
# ----------------------------------


@st.cache_resource
def load_model():
    model = YOLO(MODEL_PATH)
    return model


def main():
    st.title("WorkGuardAI - PPE Detection")
    st.write("Upload an image and the model will detect PPE and safety violations.")

    model = load_model()

    uploaded_file = st.file_uploader("Choose an image", type=["jpg", "jpeg", "png"])

    if uploaded_file is not None:
        image = Image.open(uploaded_file).convert("RGB")
        st.image(image, caption="Uploaded Image", use_column_width=True)

        if st.button("Run Detection"):
            with st.spinner("Running PPE detection..."):
                # PIL -> numpy (RGB) -> BGR
                img_np = np.array(image)
                img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)

                results = model(img_bgr, conf=CONF_THRESHOLD, verbose=False)
                result = results[0]

                st.subheader("Detections")
                if result.boxes is not None and len(result.boxes) > 0:
                    for box in result.boxes:
                        class_id = int(box.cls[0])
                        class_name = model.names[class_id]
                        confidence = float(box.conf[0])
                        st.write(f"- {class_name}: {confidence:.1%}")
                else:
                    st.write("No objects detected.")

                annotated = result.plot()  # BGR
                annotated_rgb = cv2.cvtColor(annotated, cv2.COLOR_BGR2RGB)
                st.subheader("Annotated Image")
                st.image(annotated_rgb, use_column_width=True)


if __name__ == "__main__":
    main()
