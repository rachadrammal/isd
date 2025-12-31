"""
Company Management System - Python Backend
This Flask application serves as the backend API for the company management system.
Connect your AI models in the designated sections marked with # AI MODEL INTEGRATION
"""
import datetime
import uuid
from functools import wraps
from flask_migrate import Migrate


from flask import Flask, request, jsonify
from flask_cors import CORS
import jwt

#from fastapi import FastAPI
#from lag_llama import LagLlamaEstimator
#import torch


app = Flask(__name__)
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt

app.config['SQLALCHEMY_DATABASE_URI'] = (
    "postgresql://companyuser:companypass123@localhost:5432/companydb"
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
migrate = Migrate(app, db)

bcrypt = Bcrypt(app)

CORS(app)  # Enable CORS for React frontend

# Configuration
app.config['SECRET_KEY'] = 'your-secret-key-change-in-production'
app.config['JWT_EXPIRATION_HOURS'] = 24

def create_access_token(identity):
    """Create JWT access token"""
    payload = {
        'username': identity,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=app.config['JWT_EXPIRATION_HOURS'])
    }
    token = jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')
    return token

# ============================================================================
# DATABASE SETUP (Replace with actual database like PostgreSQL)
# ============================================================================
# For production, replace these in-memory data structures with database models
# Recommended: SQLAlchemy with PostgreSQL

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.String(36), primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120))
    is_active = db.Column(db.Boolean, default=True)


# Inventory data structure - separated by warehouse
class Warehouse(db.Model):
    __tablename__ = "warehouses"

    id = db.Column(db.String(36), primary_key=True)
    name = db.Column(db.String(100))
    type = db.Column(db.String(50))


class Product(db.Model):
    __tablename__ = "products"

    id = db.Column(db.String(36), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    sku = db.Column(db.String(50), unique=True, nullable=False)
    price = db.Column(db.Numeric(10, 2), default=0)



# Inventory items
class InventoryItem(db.Model):
    __tablename__ = "inventory_items"

    id = db.Column(db.String(36), primary_key=True)

    # 🔥 THIS WAS MISSING
    product_id = db.Column(
        db.String(36),
        db.ForeignKey("products.id"),
        nullable=False
    )

    warehouse_id = db.Column(
        db.String(36),
        db.ForeignKey("warehouses.id"),
        nullable=False
    )

    quantity = db.Column(db.Integer, default=0)
    min_stock = db.Column(db.Integer, default=0)
    reorder_point = db.Column(db.Integer, default=0)

    location = db.Column(db.String(100))
    expiry_date = db.Column(db.Date)




# Orders/Sales data
class Order(db.Model):
    __tablename__ = "orders"

    id = db.Column(db.String(36), primary_key=True)
    order_number = db.Column(db.String(50))
    customer_name = db.Column(db.String(200))
    total_amount = db.Column(db.Numeric(10, 2))
    status = db.Column(db.String(20))
    payment_status = db.Column(db.String(20))
    created_by = db.Column(db.String(36))
    order_date = db.Column(db.DateTime)


# Production data
production_db = {
    'products': [],
    'production_runs': [],
    'archived_runs': []
}

# Alerts data
alerts_db = []

# Camera feeds data
cameras_db = []

# ============================================================================
# AUTHENTICATION MIDDLEWARE
# ============================================================================

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')

        if not token:
            return jsonify({'message': 'Token is missing'}), 401

        try:
            if token.startswith('Bearer '):
                token = token.split(' ')[1]
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.filter_by(username=data['username']).first()

            if not current_user or not current_user.is_active:
                return jsonify({'message': 'User not found or inactive'}), 401

        except:
            return jsonify({'message': 'Token is invalid'}), 401

        return f(current_user, *args, **kwargs)

    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if current_user.role != 'admin':
            return jsonify({'message': 'Admin access required'}), 403
        return f(current_user, *args, **kwargs)
    return decorated


# ============================================================================
# AUTHENTICATION ENDPOINTS
# ============================================================================
@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json()
    print("LOGIN DATA:", data)

    username = data.get("username")
    password = data.get("password")

    user = User.query.filter_by(username=username).first()
    print("USER FOUND:", user)

    if user:
        print("HASH FROM DB:", user.password_hash)
        print("PASSWORD MATCH:", bcrypt.check_password_hash(user.password_hash, password))

    if not user or not bcrypt.check_password_hash(user.password_hash, password):
        return jsonify({"message": "Invalid credentials"}), 401

    token = create_access_token(identity=user.username)

    return jsonify({
        "token": token,
        "user": {
            "id": user.id,
            "username": user.username,
            "role": user.role,
            "name": user.name
        }
    })


#@app.route("/api/auth/login", methods=["POST"])
#def login():
 #   data = request.get_json()
  #  username = data.get("username")
   # password = data.get("password")

    #user = User.query.filter_by(username=username).first()

    ##   return jsonify({"message": "Invalid credentials"}), 401

    #token = create_access_token(identity=user.username)

    #return jsonify({
     #   "token": token,
      #  "user": {
       #     "id": user.id,
        #    "username": user.username,
         #   "role": user.role,
          #  "name": user.name
        #}
    #})


# ============================================================================
# INVENTORY ENDPOINTS
# ============================================================================

@app.route('/api/inventory/<warehouse_type>', methods=['GET'])
@token_required
def get_inventory(current_user, warehouse_type):

    results = (
        db.session.query(InventoryItem, Product)
        .join(Warehouse, InventoryItem.warehouse_id == Warehouse.id)
        .join(Product, InventoryItem.product_id == Product.id)
        .filter(Warehouse.type == warehouse_type)
        .all()
    )

    return jsonify([
        {
            "id": item.id,
            "product_id": product.name,
            "sku": product.sku,
            "quantity": item.quantity,
            "min_stock": item.min_stock,
            "price": float(product.price) if product.price else 0,
            "location": item.location or "",
            "expiry_date": item.expiry_date.isoformat() if item.expiry_date else None
        }
        for item, product in results
    ])


@app.route('/api/inventory/<warehouse_type>', methods=['POST'])
@token_required
def add_inventory_item(current_user, warehouse_type):
    data = request.get_json()

    # 1️⃣ Find warehouse
    warehouse = Warehouse.query.filter_by(type=warehouse_type).first()
    if not warehouse:
        return jsonify({"message": "Invalid warehouse"}), 400

    # 2️⃣ Find or create product (FK-safe)
    product = Product.query.filter_by(sku=data.get("sku")).first()

    if not product:
        product = Product(
                id=str(uuid.uuid4()),   
            name=data.get("product_id"),   # product name from frontend
            sku=data.get("sku"),
            price=data.get("price", 0)
        )
        db.session.add(product)
        db.session.flush()  # ✅ ensures product.id exists

    # 3️⃣ Parse expiry date safely
    expiry = None
    if data.get("expiry_date"):
        try:
            expiry = datetime.datetime.strptime(
                data["expiry_date"], "%Y-%m-%d"
            ).date()
        except ValueError:
            expiry = None

    # 4️⃣ Create inventory item
    item = InventoryItem(
    id=str(uuid.uuid4()),           # 🔥 REQUIRED
    product_id=product.id,
    warehouse_id=warehouse.id,
    quantity=int(data.get("quantity", 0)),
    min_stock=int(data.get("min_stock", 0)),
    location=data.get("location"),
    expiry_date=expiry
)


    db.session.add(item)
    db.session.commit()

    return jsonify({"message": "Product added successfully"}), 201


@app.route('/api/inventory/<item_id>', methods=['PUT'])
@token_required
def update_inventory_item(current_user, item_id):
    data = request.get_json()

    item = InventoryItem.query.get(item_id)
    if not item:
        return jsonify({"message": "Item not found"}), 404

    product = Product.query.get(item.product_id)

    # Update inventory fields
    item.quantity = int(data.get("quantity", item.quantity))
    item.min_stock = int(data.get("min_stock", item.min_stock))
    item.location = data.get("location", item.location)

    # Update product price (optional)
    if "price" in data and product:
        product.price = data["price"]

    db.session.commit()
    return jsonify({"message": "Inventory updated successfully"})

@app.route('/api/inventory/<item_id>', methods=['DELETE'])
@token_required
def delete_inventory_item(current_user, item_id):
    item = InventoryItem.query.get(item_id)
    if not item:
        return jsonify({"message": "Item not found"}), 404

    db.session.delete(item)
    db.session.commit()

    return jsonify({"message": "Item deleted successfully"})

# ============================================================================
# SALES ENDPOINTS
# ============================================================================

@app.route('/api/orders', methods=['GET'])
@token_required
def get_orders(current_user):

    orders = Order.query.order_by(Order.order_date.desc()).all()

    return jsonify([
        {
            "id": o.id,
            "order_number": o.order_number,
            "customer_name": o.customer_name,
            "total_amount": float(o.total_amount),
            "status": o.status,
            "payment_status": o.payment_status
        }
        for o in orders
    ])


    # ========================================================================
    # AI MODEL INTEGRATION - Order Analysis
    # ========================================================================
    # TODO: Add AI model to analyze order patterns and suggest optimizations
    # Example:
    # from models.order_analysis import analyze_order_pattern
    # ai_insights = analyze_order_pattern(data)
    # data['ai_insights'] = ai_insights
    # ========================================================================

    

# ============================================================================
# PRODUCTION ENDPOINTS
# ============================================================================

@app.route('/api/production/products', methods=['GET'])
@token_required
def get_production_products(current_user):
    """Get all production products with recipes"""
    if current_user['role'] not in ['admin', 'production_staff']:
        return jsonify({'message': 'Unauthorized'}), 403

    return jsonify(production_db['products'])

@app.route('/api/production/runs', methods=['GET'])
@token_required
def get_production_runs(current_user):
    """Get all production runs"""
    if current_user['role'] not in ['admin', 'production_staff']:
        return jsonify({'message': 'Unauthorized'}), 403

    return jsonify(production_db['production_runs'])

@app.route('/api/production/runs', methods=['POST'])
@token_required
def create_production_run(current_user):
    """Create new production run"""
    if current_user['role'] not in ['admin', 'production_staff']:
        return jsonify({'message': 'Unauthorized'}), 403

    data = request.get_json()
    data['id'] = str(datetime.now().timestamp())
    data['created_at'] = datetime.now().isoformat()
    data['created_by'] = current_user['username']

    production_db['production_runs'].append(data)

#app = FastAPI()

# Load model (example, adjust to your setup)
#model = LagLlamaEstimator.load_pretrained("lag-llama")

#@app.post("/forecast")
#def forecast(data: list):
    # data = your time series input
    #prediction = model.predict(torch.tensor(data))
    #return {"forecast": prediction.tolist()}

    # ========================================================================
    # AI MODEL INTEGRATION - Production Optimization
    # ========================================================================
    # TODO: Add AI model to optimize production scheduling and resource allocation
    # Example:
    # from models.production_optimizer import optimize_production_schedule
    # optimization_suggestions = optimize_production_schedule(data)
    # data['ai_optimization'] = optimization_suggestions
    # ========================================================================

    return jsonify({'message': 'Production run created successfully', 'run': data}), 201

@app.route('/api/production/runs/<run_id>', methods=['PUT'])
@token_required
def update_production_run(current_user, run_id):
    """Update production run status"""
    if current_user['role'] not in ['admin', 'production_staff']:
        return jsonify({'message': 'Unauthorized'}), 403

    data = request.get_json()

    for run in production_db['production_runs']:
        if run['id'] == run_id:
            run.update(data)
            run['updated_at'] = datetime.now().isoformat()

            # If completed, move to archive
            if data.get('status') == 'completed':
                production_db['production_runs'].remove(run)
                production_db['archived_runs'].append(run)
                return jsonify({'message': 'Production run completed and archived', 'run': run})

            return jsonify({'message': 'Production run updated successfully', 'run': run})

    return jsonify({'message': 'Production run not found'}), 404

@app.route('/api/production/runs/<run_id>/machine-status', methods=['POST'])
@token_required
def update_machine_status(current_user, run_id):
    """Update machine status for production run"""
    if current_user['role'] not in ['admin', 'production_staff']:
        return jsonify({'message': 'Unauthorized'}), 403

    data = request.get_json()
    machine_stopped = data.get('machine_stopped', False)

    for run in production_db['production_runs']:
        if run['id'] == run_id:
            run['machine_stopped'] = machine_stopped
            run['machine_status_updated_at'] = datetime.now().isoformat()

            if machine_stopped:
                run['stopped_reason'] = data.get('reason', 'Not specified')

            return jsonify({'message': 'Machine status updated', 'run': run})

    return jsonify({'message': 'Production run not found'}), 404

@app.route('/api/production/archived', methods=['GET'])
@token_required
def get_archived_production_runs(current_user):
    """Get archived production runs"""
    if current_user['role'] not in ['admin', 'production_staff']:
        return jsonify({'message': 'Unauthorized'}), 403

    return jsonify(production_db['archived_runs'])

# ============================================================================
# ALERTS & MONITORING ENDPOINTS (Admin Only)
# ============================================================================

@app.route('/api/alerts', methods=['GET'])
@token_required
@admin_required
def get_alerts(current_user):
    """Get all alerts"""
    return jsonify(alerts_db)

@app.route('/api/alerts', methods=['POST'])
@token_required
@admin_required
def create_alert(current_user):
    """Create new alert (typically called by AI detection system)"""
    data = request.get_json()
    data['id'] = str(datetime.now().timestamp())
    data['created_at'] = datetime.now().isoformat()

    alerts_db.append(data)

    return jsonify({'message': 'Alert created successfully', 'alert': data}), 201

@app.route('/api/alerts/<alert_id>', methods=['PUT'])
@token_required
@admin_required
def update_alert(current_user, alert_id):
    """Update alert status"""
    data = request.get_json()

    for alert in alerts_db:
        if alert['id'] == alert_id:
            alert.update(data)
            alert['updated_at'] = datetime.now().isoformat()
            return jsonify({'message': 'Alert updated successfully', 'alert': alert})

    return jsonify({'message': 'Alert not found'}), 404

@app.route('/api/cameras', methods=['GET'])
@token_required
@admin_required
def get_cameras(current_user):
    """Get all camera feeds"""
    return jsonify(cameras_db)

@app.route('/api/cameras/<camera_id>/analyze', methods=['POST'])
@token_required
@admin_required
def analyze_camera_feed(current_user, camera_id):
    """
    Analyze camera feed using AI models
    This endpoint receives camera frames and runs AI detection
    """
    # ========================================================================
    # AI MODEL INTEGRATION - Camera Analysis
    # ========================================================================
    # TODO: Integrate your AI models for anomaly and face detection here
    #
    # Expected workflow:
    # 1. Receive camera frame/image from request
    # 2. Run through anomaly detection model
    # 3. Run through face recognition model
    # 4. Run through safety equipment detection model
    # 5. Return results with confidence scores
    #
    # Example implementation:
    #
    # from models.anomaly_detection import detect_anomalies
    # from models.face_recognition import detect_faces
    # from models.safety_detection import detect_safety_violations
    #
    # # Get image from request
    # image_data = request.files.get('frame') or request.get_json().get('frame_base64')
    #
    # # Run AI models
    # anomalies = detect_anomalies(image_data, confidence_threshold=0.75)
    # faces = detect_faces(image_data, known_faces_db)
    # safety_violations = detect_safety_violations(image_data)
    #
    # results = {
    #     'camera_id': camera_id,
    #     'timestamp': datetime.now().isoformat(),
    #     'anomalies': anomalies,
    #     'faces': faces,
    #     'safety_violations': safety_violations
    # }
    #
    # # Create alerts for high-confidence detections
    # if anomalies and anomalies[0]['confidence'] > 0.85:
    #     create_alert_from_detection(anomalies[0], camera_id)
    #
    # return jsonify(results)
    # ========================================================================

    # Placeholder response
    return jsonify({
        'camera_id': camera_id,
        'message': 'AI models not yet integrated. Add your models in the designated section.',
        'timestamp': datetime.now().isoformat()
    })

# ============================================================================
# DASHBOARD & ANALYTICS ENDPOINTS
# ============================================================================

@app.route('/api/dashboard/stats', methods=['GET'])
@token_required
@admin_required
def get_dashboard_stats(current_user):
    """Get dashboard statistics"""

    stats = {
        'total_inventory_items': sum(len(warehouse) for warehouse in inventory_db.values()),
        'total_orders': len(orders_db),
        'active_production_runs': len(production_db['production_runs']),
        'pending_alerts': len([a for a in alerts_db if a.get('status') == 'new']),
        'revenue': sum(order.get('totalAmount', 0) 
                       for order in orders_db if order.get('status') == 'completed'),
    }

    # ========================================================================
    # AI MODEL INTEGRATION - Predictive Analytics
    # ========================================================================
    # TODO: Add AI models for business intelligence and predictions
    #
    # Example:
    # from models.sales_forecasting import predict_sales
    # from models.inventory_optimization import suggest_reorder
    # from models.production_planning import optimize_schedule
    #
    # stats['ai_predictions'] = {
    #     'sales_forecast': predict_sales(orders_db),
    #     'inventory_suggestions': suggest_reorder(inventory_db),
    #     'production_optimization': optimize_schedule(production_db)
    # }
    # ========================================================================

    return jsonify(stats)

@app.route('/api/analytics/suggestions', methods=['GET'])
@token_required
@admin_required
def get_ai_suggestions(current_user):
    """Get AI-powered business suggestions"""

    # ========================================================================
    # AI MODEL INTEGRATION - Business Intelligence
    # ========================================================================
    # TODO: Add AI models for generating business insights and suggestions
    #
    # Example:
    # from models.business_intelligence import generate_suggestions
    #
    # suggestions = generate_suggestions(
    #     inventory_data=inventory_db,
    #     sales_data=orders_db,
    #     production_data=production_db
    # )
    #
    # return jsonify(suggestions)
    # ========================================================================

    # Placeholder suggestions
    return jsonify({
        'suggestions': [
            {
                'type': 'inventory',
                'title': 'Stock Optimization',
                'description': 'AI model integration pending',
                'confidence': 0
            }
        ]
    })

# ============================================================================
# HEALTH CHECK
# ============================================================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    })

# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'message': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'message': 'Internal server error'}), 500

# ============================================================================
# RUN APPLICATION
# ============================================================================

if __name__ == '__main__':
    print("=" * 80)
    print("Company Management System - Backend Server")
    print("=" * 80)
    print("\nServer starting on http://localhost:5000")
    print("\nAI Model Integration Points:")
    print("  1. Order Analysis - /api/orders (POST)")
    print("  2. Production Optimization - /api/production/runs (POST)")
    print("  3. Camera/Anomaly Detection - /api/cameras/<id>/analyze (POST)")
    print("  4. Dashboard Analytics - /api/dashboard/stats (GET)")
    print("  5. Business Suggestions - /api/analytics/suggestions (GET)")
    print("\nSee code comments marked with 'AI MODEL INTEGRATION' for details")
    print("=" * 80)
    print("\n")

    app.run(debug=True, host='0.0.0.0', port=5000)
