import cv2
import uuid
import requests
import time
from datetime import datetime, timezone
from ultralytics import YOLO

# --- CONFIG ---
BACKEND_URL = "http://localhost:5000/api/alerts"
TOKEN = "YOUR_JWT_TOKEN"   # replace with your login token
HEADERS = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}
CAMERA_ID = "laptop_cam_1"
POST_INTERVAL = 3  # seconds between alerts

# --- INIT YOLO (fire/smoke pretrained weights) ---
fire_smoke_model = YOLO("best.pt")

# --- INIT YOLO (box detection pretrained weights) ---
box_model = YOLO("runs/detect/train4/weights/best.pt")






# --- INIT Face Detector ---
FACE_PROTO = "deploy.prototxt"
FACE_MODEL = "res10_300x300_ssd_iter_140000.caffemodel"
face_net = cv2.dnn.readNetFromCaffe(FACE_PROTO, FACE_MODEL)

# --- ALERT POST FUNCTION ---
def post_alert(alert_type, severity, message, metadata=None):
    payload = {
    "id": str(uuid.uuid4()),
    "type": alert_type,
    "severity": severity,
    "title": f"{alert_type.capitalize()} Alert",
    "description": message,
    "camera_id": CAMERA_ID,
    "status": "new",
    "ai_confidence": float(metadata.get("conf", 0)) if metadata else 0,
    "data": {
        "bbox": [int(x) for x in metadata.get("bbox", [])],  # cast to int
        "conf": float(metadata.get("conf", 0))
    },
    "created_at": datetime.now(timezone.utc).isoformat()
}
    try:
        r = requests.post(BACKEND_URL, json=payload, headers=HEADERS, timeout=5)
        print("Alert posted:", r.status_code, message)
    except Exception as e:
        print("Error posting alert:", e)

# --- FACE DETECTION FUNCTION ---
def detect_faces(frame, conf_thresh=0.6):
    h, w = frame.shape[:2]
    blob = cv2.dnn.blobFromImage(cv2.resize(frame, (300, 300)), 1.0,
                                 (300, 300), (104.0, 177.0, 123.0))
    face_net.setInput(blob)
    detections = face_net.forward()
    faces = []
    for i in range(detections.shape[2]):
        confidence = detections[0, 0, i, 2]
        if confidence >= conf_thresh:
            box = detections[0, 0, i, 3:7] * [w, h, w, h]
            x1, y1, x2, y2 = box.astype(int)
            faces.append({"bbox": [x1, y1, x2 - x1, y2 - y1], "confidence": float(confidence)})
    return faces

# --- CAMERA LOOP ---
cap = cv2.VideoCapture(0)
if not cap.isOpened():
    raise RuntimeError("Cannot open camera")

last_post = 0

while True:
    ok, frame = cap.read()
    if not ok:
        break

    # --- Fire/Smoke detection ---
    results_fire = fire_smoke_model.predict(source=frame, conf=0.3, verbose=False)
    for r in results_fire:
        for b in r.boxes:
            cls = int(b.cls)
            name = fire_smoke_model.names[cls].lower()
            conf = float(b.conf)

            if name in ["fire", "smoke"]:
                if name == "smoke" and conf < 0.6:
                    continue
                x1, y1, x2, y2 = map(int, b.xyxy[0])
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0,0,255), 2)
                cv2.putText(frame, f"{name.upper()} {conf:.2f}", (x1, y1-6),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0,0,255), 2)
                if (time.time() - last_post) > POST_INTERVAL:
                    post_alert("fire", "critical", f"{name} detected (conf={conf:.2f})",
                               {"bbox": [x1,y1,x2-x1,y2-y1], "conf": conf})
                    last_post = time.time()

    # --- Box detection ---
    results_box = box_model.predict(source=frame, conf=0.5, verbose=False)
    for r in results_box:
        for b in r.boxes:
            cls = int(b.cls)
            name = box_model.names[cls].lower()
            conf = float(b.conf)
            
            
            if name == "box":
                x1, y1, x2, y2 = map(int, b.xyxy[0])
                cv2.rectangle(frame, (x1, y1), (x2, y2), (255,0,0), 2)
                cv2.putText(frame, f"BOX {conf:.2f}", (x1, y1-6),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255,0,0), 2)
                w, h = x2 - x1, y2 - y1
            if w*h > 0.5 * frame.shape[0] * frame.shape[1]:
                    continue  # skip giant detections (likely walls)
                
            if (time.time() - last_post) > POST_INTERVAL:
                    post_alert("box", "medium", f"Box detected (conf={conf:.2f})",
                               {"bbox": [x1,y1,x2-x1,y2-y1], "conf": conf})
                    last_post = time.time()


    # --- Face detection ---
    faces = detect_faces(frame)
    for f in faces:
        x, y, w, h = f["bbox"]
        cv2.rectangle(frame, (x, y), (x+w, y+h), (0,255,0), 2)
        cv2.putText(frame, f"Face {f['confidence']:.2f}", (x, y-5),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0,255,0), 2)
    if faces and (time.time() - last_post) > POST_INTERVAL:
        post_alert("face", "medium", f"{len(faces)} face(s) detected", {"faces": faces})
        last_post = time.time()

    # --- Show frame ---
    cv2.imshow("YOLOv8 Fire/Smoke + Box + Face Webcam", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()