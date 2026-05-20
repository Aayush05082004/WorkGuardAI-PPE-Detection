import torch
import os

def quick_test():
    print("🧪 Quick System Test")
    print("-" * 40)
    
    print(f"✅ Python working")
    print(f"✅ PyTorch version: {torch.__version__}")
    
    if torch.backends.mps.is_available():
        print("✅ M1 GPU (MPS) available")
    else:
        print("⚠️  MPS not available, will use CPU")
    
    if os.path.exists('dataset/train/images'):
        train_count = len([f for f in os.listdir('dataset/train/images') if f.endswith(('.jpg', '.png'))])
        print(f"✅ Dataset found: {train_count} training images")
    else:
        print("❌ Dataset not found")
        return False
    
    try:
        from ultralytics import YOLO
        print("✅ Ultralytics YOLO available")
    except ImportError:
        print("❌ Ultralytics not installed")
        return False
    
    print("\n🎉 All tests passed! Ready to train.")
    return True

if __name__ == '__main__':
    quick_test()
