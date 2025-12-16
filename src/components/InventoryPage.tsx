import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Package, AlertCircle, Archive, ArrowRightLeft } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string;
  warehouse: 'raw_materials' | 'wholesale' | 'detailed_sales';
  quantity: number;
  minStock: number;
  expiryDate: string;
  price: number;
  location: string;
}

type WarehouseType = 'raw_materials' | 'wholesale' | 'detailed_sales' | 'archive';

const warehouseLabels = {
  raw_materials: 'Raw Materials Warehouse',
  wholesale: 'Wholesale Warehouse',
  detailed_sales: 'Detailed Sales Warehouse',
  archive: 'Archive'
};

const initialInventory = {
  raw_materials: [
    {
      id: '1',
      name: 'Steel Sheets',
      sku: 'RM-001',
      warehouse: 'raw_materials' as const,
      quantity: 500,
      minStock: 200,
      expiryDate: '',
      price: 25.99,
      location: 'Section A - Rack 1'
    },
    {
      id: '2',
      name: 'Aluminum Rods',
      sku: 'RM-002',
      warehouse: 'raw_materials' as const,
      quantity: 350,
      minStock: 150,
      expiryDate: '',
      price: 18.50,
      location: 'Section A - Rack 3'
    }
  ],
  wholesale: [
    {
      id: '3',
      name: 'Product Bundle A',
      sku: 'WS-001',
      warehouse: 'wholesale' as const,
      quantity: 200,
      minStock: 100,
      expiryDate: '2025-12-31',
      price: 89.99,
      location: 'Section B - Shelf 5'
    }
  ],
  detailed_sales: [
    {
      id: '4',
      name: 'Retail Product X',
      sku: 'DS-001',
      warehouse: 'detailed_sales' as const,
      quantity: 150,
      minStock: 75,
      expiryDate: '2025-08-15',
      price: 45.00,
      location: 'Section C - Display 2'
    }
  ],
  archive: [] as Product[]
};

export function InventoryPage() {
  const [inventory, setInventory] = useState(initialInventory);
  const [activeWarehouse, setActiveWarehouse] = useState<WarehouseType>('raw_materials');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferProduct, setTransferProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({});

  // Transfer state
  const [transferToWarehouse, setTransferToWarehouse] = useState<WarehouseType>('wholesale');
  const [transferQuantity, setTransferQuantity] = useState(0);
  const [isFullTransfer, setIsFullTransfer] = useState(true);

  const currentWarehouse = inventory[activeWarehouse];
  
  const filteredProducts = currentWarehouse.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    if (!formData.name || !formData.sku || !formData.quantity) return;
    
    const newProduct: Product = {
      id: Date.now().toString(),
      name: formData.name,
      sku: formData.sku,
      warehouse: activeWarehouse as 'raw_materials' | 'wholesale' | 'detailed_sales',
      quantity: formData.quantity,
      minStock: formData.minStock || 0,
      expiryDate: formData.expiryDate || '',
      price: formData.price || 0,
      location: formData.location || ''
    };

    setInventory({
      ...inventory,
      [activeWarehouse]: [...currentWarehouse, newProduct]
    });
    
    setShowAddModal(false);
    setFormData({});

    // ========================================================================
    // AI MODEL INTEGRATION - Inventory Optimization
    // ========================================================================
    // TODO: When adding products, call AI model to suggest optimal stock levels
    // Example API call:
    // const suggestions = await inventoryAPI.getStockSuggestions(newProduct);
    // Show suggestions to user for minStock, reorder point, etc.
    // ========================================================================
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData(product);
  };

  const handleUpdate = () => {
    if (!editingProduct) return;
    
    setInventory({
      ...inventory,
      [activeWarehouse]: currentWarehouse.map(p => 
        p.id === editingProduct.id ? { ...p, ...formData } : p
      )
    });
    
    setEditingProduct(null);
    setFormData({});
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      setInventory({
        ...inventory,
        [activeWarehouse]: currentWarehouse.filter(p => p.id !== id)
      });
    }
  };

  const openTransferModal = (product: Product) => {
    setTransferProduct(product);
    setTransferQuantity(product.quantity);
    setIsFullTransfer(true);
    
    // Set default target warehouse (can't transfer to same warehouse)
    const warehouses: WarehouseType[] = ['raw_materials', 'wholesale', 'detailed_sales', 'archive'];
    const availableWarehouses = warehouses.filter(w => w !== activeWarehouse);
    setTransferToWarehouse(availableWarehouses[0]);
    
    setShowTransferModal(true);
  };

  const handleTransfer = () => {
    if (!transferProduct) return;

    if (isFullTransfer) {
      // Full transfer - move entire product
      setInventory({
        ...inventory,
        [activeWarehouse]: currentWarehouse.filter(p => p.id !== transferProduct.id),
        [transferToWarehouse]: [
          ...inventory[transferToWarehouse],
          { ...transferProduct, warehouse: transferToWarehouse as any }
        ]
      });
    } else {
      // Partial transfer - split the product
      const remaining = transferProduct.quantity - transferQuantity;
      
      if (remaining <= 0 || transferQuantity <= 0) {
        alert('Invalid transfer quantity');
        return;
      }

      // Create new product for destination warehouse
      const transferredProduct: Product = {
        ...transferProduct,
        id: Date.now().toString(),
        quantity: transferQuantity,
        warehouse: transferToWarehouse as any
      };

      // Update original product quantity
      setInventory({
        ...inventory,
        [activeWarehouse]: currentWarehouse.map(p =>
          p.id === transferProduct.id ? { ...p, quantity: remaining } : p
        ),
        [transferToWarehouse]: [...inventory[transferToWarehouse], transferredProduct]
      });
    }

    setShowTransferModal(false);
    setTransferProduct(null);

    // ========================================================================
    // AI MODEL INTEGRATION - Transfer Analytics
    // ========================================================================
    // TODO: Track transfers and use AI to optimize warehouse distribution
    // Example:
    // await inventoryAPI.logTransfer({
    //   from: activeWarehouse,
    //   to: transferToWarehouse,
    //   product: transferProduct,
    //   quantity: transferQuantity
    // });
    // Get AI suggestions for optimal warehouse allocation
    // ========================================================================
  };

  // Calculate stats
  const totalItems = Object.values(inventory).flat().reduce((sum, p) => sum + p.quantity, 0);
  const totalValue = Object.values(inventory).flat().reduce((sum, p) => sum + (p.quantity * p.price), 0);
  const lowStockItems = currentWarehouse.filter(p => p.quantity < p.minStock).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 mb-2">Inventory Management</h1>
          <p className="text-gray-600">Manage stock across multiple warehouses</p>
        </div>
        {activeWarehouse !== 'archive' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Product
          </button>
        )}
      </div>

      {/* Warehouse Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          {(Object.keys(warehouseLabels) as WarehouseType[]).map((warehouse) => (
            <button
              key={warehouse}
              onClick={() => setActiveWarehouse(warehouse)}
              className={`flex-1 px-6 py-4 transition-colors ${
                activeWarehouse === warehouse
                  ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                {warehouse === 'archive' ? <Archive className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                <span>{warehouseLabels[warehouse]}</span>
                <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-sm">
                  {inventory[warehouse].length}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Products in {warehouseLabels[activeWarehouse]}</p>
              <p className="text-gray-900 text-xl">{currentWarehouse.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Low Stock Items</p>
              <p className="text-gray-900 text-xl">{lowStockItems}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Total Items (All)</p>
              <p className="text-gray-900 text-xl">{totalItems}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Total Value</p>
              <p className="text-gray-900 text-xl">${totalValue.toLocaleString()}</p>
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
            placeholder="Search products by name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-gray-700 text-sm">Product</th>
                <th className="px-6 py-3 text-left text-gray-700 text-sm">SKU</th>
                <th className="px-6 py-3 text-left text-gray-700 text-sm">Quantity</th>
                <th className="px-6 py-3 text-left text-gray-700 text-sm">Min Stock</th>
                <th className="px-6 py-3 text-left text-gray-700 text-sm">Price</th>
                <th className="px-6 py-3 text-left text-gray-700 text-sm">Expiry Date</th>
                <th className="px-6 py-3 text-left text-gray-700 text-sm">Location</th>
                <th className="px-6 py-3 text-left text-gray-700 text-sm">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    No products in this warehouse
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="text-gray-900">{product.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-600">{product.sku}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <p className="text-gray-900">{product.quantity}</p>
                        {product.quantity < product.minStock && (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-600">{product.minStock}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900">${product.price}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-600 text-sm">{product.expiryDate || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-600 text-sm">{product.location || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {activeWarehouse !== 'archive' && (
                          <>
                            <button
                              onClick={() => handleEdit(product)}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openTransferModal(product)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Transfer to another warehouse"
                            >
                              <ArrowRightLeft className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {activeWarehouse === 'archive' && (
                          <span className="text-gray-500 text-sm">Archived</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingProduct) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-gray-900 mb-4">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-gray-700 mb-2">Product Name *</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">SKU *</label>
                <input
                  type="text"
                  value={formData.sku || ''}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter SKU"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Quantity *</label>
                <input
                  type="number"
                  value={formData.quantity || ''}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter quantity"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Minimum Stock</label>
                <input
                  type="number"
                  value={formData.minStock || ''}
                  onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter minimum stock"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price || ''}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter price"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Expiry Date</label>
                <input
                  type="date"
                  value={formData.expiryDate || ''}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter storage location"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={editingProduct ? handleUpdate : handleAdd}
                className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                {editingProduct ? 'Update Product' : 'Add Product'}
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingProduct(null);
                  setFormData({});
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && transferProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full">
            <h2 className="text-gray-900 mb-4">Transfer Product</h2>
            
            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Product</p>
                <p className="text-gray-900">{transferProduct.name}</p>
                <p className="text-gray-600 text-sm mt-1">
                  Current: {warehouseLabels[activeWarehouse]} ({transferProduct.quantity} units)
                </p>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Transfer To *</label>
                <select
                  value={transferToWarehouse}
                  onChange={(e) => setTransferToWarehouse(e.target.value as WarehouseType)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {(Object.keys(warehouseLabels) as WarehouseType[])
                    .filter(w => w !== activeWarehouse)
                    .map(warehouse => (
                      <option key={warehouse} value={warehouse}>
                        {warehouseLabels[warehouse]}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <div className="flex items-center gap-4 mb-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={isFullTransfer}
                      onChange={() => setIsFullTransfer(true)}
                      className="w-4 h-4"
                    />
                    <span className="text-gray-700">Full Transfer</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={!isFullTransfer}
                      onChange={() => setIsFullTransfer(false)}
                      className="w-4 h-4"
                    />
                    <span className="text-gray-700">Partial Transfer</span>
                  </label>
                </div>

                {!isFullTransfer && (
                  <input
                    type="number"
                    min="1"
                    max={transferProduct.quantity}
                    value={transferQuantity}
                    onChange={(e) => setTransferQuantity(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter quantity to transfer"
                  />
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleTransfer}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
              >
                Transfer
              </button>
              <button
                onClick={() => {
                  setShowTransferModal(false);
                  setTransferProduct(null);
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
