from ultralytics import YOLO
import torch
import os

def main():
    print("="*60)
    print("WorkGuardAI - PPE Detection Training")
    print("Construction Site Safety Dataset")
    print("="*60)
    
    # Check dataset
    if not os.path.exists('dataset/train/images'):
        print("❌ Dataset not found!")
        return
    
    train_images = len([f for f in os.listdir('dataset/train/images') if f.endswith(('.jpg', '.png'))])
    train_labels = len([f for f in os.listdir('dataset/train/labels') if f.endswith('.txt')])
    valid_images = len([f for f in os.listdir('dataset/valid/images') if f.endswith(('.jpg', '.png'))])
    
    print(f"\n📊 Dataset Summary:")
    print(f"   Train images: {train_images}")
    print(f"   Train labels: {train_labels}")
    print(f"   Valid images: {valid_images}")
    
    if train_images == 0:
        print("❌ No training images found!")
        return
    
    # GPU detection for Windows + NVIDIA
    if torch.cuda.is_available():
        device = '0'  # first GPU
        print(f"\n✅ Using NVIDIA GPU: {torch.cuda.get_device_name(0)}")
    else:
        device = 'cpu'
        print(f"\n⚠️  Using CPU")
    
    print(f"\n🚀 Starting training with YOLOv8...")
    
    # Load YOLOv8 model (pretrained)
    model = YOLO('yolov8n.pt')
    
    # Train model
    results = model.train(
        data='data.yaml',
        epochs=50,
        imgsz=640,
        batch=8,
        device=device,
        workers=4,
        patience=10,
        save=True,
        project='results',
        name='ppe_construction',
        exist_ok=True,
        verbose=True,
        lr0=0.01,
        cos_lr=True,
        amp=True,
        hsv_h=0.015,
        hsv_s=0.7,
        hsv_v=0.4,
        fliplr=0.5,
        mosaic=1.0,
    )
    
    print("\n" + "="*60)
    print("✅ Training Completed!")
    print("="*60)
    
    best_model = f"results/ppe_construction/weights/best.pt"
    print(f"\n📁 Best model saved to: {best_model}")
    
    print("\n📊 Running validation...")
    metrics = model.val()
    
    print(f"\n🎯 Final Results:")
    print(f"   mAP@0.5: {metrics.box.map50:.3f}")
    print(f"   mAP@0.5:0.95: {metrics.box.map:.3f}")
    print(f"   Precision: {metrics.box.mp:.3f}")
    print(f"   Recall: {metrics.box.mr:.3f}")

if __name__ == '__main__':
    main()
