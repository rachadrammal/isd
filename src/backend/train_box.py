from ultralytics import YOLO

model = YOLO("yolov8n.pt")
model.train(data="C:/Users/ASUS TUF F15/Desktop/push/src/backend/data.yaml", epochs=50, imgsz=640)