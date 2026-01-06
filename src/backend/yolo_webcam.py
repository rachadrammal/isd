import uuid
import os
import requests
import time
from datetime import datetime, timezone
from ultralytics import YOLO
import cv2

# --- CONFIG ---
BACKEND_URL = "http://localhost:5000"
LOGIN_URL = "http://localhost:5000/api/auth/login"
ALERT_URL = "http://localhost:5000/api/alerts"

CAMERA_ID = "cam_warehouse"
POST_INTERVAL = 3  

# --- MODEL PLACEHOLDERS ---
_MODEL = None
_BOX_MODEL = None
_face_net = None

# --- INIT YOLO MODELS ---
def get_box_model():
    global _BOX_MODEL
    if _BOX_MODEL is None:
        base_dir = os.path.dirname(__file__)
        model_path = os.path.join(base_dir, "runs", "detect", "train4", "weights", "best.pt")
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"YOLO model not found at {model_path}")
        _BOX_MODEL = YOLO(model_path)
    return _BOX_MODEL

def get_fire_smoke_model():
    global _MODEL
    if _MODEL is None:
        base_dir = os.path.dirname(__file__)
        model_path = os.path.join(base_dir, "models", "best.pt")
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"YOLO model not found at {model_path}")
        _MODEL = YOLO(model_path)
    return _MODEL

def get_face_net():
    global _face_net
    if _face_net is None:
        proto_path = os.path.join(os.path.dirname(__file__), "deploy.prototxt")
        model_path = os.path.join(os.path.dirname(__file__), "res10_300x300_ssd_iter_140000.caffemodel")
        if not os.path.exists(proto_path):
            raise FileNotFoundError(f"Prototxt not found: {proto_path}")
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Caffe model not found: {model_path}")
        _face_net = cv2.dnn.readNetFromCaffe(proto_path, model_path)
    return _face_net


# --- INIT Face Detector ---
FACE_PROTO = "deploy.prototxt"
FACE_MODEL = "res10_300x300_ssd_iter_140000.caffemodel"


last_post = 0  # keep track of last alert time


def get_jwt_token(username="admin", password="password123"):
    resp = requests.post(LOGIN_URL, json={"username": username, "password": password})
    if resp.status_code == 200:
        return resp.json()["token"]
    else:
        raise RuntimeError("Login failed: " + resp.text)
    
    
TOKEN = None
HEADERS = {"Authorization": None, "Content-Type": "application/json"}

def get_headers():
    global TOKEN
    if TOKEN is None:
        TOKEN = get_jwt_token()
    return {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}

# --- ALERT POST FUNCTION ---
def post_alert(alert_type, severity, message, metadata=None):
    HEADERS = get_headers()
    payload = {
        "id": str(uuid.uuid4()),                # unique ID
        "type": alert_type,                     # e.g. "fire", "smoke", "box", "face"
        "severity": severity,                   # e.g. "critical", "medium"
        "title": f"{alert_type.capitalize()} Alert",
        "description": message,
        "camera_id": CAMERA_ID,                 # 👈 ties alert to the camera
        "status": "new",
        "ai_confidence": float(metadata.get("conf", 0)) if metadata else 0,
        "data": metadata or {},                 # bbox, faces, etc.
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    

    try:
        r = requests.post(ALERT_URL, json=payload, headers=HEADERS, timeout=5)
        print("Alert posted:", r.status_code, message)
    except Exception as e:
        print("Error posting alert:", e)



# --- FACE DETECTION FUNCTION ---
def detect_faces(frame, conf_thresh=0.6):
    face_net = get_face_net()
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


# --- MAIN FUNCTION: run AI on a single frame ---
def run_ai_on_frame(frame):
    global last_post

    # Fire/Smoke detection
    model = get_fire_smoke_model()


    results_fire = model.predict(source=frame, conf=0.3, verbose=False)
    for r in results_fire:
        for b in r.boxes:
            cls = int(b.cls)
            name = model.names[cls].lower()
            conf = float(b.conf)

            if name in ["fire", "smoke"]:
                if name == "smoke" and conf < 0.6:
                    continue
                x1, y1, x2, y2 = map(int, b.xyxy[0])
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0,0,255), 2)
                cv2.putText(frame, f"{name.upper()} {conf:.2f}", (x1, y1-6),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0,0,255), 2)
                if (time.time() - last_post) > POST_INTERVAL:
                    post_alert(
                        "fire",
                        "critical",
                        f"Fire detected (conf={conf:.2f})",
                        {"bbox": [x1, y1, x2-x1, y2-y1], "conf": conf}
                    )
                    last_post = time.time()
    # Box detection\
    box_model = get_box_model()
    results_box = box_model.predict(source=frame, conf=0.6, verbose=False)
    for r in results_box:
        for b in r.boxes:
            cls = int(b.cls)
            name = box_model.names[cls].lower()
            conf = float(b.conf)

            if name == "box":
                x1, y1, x2, y2 = map(int, b.xyxy[0])
                w, h = x2 - x1, y2 - y1
                if w*h > 0.3 * frame.shape[0] * frame.shape[1]:
                    continue  # skip giant detections
                cv2.rectangle(frame, (x1, y1), (x2, y2), (255,0,0), 2)
                cv2.putText(frame, f"BOX {conf:.2f}", (x1, y1-6),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255,0,0), 2)
            if (time.time() - last_post) > POST_INTERVAL:
                post_alert(
                    "box",
                    "critical",
                    f"Box detected (conf={conf:.2f})",
                    {"bbox": [x1, y1, x2-x1, y2-y1], "conf": conf}
    )
    last_post = time.time()

    # Face detection
    faces = detect_faces(frame)
    for f in faces:
        x, y, w, h = f["bbox"]
        cv2.rectangle(frame, (x, y), (x+w, y+h), (0,255,0), 2)
        cv2.putText(frame, f"Face {f['confidence']:.2f}", (x, y-5),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0,255,0), 2)
    

    return frame


# --- Standalone loop (only runs if you execute this file directly) ---
if __name__ == "__main__":
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        raise RuntimeError("Cannot open camera")

    while True:
        ok, frame = cap.read()
        if not ok:
            break
        frame = run_ai_on_frame(frame)
        cv2.imshow("YOLOv8 Fire/Smoke + Box + Face Webcam", frame)
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()