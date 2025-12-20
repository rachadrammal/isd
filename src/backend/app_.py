"""
Company Management System - Python Backend
This Flask application serves as the backend API for the company management system.
Connect your AI models in the designated sections marked with # AI MODEL INTEGRATION
"""
import datetime
from functools import wraps

from flask import Flask, request, jsonify
from flask_cors import CORS
import jwt

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Configuration
app.config['SECRET_KEY'] = 'your-secret-key-change-in-production'
app.config['JWT_EXPIRATION_HOURS'] = 24

# ============================================================================
# DATABASE SETUP (Replace with actual database like PostgreSQL)
# ============================================================================
# For production, replace these in-memory data structures with database models
# Recommended: SQLAlchemy with PostgreSQL

users_db = {
    'admin': {
        'id': '1',
        'username': 'admin',
        'password': 'admin123',  # In production, use hashed passwords (bcrypt)
        'role': 'admin',
        'name': 'Admin User'
    },
    'inventory': {
        'id': '2',
        'username': 'inventory',
        'password': 'inventory123',
        'role': 'inventory_staff',
        'name': 'Inventory Staff'
    },
    'sales': {
        'id': '3',
        'username': 'sales',
        'password': 'sales123',
        'role': 'sales_staff',
        'name': 'Sales Staff'
    },
    'production': {
        'id': '4',
        'username': 'production',
        'password': 'production123',
        'role': 'production_staff',
        'name': 'Production Staff'
    }
}

# Inventory data structure - separated by warehouse
inventory_db = {
    'raw_materials': [],
    'wholesale': [],
    'detailed_sales': [],
    'archive': []
}

# Orders/Sales data
orders_db = []

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
            current_user = users_db.get(data['username'])
        except:
            return jsonify({'message': 'Token is invalid'}), 401

        return f(current_user, *args, **kwargs)

    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if current_user['role'] != 'admin':
            return jsonify({'message': 'Admin access required'}), 403
        return f(current_user, *args, **kwargs)
    return decorated

# ============================================================================
# AUTHENTICATION ENDPOINTS
# ============================================================================

@app.route('/api/auth/login', methods=['POST'])
def login():
    """User authentication endpoint"""
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = users_db.get(username)

    if not user or user['password'] != password:
        return jsonify({'message': 'Invalid credentials'}), 401

    # Generate JWT token
    token = jwt.encode({
        'username': username,
        'role': user['role'],
        'exp': datetime.utcnow() + timedelta(hours=app.config['JWT_EXPIRATION_HOURS'])
    }, app.config['SECRET_KEY'], algorithm='HS256')

    return jsonify({
        'token': token,
        'user': {
            'id': user['id'],
            'username': user['username'],
            'role': user['role'],
            'name': user['name']
        }
    })

# ============================================================================
# INVENTORY ENDPOINTS
# ============================================================================

@app.route('/api/inventory/<warehouse_type>', methods=['GET'])
@token_required
def get_inventory(current_user, warehouse_type):
    """Get inventory for a specific warehouse"""
    if warehouse_type not in ['raw_materials', 'wholesale', 'detailed_sales', 'archive']:
        return jsonify({'message': 'Invalid warehouse type'}), 400

    return jsonify(inventory_db[warehouse_type])

@app.route('/api/inventory/<warehouse_type>', methods=['POST'])
@token_required
def add_inventory_item(current_user, warehouse_type):
    """Add new item to warehouse"""
    if current_user['role'] not in ['admin', 'inventory_staff']:
        return jsonify({'message': 'Unauthorized'}), 403

    if warehouse_type not in ['raw_materials', 'wholesale', 'detailed_sales']:
        return jsonify({'message': 'Invalid warehouse type'}), 400

    data = request.get_json()
    data['id'] = str(datetime.now().timestamp())
    data['warehouse'] = warehouse_type
    data['created_at'] = datetime.now().isoformat()

    inventory_db[warehouse_type].append(data)

    return jsonify({'message': 'Item added successfully', 'item': data}), 201

@app.route('/api/inventory/<warehouse_type>/<item_id>', methods=['PUT'])
@token_required
def update_inventory_item(current_user, warehouse_type, item_id):
    """Update inventory item"""
    if current_user['role'] not in ['admin', 'inventory_staff']:
        return jsonify({'message': 'Unauthorized'}), 403

    data = request.get_json()

    for item in inventory_db[warehouse_type]:
        if item['id'] == item_id:
            item.update(data)
            item['updated_at'] = datetime.now().isoformat()
            return jsonify({'message': 'Item updated successfully', 'item': item})

    return jsonify({'message': 'Item not found'}), 404

@app.route('/api/inventory/<warehouse_type>/<item_id>', methods=['DELETE'])
@token_required
def delete_inventory_item(current_user, warehouse_type, item_id):
    """Delete inventory item"""
    if current_user['role'] not in ['admin', 'inventory_staff']:
        return jsonify({'message': 'Unauthorized'}), 403

    inventory_db[warehouse_type] = [
        item for item in inventory_db[warehouse_type] if item['id'] != item_id
    ]

    return jsonify({'message': 'Item deleted successfully'})

@app.route('/api/inventory/transfer', methods=['POST'])
@token_required
def transfer_inventory(current_user):
    """Transfer items between warehouses"""
    if current_user['role'] not in ['admin', 'inventory_staff']:
        return jsonify({'message': 'Unauthorized'}), 403

    data = request.get_json()
    from_warehouse = data.get('from_warehouse')
    to_warehouse = data.get('to_warehouse')
    item_id = data.get('item_id')
    quantity = data.get('quantity', 0)

    # Find item in source warehouse
    item = None
    for idx, inv_item in enumerate(inventory_db[from_warehouse]):
        if inv_item['id'] == item_id:
            item = inv_item
            break

    if not item:
        return jsonify({'message': 'Item not found in source warehouse'}), 404

    if quantity > 0 and quantity < item.get('quantity', 0):
        # Partial transfer - split the item
        new_item = item.copy()
        new_item['id'] = str(datetime.now().timestamp())
        new_item['quantity'] = quantity
        new_item['warehouse'] = to_warehouse
        new_item['transferred_at'] = datetime.now().isoformat()

        item['quantity'] -= quantity
        inventory_db[to_warehouse].append(new_item)
    else:
        # Full transfer
        inventory_db[from_warehouse].remove(item)
        item['warehouse'] = to_warehouse
        item['transferred_at'] = datetime.now().isoformat()
        inventory_db[to_warehouse].append(item)

    return jsonify({'message': 'Transfer successful'})

# ============================================================================
# SALES ENDPOINTS
# ============================================================================

@app.route('/api/orders', methods=['GET'])
@token_required
def get_orders(current_user):
    """Get all orders"""
    if current_user['role'] not in ['admin', 'sales_staff']:
        return jsonify({'message': 'Unauthorized'}), 403

    return jsonify(orders_db)

@app.route('/api/orders', methods=['POST'])
@token_required
def create_order(current_user):
    """Create new order"""
    if current_user['role'] not in ['admin', 'sales_staff']:
        return jsonify({'message': 'Unauthorized'}), 403

    data = request.get_json()
    data['id'] = str(datetime.now().timestamp())
    data['created_at'] = datetime.now().isoformat()
    data['created_by'] = current_user['username']

    orders_db.append(data)

    # ========================================================================
    # AI MODEL INTEGRATION - Order Analysis
    # ========================================================================
    # TODO: Add AI model to analyze order patterns and suggest optimizations
    # Example:
    # from models.order_analysis import analyze_order_pattern
    # ai_insights = analyze_order_pattern(data)
    # data['ai_insights'] = ai_insights
    # ========================================================================

    return jsonify({'message': 'Order created successfully', 'order': data}), 201

@app.route('/api/orders/<order_id>', methods=['PUT'])
@token_required
def update_order(current_user, order_id):
    """Update order status"""
    if current_user['role'] not in ['admin', 'sales_staff']:
        return jsonify({'message': 'Unauthorized'}), 403

    data = request.get_json()

    for order in orders_db:
        if order['id'] == order_id:
            order.update(data)
            order['updated_at'] = datetime.now().isoformat()
            return jsonify({'message': 'Order updated successfully', 'order': order})

    return jsonify({'message': 'Order not found'}), 404

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
