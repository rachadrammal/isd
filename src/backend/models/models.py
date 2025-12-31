from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
import uuid

db = SQLAlchemy()

def generate_uuid():
    return str(uuid.uuid4())

class User(db.Model):
    """User authentication and authorization"""
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # admin, inventory_staff, sales_staff, production_staff
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)
    
    # Relationships
    orders = db.relationship('Order', backref='creator', lazy=True)
    production_runs = db.relationship('ProductionRun', backref='creator', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'role': self.role,
            'name': self.name,
            'email': self.email,
            'is_active': self.is_active
        }

class Warehouse(db.Model):
    """Warehouse locations"""
    __tablename__ = 'warehouses'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    name = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # raw_materials, wholesale, detailed_sales, archive
    location = db.Column(db.String(200))
    capacity = db.Column(db.Integer, default=0)
    current_usage = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    inventory_items = db.relationship('InventoryItem', backref='warehouse', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'type': self.type,
            'location': self.location,
            'capacity': self.capacity,
            'current_usage': self.current_usage
        }

class Product(db.Model):
    """Products that can be sold or manufactured"""
    __tablename__ = 'products'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    name = db.Column(db.String(200), nullable=False, index=True)
    sku = db.Column(db.String(50), unique=True, nullable=False, index=True)
    description = db.Column(db.Text)
    category = db.Column(db.String(100))
    price = db.Column(db.Float, default=0.0)
    cost = db.Column(db.Float, default=0.0)
    unit = db.Column(db.String(20), default='units')
    production_time = db.Column(db.Integer)  # in minutes
    units_per_run = db.Column(db.Integer, default=1)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    inventory_items = db.relationship('InventoryItem', backref='product', lazy=True)
    order_items = db.relationship('OrderItem', backref='product', lazy=True)
    production_runs = db.relationship('ProductionRun', backref='product', lazy=True)
    # Recipe relationships
    recipe_ingredients = db.relationship('RecipeItem', 
                                         foreign_keys='RecipeItem.product_id',
                                         backref='manufactured_product',
                                         lazy=True)
    used_as_ingredient = db.relationship('RecipeItem',
                                         foreign_keys='RecipeItem.ingredient_id',
                                         backref='ingredient_product',
                                         lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'sku': self.sku,
            'description': self.description,
            'category': self.category,
            'price': float(self.price),
            'cost': float(self.cost),
            'unit': self.unit,
            'production_time': self.production_time,
            'units_per_run': self.units_per_run,
            'is_active': self.is_active
        }

class InventoryItem(db.Model):
    """Inventory items in warehouses"""
    __tablename__ = 'inventory_items'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    product_id = db.Column(db.String(36), db.ForeignKey('products.id'), nullable=False)
    warehouse_id = db.Column(db.String(36), db.ForeignKey('warehouses.id'), nullable=False)
    quantity = db.Column(db.Integer, default=0, nullable=False)
    min_stock = db.Column(db.Integer, default=10)
    reorder_point = db.Column(db.Integer, default=20)
    location = db.Column(db.String(100))  # Specific location within warehouse
    expiry_date = db.Column(db.Date)
    batch_number = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'product_id': self.product_id,
            'product_name': self.product.name if self.product else None,
            'warehouse_id': self.warehouse_id,
            'warehouse_name': self.warehouse.name if self.warehouse else None,
            'warehouse_type': self.warehouse.type if self.warehouse else None,
            'quantity': self.quantity,
            'min_stock': self.min_stock,
            'reorder_point': self.reorder_point,
            'location': self.location,
            'expiry_date': self.expiry_date.isoformat() if self.expiry_date else None,
            'batch_number': self.batch_number
        }

class Order(db.Model):
    """Customer orders"""
    __tablename__ = 'orders'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    order_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    customer_name = db.Column(db.String(200), nullable=False)
    customer_email = db.Column(db.String(120))
    customer_phone = db.Column(db.String(20))
    shipping_address = db.Column(db.Text)
    total_amount = db.Column(db.Float, default=0.0)
    status = db.Column(db.String(20), default='pending')  # pending, processing, completed, cancelled, shipped
    payment_status = db.Column(db.String(20), default='unpaid')  # unpaid, paid, partially_paid, refunded
    order_date = db.Column(db.DateTime, default=datetime.utcnow)
    delivery_date = db.Column(db.Date)
    notes = db.Column(db.Text)
    created_by = db.Column(db.String(36), db.ForeignKey('users.id'))
    
    # Relationships
    items = db.relationship('OrderItem', backref='order', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'order_number': self.order_number,
            'customer_name': self.customer_name,
            'customer_email': self.customer_email,
            'customer_phone': self.customer_phone,
            'total_amount': float(self.total_amount),
            'status': self.status,
            'payment_status': self.payment_status,
            'order_date': self.order_date.isoformat() if self.order_date else None,
            'delivery_date': self.delivery_date.isoformat() if self.delivery_date else None,
            'items': [item.to_dict() for item in self.items]
        }

class OrderItem(db.Model):
    """Items within an order"""
    __tablename__ = 'order_items'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    order_id = db.Column(db.String(36), db.ForeignKey('orders.id'), nullable=False)
    product_id = db.Column(db.String(36), db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Float, nullable=False)
    total_price = db.Column(db.Float, nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'order_id': self.order_id,
            'product_id': self.product_id,
            'product_name': self.product.name if self.product else None,
            'quantity': self.quantity,
            'unit_price': float(self.unit_price),
            'total_price': float(self.total_price)
        }

class ProductionLine(db.Model):
    """Production lines for manufacturing"""
    __tablename__ = 'production_lines'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    name = db.Column(db.String(100), nullable=False)
    product_id = db.Column(db.String(36), db.ForeignKey('products.id'))
    status = db.Column(db.String(20), default='operational')  # operational, stopped, maintenance
    capacity_per_hour = db.Column(db.Integer, default=100)
    location = db.Column(db.String(200))
    last_maintenance = db.Column(db.Date)
    next_maintenance = db.Column(db.Date)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    production_runs = db.relationship('ProductionRun', backref='production_line', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'product_id': self.product_id,
            'product_name': self.product.name if self.product else None,
            'status': self.status,
            'capacity_per_hour': self.capacity_per_hour,
            'location': self.location,
            'last_maintenance': self.last_maintenance.isoformat() if self.last_maintenance else None,
            'next_maintenance': self.next_maintenance.isoformat() if self.next_maintenance else None
        }

class ProductionRun(db.Model):
    """Production runs/batches"""
    __tablename__ = 'production_runs'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    run_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    product_id = db.Column(db.String(36), db.ForeignKey('products.id'), nullable=False)
    production_line_id = db.Column(db.String(36), db.ForeignKey('production_lines.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), default='planned')  # planned, in-progress, completed, stopped, cancelled
    machine_stopped = db.Column(db.Boolean, default=False)
    stop_reason = db.Column(db.Text)
    start_date = db.Column(db.DateTime)
    completion_date = db.Column(db.DateTime)
    expected_duration = db.Column(db.Integer)  # in minutes
    actual_duration = db.Column(db.Integer)  # in minutes
    assigned_to = db.Column(db.String(100))
    notes = db.Column(db.Text)
    created_by = db.Column(db.String(36), db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'run_number': self.run_number,
            'product_id': self.product_id,
            'product_name': self.product.name if self.product else None,
            'production_line_id': self.production_line_id,
            'production_line_name': self.production_line.name if self.production_line else None,
            'quantity': self.quantity,
            'status': self.status,
            'machine_stopped': self.machine_stopped,
            'stop_reason': self.stop_reason,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'completion_date': self.completion_date.isoformat() if self.completion_date else None,
            'assigned_to': self.assigned_to,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class RecipeItem(db.Model):
    """Recipe items for product manufacturing"""
    __tablename__ = 'recipe_items'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    product_id = db.Column(db.String(36), db.ForeignKey('products.id'), nullable=False)  # The product being made
    ingredient_id = db.Column(db.String(36), db.ForeignKey('products.id'), nullable=False)  # The ingredient used
    quantity = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(20), default='units')
    
    def to_dict(self):
        return {
            'id': self.id,
            'product_id': self.product_id,
            'product_name': self.manufactured_product.name if self.manufactured_product else None,
            'ingredient_id': self.ingredient_id,
            'ingredient_name': self.ingredient_product.name if self.ingredient_product else None,
            'quantity': float(self.quantity),
            'unit': self.unit
        }

class Alert(db.Model):
    """System alerts and notifications"""
    __tablename__ = 'alerts'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    type = db.Column(db.String(50), nullable=False)  # anomaly, intrusion, safety, equipment, face_detection, inventory, production
    severity = db.Column(db.String(20), default='medium')  # low, medium, high, critical
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    camera_id = db.Column(db.String(36), db.ForeignKey('cameras.id'))
    production_run_id = db.Column(db.String(36), db.ForeignKey('production_runs.id'))
    inventory_item_id = db.Column(db.String(36), db.ForeignKey('inventory_items.id'))
    status = db.Column(db.String(20), default='new')  # new, acknowledged, resolved, dismissed
    ai_confidence = db.Column(db.Float)  # AI model confidence score
    data = db.Column(db.JSON)  # Additional structured data
    acknowledged_by = db.Column(db.String(36), db.ForeignKey('users.id'))
    acknowledged_at = db.Column(db.DateTime)
    resolved_by = db.Column(db.String(36), db.ForeignKey('users.id'))
    resolved_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'type': self.type,
            'severity': self.severity,
            'title': self.title,
            'description': self.description,
            'status': self.status,
            'ai_confidence': float(self.ai_confidence) if self.ai_confidence else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'acknowledged_at': self.acknowledged_at.isoformat() if self.acknowledged_at else None,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None
        }

class Camera(db.Model):
    """Camera feeds for monitoring"""
    __tablename__ = 'cameras'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    name = db.Column(db.String(100), nullable=False)
    location = db.Column(db.String(200))
    ip_address = db.Column(db.String(45))  # IPv4 or IPv6
    port = db.Column(db.Integer, default=554)
    status = db.Column(db.String(20), default='active')  # active, inactive, error, maintenance
    ai_enabled = db.Column(db.Boolean, default=False)
    ai_model = db.Column(db.String(100))  # Which AI model is being used
    last_active = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    alerts = db.relationship('Alert', backref='camera', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'location': self.location,
            'status': self.status,
            'ai_enabled': self.ai_enabled,
            'last_active': self.last_active.isoformat() if self.last_active else None
        }

# Import all models for easy access
__all__ = [
    'User', 'Warehouse', 'Product', 'InventoryItem', 
    'Order', 'OrderItem', 'ProductionLine', 'ProductionRun',
    'RecipeItem', 'Alert', 'Camera'
]