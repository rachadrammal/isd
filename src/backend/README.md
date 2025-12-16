# Company Management System - Backend

## Setup Instructions

### 1. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Run the Server

```bash
python app.py
```

The server will start on `http://localhost:5000`

### 3. Update React Frontend

Update the API base URL in your React app to point to `http://localhost:5000/api`

## AI Model Integration Guide

### Where to Add Your AI Models

The backend has designated integration points marked with `# AI MODEL INTEGRATION` comments:

#### 1. Order Analysis (Sales Predictions)
**File:** `app.py` - `/api/orders` endpoint  
**Purpose:** Analyze order patterns, predict demand, suggest pricing  
**Add your model here to:**
- Predict future sales trends
- Suggest optimal pricing
- Identify popular product combinations

#### 2. Production Optimization
**File:** `app.py` - `/api/production/runs` endpoint  
**Purpose:** Optimize production scheduling and resource allocation  
**Add your model here to:**
- Optimize batch sizes
- Suggest production schedules
- Predict resource requirements

#### 3. Camera/Anomaly Detection
**File:** `app.py` - `/api/cameras/<id>/analyze` endpoint  
**Purpose:** Real-time video analysis for security and safety  
**Add your models here for:**
- Face recognition
- Anomaly detection
- Safety equipment detection
- Intrusion detection

#### 4. Dashboard Analytics
**File:** `app.py` - `/api/dashboard/stats` endpoint  
**Purpose:** Provide predictive analytics for business decisions  
**Add your models here for:**
- Sales forecasting
- Inventory optimization
- Production planning

#### 5. Business Intelligence
**File:** `app.py` - `/api/analytics/suggestions` endpoint  
**Purpose:** Generate actionable business insights  
**Add your models here for:**
- Market trend analysis
- Cost optimization
- Risk assessment

## Example AI Model Integration

```python
# Example: Adding a face recognition model

from face_recognition import face_encodings, compare_faces, load_image_file
import numpy as np

# Load known faces database
known_faces = load_known_faces_from_db()

@app.route('/api/cameras/<camera_id>/analyze', methods=['POST'])
@token_required
@admin_required
def analyze_camera_feed(current_user, camera_id):
    # Get image from request
    image_file = request.files.get('frame')
    image = load_image_file(image_file)
    
    # Detect faces
    encodings = face_encodings(image)
    
    results = []
    for encoding in encodings:
        # Compare with known faces
        matches = compare_faces(known_faces['encodings'], encoding)
        
        if True in matches:
            idx = matches.index(True)
            person_name = known_faces['names'][idx]
            results.append({'recognized': True, 'name': person_name})
        else:
            # Unknown person - create alert
            create_alert({
                'type': 'face_detection',
                'severity': 'medium',
                'description': 'Unrecognized individual detected',
                'camera_id': camera_id
            })
            results.append({'recognized': False})
    
    return jsonify({'faces': results})
```

## Database Migration (For Production)

Replace in-memory dictionaries with SQLAlchemy models:

```python
from flask_sqlalchemy import SQLAlchemy

app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://user:pass@localhost/companydb'
db = SQLAlchemy(app)

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    # ... other fields
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### Inventory
- `GET /api/inventory/<warehouse_type>` - Get warehouse inventory
- `POST /api/inventory/<warehouse_type>` - Add item
- `PUT /api/inventory/<warehouse_type>/<item_id>` - Update item
- `DELETE /api/inventory/<warehouse_type>/<item_id>` - Delete item
- `POST /api/inventory/transfer` - Transfer between warehouses

### Sales
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create order
- `PUT /api/orders/<order_id>` - Update order

### Production
- `GET /api/production/products` - Get products
- `GET /api/production/runs` - Get production runs
- `POST /api/production/runs` - Create production run
- `PUT /api/production/runs/<run_id>` - Update production run
- `POST /api/production/runs/<run_id>/machine-status` - Update machine status
- `GET /api/production/archived` - Get archived runs

### Alerts (Admin only)
- `GET /api/alerts` - Get all alerts
- `POST /api/alerts` - Create alert
- `PUT /api/alerts/<alert_id>` - Update alert
- `GET /api/cameras` - Get camera feeds
- `POST /api/cameras/<camera_id>/analyze` - Analyze camera feed with AI

### Dashboard (Admin only)
- `GET /api/dashboard/stats` - Get statistics
- `GET /api/analytics/suggestions` - Get AI suggestions
