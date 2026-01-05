"""
Company Management System - Python Backend
This Flask application serves as the backend API for the company management system.
Connect your AI models in the designated sections marked with # AI MODEL INTEGRATION
"""

import uuid
from functools import wraps
from flask_migrate import Migrate
import requests

from datetime import datetime, timedelta, timezone
from flask import Flask, request, jsonify
from flask_cors import CORS
import jwt
from sympy import product

#from fastapi import FastAPI
#from lag_llama import LagLlamaEstimator
#import torch


app = Flask(__name__)
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}}, supports_credentials=True)

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

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

CAMERA_ID = "cam_wharehouse"
BACKEND_URL = "http://localhost:5000/api/alerts"
TOKEN = "YOUR_JWT_TOKEN"
HEADERS = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}
UTC = timezone.utc

def create_access_token(identity):
    payload = {
        'username': identity,
        'exp': datetime.now(UTC) + timedelta(hours=app.config['JWT_EXPIRATION_HOURS'])
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
    description = db.Column(db.Text)
    category = db.Column(db.String(100))
    price = db.Column(db.Numeric(10, 2))
    cost = db.Column(db.Numeric(10, 2))




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


# Inventory change archive/log
class InventoryArchive(db.Model):
    __tablename__ = "inventory_archive"

    id = db.Column(db.String(36), primary_key=True)
    item_id = db.Column(db.String(36), nullable=False)
    sku = db.Column(db.String(50))
    field = db.Column(db.String(50))
    old_value = db.Column(db.String(255))
    new_value = db.Column(db.String(255))
    edited_by = db.Column(db.String(80))
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(UTC))

# Orders/Sales data
class Order(db.Model):
    __tablename__ = "orders"

    id = db.Column(db.String(36), primary_key=True)
    order_number = db.Column(db.String(50))
    customer_name = db.Column(db.String(200))
    customer_email = db.Column(db.String(120))  
    total_amount = db.Column(db.Numeric(10, 2))
    status = db.Column(db.String(20))
    payment_status = db.Column(db.String(20))
    created_by = db.Column(db.String(36))
    order_date = db.Column(db.DateTime)
    delivery_date = db.Column(db.Date)  

class OrderItem(db.Model):
    __tablename__ = "order_items"

    id = db.Column(db.String(36), primary_key=True)
    order_id = db.Column(db.String(36), db.ForeignKey("orders.id"), nullable=False)
    product_id = db.Column(db.String(36), db.ForeignKey("products.id"), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Numeric(10, 2), nullable=False)
    total_price = db.Column(db.Numeric(10, 2), nullable=False) 
     
class OrderArchive(db.Model):
    __tablename__ = "order_archive"

    id = db.Column(db.String(36), primary_key=True)
    order_id = db.Column(db.String(36), nullable=False)
    customer_name = db.Column(db.String(200))
    customer_email = db.Column(db.String(120))
    action = db.Column(db.String(50), nullable=False)
    performed_by = db.Column(db.String(80), nullable=False)
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(UTC))
    total_amount = db.Column(db.Numeric(10, 2))

class OrderItemArchive(db.Model):
    __tablename__ = "order_items_archive"

    id = db.Column(db.String(36), primary_key=True)   # ✅ Primary key
    order_archive_id = db.Column(db.String(36), db.ForeignKey("order_archive.id"), nullable=False)
    product_id = db.Column(db.String(36))
    quantity = db.Column(db.Integer)
    unit_price = db.Column(db.Numeric(10, 2))
    total_price = db.Column(db.Numeric(10, 2))
# Production data

class ProductionLine(db.Model):
        __tablename__ = "production_lines"
        id = db.Column(db.String(36), primary_key=True)   # ✅ must be PK
        name = db.Column(db.String(100), nullable=False)
        product_id = db.Column(db.String(36), db.ForeignKey("products.id"), nullable=True)
        status = db.Column(db.String(20), nullable=False)  # operational, stopped, maintenance
        capacity_per_hour = db.Column(db.Integer, default=0)
        location = db.Column(db.String(100))
        last_maintenance = db.Column(db.DateTime)
        next_maintenance = db.Column(db.DateTime)

class ProductionRun(db.Model):
    __tablename__ = "production_runs"

    id = db.Column(db.String(36), primary_key=True)
    run_number = db.Column(db.String(50))
    product_id = db.Column(db.String(36), db.ForeignKey("products.id"), nullable=False)
    production_line_id = db.Column(db.String(36), db.ForeignKey("production_lines.id"))
    quantity = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), nullable=False)
    machine_stopped = db.Column(db.Boolean, default=False)
    stop_reason = db.Column(db.Text)
    start_date = db.Column(db.DateTime)
    completion_date = db.Column(db.DateTime)
    assigned_to = db.Column(db.String(100))
    created_by = db.Column(db.String(36), nullable=False)
  
class RecipeItem(db.Model):
    __tablename__ = "recipe_items"
    id = db.Column(db.String(36), primary_key=True)
    product_id = db.Column(db.String(36), db.ForeignKey("products.id"), nullable=False)
    ingredient_id = db.Column(db.String(36), nullable=False)
    quantity = db.Column(db.Numeric(10, 2), nullable=False)
    unit = db.Column(db.String(20))

    
production_db = {
    'products': [],
    'production_runs': [],
    'archived_runs': []
}

# Alerts data
class Alert(db.Model):
    __tablename__ = "alerts"

    id = db.Column(db.String(36), primary_key=True)
    type = db.Column(db.String(50), nullable=False)
    severity = db.Column(db.String(20), nullable=False)
    title = db.Column(db.String(200))
    description = db.Column(db.Text, nullable=False)
    camera_id = db.Column(db.String(36), nullable=False)
    production_run_id = db.Column(db.String(36))
    inventory_item_id = db.Column(db.String(36))
    status = db.Column(db.String(20), default="new")
    ai_confidence = db.Column(db.Numeric(5, 2))
    data = db.Column(db.JSON)
    acknowledged_by = db.Column(db.String(36))
    acknowledged_at = db.Column(db.DateTime)
    resolved_by = db.Column(db.String(36))
    resolved_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

inventory_db = []
alerts_db = []
orders_db = []
# Camera feeds data
class Camera(db.Model):
    __tablename__ = "cameras"

    id = db.Column(db.String(36), primary_key=True)
    name = db.Column(db.String(100))
    location = db.Column(db.String(200))
    ip_address = db.Column(db.String(45))
    port = db.Column(db.Integer)
    status = db.Column(db.String(20))
    ai_enabled = db.Column(db.Boolean)
    ai_model = db.Column(db.String(100))
    last_active = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


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
            name=data.get("product_id"),   
            sku=data.get("sku"),
            price=data.get("price", 0)
        )
        db.session.add(product)
        db.session.flush() 


    expiry = None
    if data.get("expiry_date"):
        try:
            expiry = datetime.datetime.strptime(
                data["expiry_date"], "%Y-%m-%d"
            ).date()
        except ValueError:
            expiry = None

   
    item = InventoryItem(
    id=str(uuid.uuid4()),           
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

@app.route('/api/inventory/transfer', methods=['POST'])
@token_required
def transfer_inventory_item(current_user):
    data = request.get_json()
    source_type = data.get("sourceWarehouse")
    target_type = data.get("targetWarehouse")
    item_id = data.get("id")
    qty = int(data.get("qty", 0))

    if not source_type or not target_type or not item_id or qty <= 0:
        return jsonify({"message": "Invalid transfer request"}), 400

    # Find source warehouse
    source_warehouse = Warehouse.query.filter_by(type=source_type).first()
    target_warehouse = Warehouse.query.filter_by(type=target_type).first()
    if not source_warehouse or not target_warehouse:
        return jsonify({"message": "Invalid warehouse"}), 400

    # Find item in source warehouse
    item = InventoryItem.query.get(item_id)
    if not item or item.warehouse_id != source_warehouse.id:
        return jsonify({"message": "Item not found in source warehouse"}), 404

    if item.quantity < qty:
        return jsonify({"message": "Not enough stock to transfer"}), 400

    # Deduct from source
    item.quantity -= qty

    # Add to target (create if not exists)
    target_item = InventoryItem.query.filter_by(
        product_id=item.product_id,
        warehouse_id=target_warehouse.id
    ).first()

    if not target_item:
        target_item = InventoryItem(
            id=str(uuid.uuid4()),
            product_id=item.product_id,
            warehouse_id=target_warehouse.id,
            quantity=0,
            min_stock=item.min_stock,
            location=item.location,
            expiry_date=item.expiry_date
        )
        db.session.add(target_item)

    target_item.quantity += qty

    # Archive log
    archive = InventoryArchive(
        id=str(uuid.uuid4()),
        item_id=item.id,
        sku=Product.query.get(item.product_id).sku,
        field="transfer",
        old_value=f"{qty} moved from {source_type}",
        new_value=f"{qty} added to {target_type}",
        edited_by=current_user.username,
    )
    db.session.add(archive)

    db.session.commit()
    return jsonify({"message": "Transfer successful"}), 200

@app.route('/api/inventory/<item_id>', methods=['PUT'])
@token_required
def update_inventory_item(current_user, item_id):
    data = request.get_json()
    item = InventoryItem.query.get(item_id)
    if not item:
        return jsonify({"message": "Item not found"}), 404

    product = Product.query.get(item.product_id)

    # Handle InventoryItem fields
    for field in ["quantity", "min_stock", "location"]:
        old_val = getattr(item, field)
        new_val = data.get(field, old_val)

        if str(old_val) != str(new_val):
            archive = InventoryArchive(
                id=str(uuid.uuid4()),
                item_id=item.id,
                sku=product.sku if product else None,
                field=field,
                old_value=str(old_val),
                new_value=str(new_val),
                edited_by=current_user.username,
            )
            db.session.add(archive)

        setattr(item, field, new_val)

    # Handle Product price separately
    if "price" in data and product:
        old_val = str(product.price)
        new_val = str(data["price"])
        if old_val != new_val:
            archive = InventoryArchive(
                id=str(uuid.uuid4()),
                item_id=item.id,
                sku=product.sku,
                field="price",
                old_value=old_val,
                new_value=new_val,
                edited_by=current_user.username,
            )
            db.session.add(archive)
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

@app.route('/api/inventory/archive', methods=['GET'])
@token_required
@admin_required
def get_archive(current_user):
    logs = InventoryArchive.query.order_by(InventoryArchive.timestamp.desc()).all()
    return jsonify([
        {
            "id": log.id,
            "item_id": log.item_id,
            "sku": log.sku,
            "field": log.field,
            "old_value": log.old_value,
            "new_value": log.new_value,
            "edited_by": log.edited_by,
            "timestamp": log.timestamp.isoformat(),
        }
        for log in logs
    ])

# ============================================================================
# SALES ENDPOINTS
# ============================================================================

@app.route('/api/orders', methods=['GET'])
@token_required
def get_orders(current_user):
    orders = Order.query.order_by(Order.order_date.desc()).all()

  
    order_ids = [o.id for o in orders]
    items = OrderItem.query.filter(OrderItem.order_id.in_(order_ids)).all()

    items_by_order = {}
    for it in items:
        items_by_order.setdefault(it.order_id, []).append({
            "productId": it.product_id,
            "productName": "",  
            "quantity": it.quantity,
            "price": float(it.unit_price),
            "subtotal": float(it.total_price)
        })

    def as_str_date(dt):
        return dt.isoformat() if dt else None

    result = []
    for o in orders:
        result.append({
            "id": o.id,
            "orderNumber": o.order_number or "",
            "customerName": o.customer_name or "",
            "customerEmail": o.customer_email or "",  
            "items": items_by_order.get(o.id, []),    
            "totalAmount": float(o.total_amount or 0),
            "status": o.status or "pending",
            "orderDate": as_str_date(o.order_date),  
            "deliveryDate": o.delivery_date.isoformat() if o.delivery_date else None
        })
    return jsonify(result)
    
@app.route('/api/orders', methods=['POST'])
@token_required
def create_order(current_user):
    data = request.get_json()

    order = Order(
        id=str(uuid.uuid4()),
        order_number=data.get("orderNumber"),
        customer_name=data.get("customerName"),
        customer_email=data.get("customerEmail"),  # accept it
        total_amount=data.get("totalAmount") or 0,
        status="pending",
        payment_status="unpaid",
        created_by=current_user.id,
        order_date=datetime.now(UTC),
        delivery_date=datetime.strptime(data.get("deliveryDate"), "%Y-%m-%d").date() if data.get("deliveryDate") else None
    )
    db.session.add(order)
    db.session.flush()

    for item in data.get("items", []):
        db.session.add(OrderItem(
            id=str(uuid.uuid4()),
            order_id=order.id,
            product_id=item["productId"],
            quantity=item["quantity"],
            unit_price=item["price"],
            total_price=item["quantity"] * item["price"]

        ))

    db.session.commit()

    return jsonify({
        "id": order.id,
        "orderNumber": order.order_number,
        "customerName": order.customer_name,
        "customerEmail": order.customer_email or "",
      "items": [
    {
        "productId": i.product_id,
        "productName": "", 
        "quantity": i.quantity,
        "price": float(i.unit_price),
        "subtotal": float(i.total_price)
    }
    for i in OrderItem.query.filter_by(order_id=order.id).all()
],
        "totalAmount": float(order.total_amount or 0),
        "status": order.status,
        "orderDate": order.order_date.isoformat() if order.order_date else None,
        "deliveryDate": order.delivery_date.isoformat() if order.delivery_date else None
    }), 201

 

@app.route('/api/products', methods=['GET'])
@token_required
def get_products(current_user):
    products = Product.query.all()
    return jsonify([
        {
            "id": p.id,
            "name": p.name,
            "sku": p.sku,
            "price": float(p.price) if p.price else 0,
            "recipe": [
                {
                    "ingredientId": ri.ingredient_id,
                    "ingredientName": ri.ingredient_id,
                    "quantity": float(ri.quantity),
                    "unit": ri.unit
                }
                for ri in RecipeItem.query.filter_by(product_id=p.id).all()
            ],
            "productionTime": 120,
            "unitsPerRun": 50
        }
        for p in products
    ])
@app.route('/api/products', methods=['POST'])
@token_required
def create_product(current_user):
    data = request.get_json()
    if not data.get("name") or data.get("price") is None:
        return jsonify({"message": "Missing required fields"}), 400

    product = Product(
        id=str(uuid.uuid4()),
        name=data["name"],
        sku=data.get("sku") or str(uuid.uuid4())[:8],  # ensure required
        price=data["price"],
    )
    db.session.add(product)
    db.session.commit()

    return jsonify({
        "id": product.id,
        "name": product.name,
        "price": float(product.price)
    }), 201

@app.route('/api/orders/<order_id>/status', methods=['PUT'])
@token_required
def update_order_status(current_user, order_id):
    data = request.get_json()
    new_status = data.get("status")

    order = Order.query.get(order_id)
    if not order:
        return jsonify({"message": "Order not found"}), 404

    if new_status in ["pending", "processing"]:
        # ✅ Just update status, keep order active
        order.status = new_status
        db.session.commit()
        return jsonify({"message": f"Order status updated to {new_status}"}), 200

    elif new_status in ["completed", "cancelled"]:
        # ✅ Archive the order
        archive = OrderArchive(
            id=str(uuid.uuid4()),
            order_id=order.id,
            customer_name=order.customer_name,
            customer_email=order.customer_email,
            action=new_status,
            performed_by=current_user.username,
            total_amount=order.total_amount
        )
        db.session.add(archive)
        db.session.flush()

        items = OrderItem.query.filter_by(order_id=order.id).all()
        for it in items:
            db.session.add(OrderItemArchive(
                id=str(uuid.uuid4()),
                order_archive_id=archive.id,
                product_id=it.product_id,
                quantity=it.quantity,
                unit_price=it.unit_price,
                total_price=it.total_price,
            ))

        for it in items:
            db.session.delete(it)
        db.session.delete(order)

        db.session.commit()
        return jsonify({"message": f"Order moved to archive as {new_status}"}), 200

    else:
        return jsonify({"message": "Invalid status"}), 400
    
@app.route('/api/revenue', methods=['GET'])
@token_required
def get_total_revenue(current_user):
    completed = OrderArchive.query.filter_by(action="completed").all()
    total = sum([float(o.total_amount or 0) for o in completed])
    return jsonify({"totalRevenue": round(total, 2)})

@app.route('/api/orders/archive', methods=['GET'])
@token_required
def get_order_archive(current_user):
    archives = OrderArchive.query.order_by(OrderArchive.timestamp.desc()).all()
    return jsonify([
        {
            "id": a.id,
            "orderId": a.order_id,
            "customerName": a.customer_name,
            "customerEmail": a.customer_email,
            "action": a.action,
            "performedBy": a.performed_by,
            "timestamp": a.timestamp.isoformat(),
            "items": [
                {
                    "productId": it.product_id,
                    "quantity": it.quantity,
                    "unitPrice": float(it.unit_price),
                    "totalPrice": float(it.total_price),
                }
                for it in OrderItemArchive.query.filter_by(order_archive_id=a.id).all()
            ]
        }
        for a in archives
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
@app.route('/api/production/lines', methods=['GET'])
@token_required
def get_production_lines(current_user):
    lines = ProductionLine.query.all()
    return jsonify([
        {
            "id": l.id,
            "name": l.name,
            "productId": l.product_id,
            "status": l.status,
            "capacityPerHour": l.capacity_per_hour,
            "location": l.location,
            "lastMaintenance": l.last_maintenance.isoformat() if l.last_maintenance else None,
            "nextMaintenance": l.next_maintenance.isoformat() if l.next_maintenance else None,
        }
        for l in lines
    ])
@app.route('/api/production/products', methods=['GET'])
@token_required
def get_production_products(current_user):
    """Get all production products with recipes"""
    if current_user.role not in ['admin', 'production_staff']:
        return jsonify({'message': 'Unauthorized'}), 403

    products = Product.query.all()
    result = []

    for p in products:
        recipe_items = RecipeItem.query.filter_by(product_id=p.id).all()
        recipe = [
            {
                "ingredientId": ri.ingredient_id,
                "ingredientName": ri.ingredient_id,  # you can join with Product table if ingredients are stored there
                "quantity": float(ri.quantity),
                "unit": ri.unit
            }
            for ri in recipe_items
        ]

        result.append({
            "id": p.id,
            "name": p.name,
            "sku": p.sku,
            "recipe": recipe,
            "productionTime": 120,   # placeholder until you add column
            "unitsPerRun": 50        # placeholder until you add column
        })

    return jsonify(result)

@app.route('/api/production/runs', methods=['GET'])
@token_required
def get_production_runs(current_user):
    if current_user.role not in ['admin', 'production_staff']:
        return jsonify({'message': 'Unauthorized'}), 403

    runs = ProductionRun.query.all()
    return jsonify([
        {
            "id": r.id,
            "productId": r.product_id,
             "productName": (db.session.get(Product, r.product_id).name if r.product_id else None),
            "runNumber": r.run_number,
            "productionLineId": r.production_line_id,
            "quantity": r.quantity,
            "status": r.status,
            "machineStopped": r.machine_stopped,
            "stopReason": r.stop_reason,
            "startDate": r.start_date.isoformat() if r.start_date else None,   # ✅ fixed
            "completionDate": r.completion_date.isoformat() if r.completion_date else None,
            "assignedTo": r.assigned_to,
            "createdBy": r.created_by,
        }
        for r in runs
    ])
@app.route('/api/production/runs/<string:run_id>', methods=['GET'])
@token_required
def get_production_run(current_user, run_id):
    if current_user.role not in ['admin', 'production_staff']:
        return jsonify({'message': 'Unauthorized'}), 403

    # Find run by run_number (frontend sends run_001, run_002, etc.)
    run = ProductionRun.query.filter(
        (ProductionRun.id == run_id) | (ProductionRun.run_number == run_id)
    ).first()

    if not run:
        return jsonify({'message': 'Run not found'}), 404

    # Get product name safely
    product = db.session.get(Product, run.product_id) if run.product_id else None

    return jsonify({
        "id": run.id,
        "productId": run.product_id,
        "productName": product.name if product else None,
        "runNumber": run.run_number,
        "productionLineId": run.production_line_id,
        "quantity": run.quantity,
        "status": run.status,
        "machineStopped": run.machine_stopped,
        "stopReason": run.stop_reason,
        "startDate": run.start_date.isoformat() if run.start_date else None,
        "completionDate": run.completion_date.isoformat() if run.completion_date else None,
        "assignedTo": run.assigned_to,
        "createdBy": run.created_by,
        "recipe" : run.recipe
    })

@app.route('/api/production/runs', methods=['POST'])
@token_required
def create_production_run(current_user):
    if current_user.role not in ['admin', 'production_staff']:
        return jsonify({'message': 'Unauthorized'}), 403

    data = request.get_json()

    run = ProductionRun(
        id=str(uuid.uuid4()),
        run_number=data.get("run_number"),
        product_id=data.get("product_id"),
        production_line_id=data.get("production_line_id"),
        quantity=data.get("quantity"),
        status=data.get("status", "planned"),
        machine_stopped=data.get("machine_stopped", False),
        start_date=datetime.strptime(data.get("start_date"), "%Y-%m-%d") if data.get("start_date") else None,
        assigned_to=data.get("assigned_to"),
        created_by=current_user.id
    )
    db.session.add(run)
    db.session.commit()

    # ✅ Safely fetch product name
    product = db.session.get(Product, run.product_id) if run.product_id else None

    return jsonify({
        "run": {
            "id": run.id,
            "runNumber": run.run_number,
            "productId": run.product_id,
            "productName": product.name if product else "",   # ✅ always return string
            "productionLineId": run.production_line_id,
            "quantity": run.quantity,
            "status": run.status,
            "machineStopped": run.machine_stopped,
            "stopReason": run.stop_reason or "",              # ✅ avoid undefined
            "startDate": run.start_date.isoformat() if run.start_date else None,
            "completionDate": run.completion_date.isoformat() if run.completion_date else None,
            "assignedTo": run.assigned_to or "",              # ✅ avoid undefined
            "createdBy": run.created_by,
        }
    }), 201
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

from datetime import datetime, UTC

@app.route('/api/production/runs/<string:run_number>', methods=['PUT'])
@token_required
def update_production_run(current_user, run_number):
    if current_user.role not in ['admin', 'production_staff']:
        return jsonify({'message': 'Unauthorized'}), 403

    # Find run by run_number instead of id
    run = ProductionRun.query.filter_by(run_number=run_number).first()
    if not run:
        return jsonify({'message': 'Run not found'}), 404

    data = request.get_json()

    # Update status
    if "status" in data:
        run.status = data["status"]
        if run.status == "completed":
            run.completion_date = datetime.now(UTC)

    # Update machine state
    if "machineStopped" in data:
        run.machine_stopped = data["machineStopped"]

    if "stopReason" in data:
        run.stop_reason = data["stopReason"]

    if "assignedTo" in data:
        run.assigned_to = data["assignedTo"]

    db.session.commit()

    product = db.session.get(Product, run.product_id) if run.product_id else None

    return jsonify({
        "run": {
            "id": run.id,
            "productId": run.product_id,
            "productName": product.name if product else None,
            "runNumber": run.run_number,
            "productionLineId": run.production_line_id,
            "quantity": run.quantity,
            "status": run.status,
            "machineStopped": run.machine_stopped,
            "stopReason": run.stop_reason,
            "startDate": run.start_date.isoformat() if run.start_date else None,
            "completionDate": run.completion_date.isoformat() if run.completion_date else None,
            "assignedTo": run.assigned_to,
            "createdBy": run.created_by,
        }
    })

@app.route('/api/production/lines/<string:line_id>', methods=['PUT'])
@token_required
def update_production_line_status(current_user, line_id):
    if current_user.role not in ['admin', 'production_staff']:
        return jsonify({'message': 'Unauthorized'}), 403

    line = ProductionLine.query.filter_by(id=line_id).first()
    if not line:
        return jsonify({'message': 'Line not found'}), 404

    data = request.get_json()
    line.status = data.get("status", line.status)
    db.session.commit()

    return jsonify({
        "line": {
            "id": line.id,
            "name": line.name,
            "productId": line.product_id,
            "status": line.status,
            "capacityPerHour": line.capacity_per_hour,
            "location": line.location,
            "lastMaintenance": line.last_maintenance.isoformat() if line.last_maintenance else None,
            "nextMaintenance": line.next_maintenance.isoformat() if line.next_maintenance else None,
        }
    })

@app.route('/api/production/runs/<string:run_id>/machine-status', methods=['GET'])
@token_required
def get_machine_status(current_user, run_id):
    if current_user.role not in ['admin', 'production_staff']:
        return jsonify({'message': 'Unauthorized'}), 403

    run = ProductionRun.query.filter_by(run_number=run_id).first()
    if not run:
        return jsonify({'message': 'Run not found'}), 404

    return jsonify({
        "runNumber": run.run_number,
        "machineStopped": run.machine_stopped,
        "stopReason": run.stop_reason
    })
@app.route('/api/production/archived', methods=['GET'])
@token_required
def get_archived_production_runs(current_user):
    if current_user.role not in ['admin', 'production_staff']:
        return jsonify({'message': 'Unauthorized'}), 403

    runs = ProductionRun.query.filter_by(status="completed").all()
    return jsonify([
        {
            "id": r.id,
            "productId": r.product_id,
           "productName": (db.session.get(Product, r.product_id).name if r.product_id else None),
            "runNumber": r.run_number,
            "productionLineId": r.production_line_id,
            "quantity": r.quantity,
            "status": r.status,
            "machineStopped": r.machine_stopped,
            "stopReason": r.stop_reason,
            "startDate": r.start_date.isoformat() if r.start_date else None,
            "completionDate": r.completion_date.isoformat() if r.completion_date else None,  # ✅ fixed
            "assignedTo": r.assigned_to,
            "createdBy": r.created_by,
        }
        for r in runs
    ])
@app.route('/api/production/runs/<string:run_id>/machine-status', methods=['POST'])
@token_required
def update_machine_status(current_user, run_id):
    if current_user.role not in ['admin', 'production_staff']:
        return jsonify({'message': 'Unauthorized'}), 403

    run = ProductionRun.query.filter_by(id=run_id).first()
    if not run:
        return jsonify({'message': 'Run not found'}), 404

    data = request.get_json()
    run.machine_stopped = data.get("machine_stopped", run.machine_stopped)
    run.stop_reason = data.get("reason", run.stop_reason)

    db.session.commit()

    product = db.session.get(Product, run.product_id) if run.product_id else None

    return jsonify({
        "run": {
            "id": run.id,
            "productId": run.product_id,
            "productName": product.name if product else None,
            "runNumber": run.run_number,
            "productionLineId": run.production_line_id,
            "quantity": run.quantity,
            "status": run.status,
            "machineStopped": run.machine_stopped,
            "stopReason": run.stop_reason,
            "startDate": run.start_date.isoformat() if run.start_date else None,
            "completionDate": run.completion_date.isoformat() if run.completion_date else None,
            "assignedTo": run.assigned_to,
            "createdBy": run.created_by,
        }
    })
# ============================================================================
# ALERTS & MONITORING ENDPOINTS (Admin Only)
# ============================================================================
@app.route("/api/alerts", methods=["POST"])
@token_required
def post_alert(alert_type, severity, message, metadata=None):
    payload = {
        "id": str(uuid.uuid4()),
        "type": alert_type,
        "severity": severity,
        "title": f"{alert_type.capitalize()} Alert",
        "description": message,
        "camera_id": CAMERA_ID,
        "ai_confidence": metadata.get("conf", 0),
        "data": metadata or {},
        "timestamp": datetime.now(UTC).isoformat()
    }
    try:
        r = requests.post(BACKEND_URL, json=payload, headers=HEADERS, timeout=5)
        print("Alert posted:", r.status_code, message)
    except Exception as e:
        print("Error posting alert:", e)

@app.route("/api/alerts", methods=["GET"])
@token_required
def list_alerts_admin(current_user):
    alerts = Alert.query.order_by(Alert.created_at.desc()).all()
    return jsonify([
        {
            "id": a.id,
            "cameraId": a.camera_id,
            "type": a.type,
            "severity": a.severity,
            "description": a.description,
            "timestamp": a.created_at.isoformat(),
            "status": a.status,
            "aiConfidence": float(a.ai_confidence),
            "imageUrl": None
        } for a in alerts
    ])

@app.route("/api/alerts", methods=["POST"])
@token_required
def create_alert_admin(current_user):
    data = request.get_json()
    alert = Alert(
        id=data.get("id", str(uuid.uuid4())),
        type=data["type"],
        severity=data["severity"],
        title=data.get("title", ""),
        description=data["description"],
        camera_id=data["camera_id"],
        status="new",
        ai_confidence=data.get("ai_confidence", 0),
        data=data.get("data", {}),
        created_at=datetime.now(timezone.utc)
    )
    db.session.add(alert)
    db.session.commit()
    return jsonify({"message": "Alert stored"}), 201





# -------------------------
# ALERTS ENDPOINTS
# -------------------------

@app.route("/api/alerts", methods=["POST"])
@token_required
def create_alert(current_user):
    data = request.get_json()
    alert = Alert(
        id=data.get("id", str(uuid.uuid4())),
        type=data["type"],
        severity=data["severity"],
        title=data.get("title", ""),
        description=data["description"],
        camera_id=data["camera_id"],
        status=data.get("status", "new"),
        ai_confidence=data.get("ai_confidence", 0),
        data=data.get("data", {}),
        created_at=datetime.now(timezone.utc)
    )
    db.session.add(alert)
    db.session.commit()
    return jsonify({"message": "Alert stored"}), 201


@app.route("/api/alerts", methods=["GET"])
@token_required
def get_alerts(current_user):
    alerts = Alert.query.order_by(Alert.created_at.desc()).all()
    return jsonify([
        {
            "id": a.id,
            "cameraId": a.camera_id,
            "type": a.type,
            "severity": a.severity,
            "title": a.title,
            "description": a.description,
            "timestamp": a.created_at.isoformat(),
            "status": a.status,
            "aiConfidence": float(a.ai_confidence or 0),
            "data": a.data
        } for a in alerts
    ])


@app.route("/api/alerts/<alert_id>/status", methods=["PUT"])
@token_required
def update_alert_status(current_user, alert_id):
    data = request.get_json()
    alert = Alert.query.get(alert_id)
    if not alert:
        return jsonify({"error": "Alert not found"}), 404

    alert.status = data.get("status", alert.status)
    if alert.status == "acknowledged":
        alert.acknowledged_by = current_user.id
        alert.acknowledged_at = datetime.now(timezone.utc)
    elif alert.status == "resolved":
        alert.resolved_by = current_user.id
        alert.resolved_at = datetime.now(timezone.utc)

    db.session.commit()
    return jsonify({"message": "Status updated"})

@app.route("/api/cameras", methods=["GET"])
@token_required
def list_cameras(current_user):
    cameras = Camera.query.all()
    return jsonify([
        {
            "id": c.id,
            "name": c.name,
            "location": c.location,
            "status": c.status,
            "aiEnabled": c.ai_enabled,
            "thumbnail": None  # optional field for frontend
        } for c in cameras
    ])


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

@app.route("/hello", methods=["GET"])
def hello():
    return {"message": "Hello, world!"}, 200


@app.route("/add", methods=["POST"])
def add_numbers():
    data = request.get_json() or {}
    a = data.get("a", 0)
    b = data.get("b", 0)
    return {"result": a + b}, 200

# Run this once inside your app.py after defining models
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(host="0.0.0.0", port=5000)
