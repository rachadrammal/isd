import { useState } from "react";
import {
  Plus,
  Search,
  Eye,
  Package,
  Trash2,
  ShoppingCart,
  User,
  DollarSign,
  Calendar,
  Sparkles,
} from "lucide-react";

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  totalAmount: number;
  status: "pending" | "processing" | "completed" | "cancelled";
  orderDate: string;
  deliveryDate: string;
}

const availableProducts = [
  { id: "1", name: "Product Alpha", price: 25.99, stock: 450 },
  { id: "2", name: "Product Beta", price: 89.99, stock: 125 },
  { id: "3", name: "Product Gamma", price: 15.5, stock: 780 },
  { id: "4", name: "Product Delta", price: 42.0, stock: 95 },
  { id: "5", name: "Product Epsilon", price: 67.5, stock: 320 },
];

const initialOrders: Order[] = [
  {
    id: "1",
    orderNumber: "ORD-001",
    customerName: "John Smith",
    customerEmail: "john@example.com",
    items: [
      {
        productId: "1",
        productName: "Product Alpha",
        quantity: 10,
        price: 25.99,
      },
      {
        productId: "2",
        productName: "Product Beta",
        quantity: 5,
        price: 89.99,
      },
    ],
    totalAmount: 709.85,
    status: "completed",
    orderDate: "2024-12-10",
    deliveryDate: "2024-12-15",
  },
  {
    id: "2",
    orderNumber: "ORD-002",
    customerName: "Jane Doe",
    customerEmail: "jane@example.com",
    items: [
      {
        productId: "3",
        productName: "Product Gamma",
        quantity: 25,
        price: 15.5,
      },
    ],
    totalAmount: 387.5,
    status: "processing",
    orderDate: "2024-12-12",
    deliveryDate: "2024-12-18",
  },
  {
    id: "3",
    orderNumber: "ORD-003",
    customerName: "Bob Wilson",
    customerEmail: "bob@example.com",
    items: [
      {
        productId: "4",
        productName: "Product Delta",
        quantity: 8,
        price: 42.0,
      },
      {
        productId: "5",
        productName: "Product Epsilon",
        quantity: 3,
        price: 67.5,
      },
    ],
    totalAmount: 538.5,
    status: "pending",
    orderDate: "2024-12-13",
    deliveryDate: "2024-12-20",
  },
];

export function SalesPage() {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  // New order form state
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [deliveryDate, setDeliveryDate] = useState("");

  const filteredOrders = orders.filter(
    (order) =>
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addProductToOrder = () => {
    const emptyItem: OrderItem = {
      productId: "",
      productName: "",
      quantity: 1,
      price: 0,
    };
    setOrderItems([...orderItems, emptyItem]);
  };

  const updateOrderItem = (
    index: number,
    field: keyof OrderItem,
    value: any
  ) => {
    const newItems = [...orderItems];

    if (field === "productId") {
      const product = availableProducts.find((p) => p.id === value);
      if (product) {
        newItems[index] = {
          ...newItems[index],
          productId: value,
          productName: product.name,
          price: product.price,
        };
      }
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }

    setOrderItems(newItems);
  };

  const removeOrderItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return orderItems.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );
  };

  const handleCreateOrder = () => {
    if (!customerName || !customerEmail || orderItems.length === 0) {
      alert("Please fill in all required fields and add at least one product");
      return;
    }

    const newOrder: Order = {
      id: Date.now().toString(),
      orderNumber: `ORD-${String(orders.length + 1).padStart(3, "0")}`,
      customerName,
      customerEmail,
      items: orderItems,
      totalAmount: calculateTotal(),
      status: "pending",
      orderDate: new Date().toISOString().split("T")[0],
      deliveryDate:
        deliveryDate ||
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
    };

    setOrders([newOrder, ...orders]);

    // Reset form
    setCustomerName("");
    setCustomerEmail("");
    setOrderItems([]);
    setDeliveryDate("");
    setShowCreateModal(false);
  };

  const updateOrderStatus = (orderId: string, status: Order["status"]) => {
    setOrders(
      orders.map((order) =>
        order.id === orderId ? { ...order, status } : order
      )
    );
  };

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "processing":
        return "bg-blue-100 text-blue-700";
      case "completed":
        return "bg-green-100 text-green-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const totalRevenue = orders
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const processingOrders = orders.filter(
    (o) => o.status === "processing"
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 mb-2">Sales Management</h1>
          <p className="text-gray-600">
            Manage customer orders and track sales
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Order
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Total Revenue</p>
              <p className="text-gray-900 text-xl">
                ${totalRevenue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Total Orders</p>
              <p className="text-gray-900 text-xl">{orders.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Pending Orders</p>
              <p className="text-gray-900 text-xl">{pendingOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Processing</p>
              <p className="text-gray-900 text-xl">{processingOrders}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search orders by order number, customer name, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-gray-700 text-sm">
                  Order #
                </th>
                <th className="px-6 py-3 text-left text-gray-700 text-sm">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-gray-700 text-sm">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-gray-700 text-sm">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-gray-700 text-sm">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-gray-700 text-sm">
                  Order Date
                </th>
                <th className="px-6 py-3 text-left text-gray-700 text-sm">
                  Delivery Date
                </th>
                <th className="px-6 py-3 text-left text-gray-700 text-sm">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="text-gray-900">{order.orderNumber}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-gray-900">{order.customerName}</p>
                      <p className="text-gray-500 text-sm">
                        {order.customerEmail}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-600">{order.items.length} items</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-900">
                      ${order.totalAmount.toFixed(2)}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={order.status}
                      onChange={(e) =>
                        updateOrderStatus(
                          order.id,
                          e.target.value as Order["status"]
                        )
                      }
                      className={`px-3 py-1 rounded text-sm ${getStatusColor(
                        order.status
                      )} border-0 cursor-pointer`}
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-600 text-sm">{order.orderDate}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-600 text-sm">
                      {order.deliveryDate}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setViewingOrder(order)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-gray-900 mb-4">Create New Order</h2>

            {/* Customer Information */}
            <div className="mb-6">
              <h3 className="text-gray-900 mb-3">Customer Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-2">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter customer name"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">
                    Customer Email *
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter customer email"
                  />
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-gray-900">Order Items</h3>
                <button
                  onClick={addProductToOrder}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Product
                </button>
              </div>

              <div className="space-y-3">
                {orderItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex gap-3 items-start bg-gray-50 p-3 rounded-lg"
                  >
                    <div className="flex-1">
                      <label className="block text-gray-700 text-sm mb-1">
                        Product
                      </label>
                      <select
                        value={item.productId}
                        onChange={(e) =>
                          updateOrderItem(index, "productId", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Select product</option>
                        {availableProducts.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} - ${product.price} (Stock:{" "}
                            {product.stock})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-32">
                      <label className="block text-gray-700 text-sm mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateOrderItem(
                            index,
                            "quantity",
                            parseInt(e.target.value) || 1
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="w-32">
                      <label className="block text-gray-700 text-sm mb-1">
                        Subtotal
                      </label>
                      <div className="px-3 py-2 bg-gray-100 rounded-lg text-gray-900">
                        ${(item.quantity * item.price).toFixed(2)}
                      </div>
                    </div>

                    <button
                      onClick={() => removeOrderItem(index)}
                      className="mt-6 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {orderItems.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No products added yet. Click "Add Product" to get started.
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Date */}
            <div className="mb-6">
              <label className="block text-gray-700 mb-2">Delivery Date</label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Total */}
            <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-gray-900">Order Total:</span>
                <span className="text-gray-900 text-2xl">
                  ${calculateTotal().toFixed(2)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleCreateOrder}
                className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Create Order
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCustomerName("");
                  setCustomerEmail("");
                  setOrderItems([]);
                  setDeliveryDate("");
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Order Modal */}
      {viewingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-gray-900 mb-4">
              Order Details - {viewingOrder.orderNumber}
            </h2>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600 text-sm">Customer Name</p>
                  <p className="text-gray-900">{viewingOrder.customerName}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Customer Email</p>
                  <p className="text-gray-900">{viewingOrder.customerEmail}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Order Date</p>
                  <p className="text-gray-900">{viewingOrder.orderDate}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Delivery Date</p>
                  <p className="text-gray-900">{viewingOrder.deliveryDate}</p>
                </div>
              </div>

              <div>
                <p className="text-gray-600 text-sm mb-2">Order Items</p>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  {viewingOrder.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center"
                    >
                      <div>
                        <p className="text-gray-900">{item.productName}</p>
                        <p className="text-gray-600 text-sm">
                          Quantity: {item.quantity} × ${item.price}
                        </p>
                      </div>
                      <p className="text-gray-900">
                        ${(item.quantity * item.price).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-indigo-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-900">Total Amount:</span>
                  <span className="text-gray-900 text-2xl">
                    ${viewingOrder.totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setViewingOrder(null)}
              className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
