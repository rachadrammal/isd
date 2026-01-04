import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Search, Plus } from "lucide-react";
import { inventoryAPI } from "../api";
import type { FC, ReactNode } from "react";

/* ===============================
   Types
================================ */

type WarehouseType =
  | "raw_materials"
  | "wholesale"
  | "detailed_sales"
  | "archive";

interface InventoryItem {
  id: string;
  product_id: string; // shown in the "Product" column (e.g., Steel Sheets)
  sku: string;
  quantity: number;
  min_stock: number;
  price: number; // per unit price
  expiry_date: string | null;
  location: string;
}

interface NewItemPayload {
  product_id: string;
  sku: string;
  quantity: number;
  min_stock: number;
  price: number;
  expiry_date: string; // send as empty string if not set; API can coerce to null
  location: string;
}

/* ===============================
   Constants
================================ */

const warehouseLabels: Record<WarehouseType, string> = {
  raw_materials: "Raw Materials Warehouse",
  wholesale: "Wholesale Warehouse",
  detailed_sales: "Detailed Sales Warehouse",
  archive: "Archive",
};

/* ===============================
   Component
================================ */

export const InventoryPage: FC = () => {
  const [activeWarehouse, setActiveWarehouse] =
    useState<WarehouseType>("raw_materials");
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState<NewItemPayload>({
    product_id: "",
    sku: "",
    quantity: 0,
    min_stock: 0,
    price: 0,
    expiry_date: "",
    location: "",
  });
  // === EDIT STATE ===
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editForm, setEditForm] = useState({
    quantity: 0,
    min_stock: 0,
    price: 0,
    location: "",
  });

  // === TRANSFER STATE ===
  const [transferItem, setTransferItem] = useState<InventoryItem | null>(null);
  const [transferQty, setTransferQty] = useState(0);
  const [targetWarehouse, setTargetWarehouse] = useState("");

  const [deleteItem, setDeleteItem] = useState<InventoryItem | null>(null);
  // Fetch inventory per warehouse
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError("");

    inventoryAPI
      .getWarehouse(activeWarehouse)
      .then((data: InventoryItem[]) => {
        if (isMounted) setItems(data ?? []);
      })
      .catch(() => {
        if (isMounted) setError("Failed to load inventory");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeWarehouse]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError("");

    const fetchData = async () => {
      try {
        const data =
          activeWarehouse === "archive"
            ? await inventoryAPI.getArchive()
            : await inventoryAPI.getWarehouse(activeWarehouse);
        if (isMounted) setItems(data ?? []);
      } catch {
        if (isMounted) setError("Failed to load inventory");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [activeWarehouse]);
  // Add item
  const handleAddItem = async () => {
    if (!newItem.product_id || newItem.quantity <= 0) {
      alert("Product ID and Quantity are required");
      return;
    }

    try {
      await inventoryAPI.addItem(activeWarehouse, newItem);
      setShowAddModal(false);
      setNewItem({
        product_id: "",
        sku: "",
        quantity: 0,
        min_stock: 0,
        price: 0,
        expiry_date: "",
        location: "",
      });

      const data = await inventoryAPI.getWarehouse(activeWarehouse);
      setItems(data ?? []);
    } catch {
      alert("Failed to add item");
    }
  };

  const handleEditClick = (item: InventoryItem) => {
    setEditingItem(item);
    setEditForm({
      quantity: item.quantity,
      min_stock: item.min_stock,
      price: item.price,
      location: item.location,
    });
  };
  // Save edited item
  const handleSaveEdit = async () => {
    if (!editingItem) return;
    try {
      await inventoryAPI.updateItem(editingItem.id, {
        quantity: editForm.quantity,
        min_stock: editForm.min_stock,
        price: editForm.price,
        location: editForm.location,
      });
      const data = await inventoryAPI.getWarehouse(activeWarehouse);
      setItems(data ?? []);
      setEditingItem(null);
    } catch {
      alert("Failed to update item");
    }
  };

  // Delete item
  const handleDeleteItem = async (id: string) => {
    try {
      await inventoryAPI.deleteItem(id);
      const data = await inventoryAPI.getWarehouse(activeWarehouse);
      setItems(data ?? []);
      setDeleteItem(null);
    } catch {
      alert("Failed to delete item");
    }
  };

  // Transfer item
  const handleTransferItem = async () => {
    if (!transferItem || !targetWarehouse || transferQty <= 0) {
      alert("Select target warehouse and a valid quantity");
      return;
    }
    if (transferQty > transferItem.quantity) {
      alert("Transfer quantity exceeds available stock");
      return;
    }

    try {
      await inventoryAPI.transferItem(
        activeWarehouse,
        targetWarehouse,
        transferItem.id,
        transferQty
      );
      const data = await inventoryAPI.getWarehouse(activeWarehouse);
      setItems(data ?? []);
      setTransferItem(null);
      setTransferQty(0);
      setTargetWarehouse("");
    } catch {
      alert("Failed to transfer item");
    }
  };

  // Derived data
  const filteredItems = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.product_id.toLowerCase().includes(q) ||
        i.sku.toLowerCase().includes(q)
    );
  }, [items, searchTerm]);

  const totalQuantity = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const lowStock = useMemo(
    () => items.filter((i) => i.quantity < i.min_stock).length,
    [items]
  );

  const totalValue = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity * i.price, 0),
    [items]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 mb-1 text-xl font-semibold">
            Inventory Management
          </h1>
          <p className="text-gray-600">{warehouseLabels[activeWarehouse]}</p>
        </div>

        {activeWarehouse !== "archive" && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            <Plus className="w-5 h-5" />
            Add Product
          </button>
        )}
      </div>

      {/* Warehouse Tabs */}
      <div className="flex gap-2">
        {(Object.keys(warehouseLabels) as WarehouseType[]).map((key) => (
          <button
            key={key}
            onClick={() => setActiveWarehouse(key)}
            className={`px-3 py-2 rounded-lg border text-sm ${
              activeWarehouse === key
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {warehouseLabels[key]}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title={`Products in ${warehouseLabels[activeWarehouse]}`}
          value={items.length}
        />
        <StatCard title="Low Stock Items" value={lowStock} danger />
        <StatCard title="Total Items (All)" value={totalQuantity} />
        <StatCard
          title="Total Value"
          value={`$${totalValue.toLocaleString()}`}
        />
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            className="w-full pl-10 p-2 border rounded-lg"
            placeholder="Search by product name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <p className="p-6 text-center">Loading...</p>
        ) : error ? (
          <p className="p-6 text-center text-red-600">{error}</p>
        ) : activeWarehouse === "archive" ? (
          // Archive table
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left">SKU</th>
                <th className="px-6 py-3 text-left">Field</th>
                <th className="px-6 py-3 text-left">Old Value</th>
                <th className="px-6 py-3 text-left">New Value</th>
                <th className="px-6 py-3 text-left">Edited By</th>
                <th className="px-6 py-3 text-left">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {items.map((log: any) => (
                <tr key={log.id} className="border-b">
                  <td className="px-6 py-4">{log.sku}</td>
                  <td className="px-6 py-4">{log.field}</td>
                  <td className="px-6 py-4">{log.old_value}</td>
                  <td className="px-6 py-4">{log.new_value}</td>
                  <td className="px-6 py-4">{log.edited_by}</td>
                  <td className="px-6 py-4">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-6 text-center text-gray-500"
                  >
                    No archive logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left">Product</th>
                <th className="px-6 py-3 text-left">SKU</th>
                <th className="px-6 py-3 text-left">Quantity</th>
                <th className="px-6 py-3 text-left">Min Stock</th>
                <th className="px-6 py-3 text-left">Price</th>
                <th className="px-6 py-3 text-left">Expiry Date</th>
                <th className="px-6 py-3 text-left">Location</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((i) => (
                <tr key={i.id} className="border-b">
                  <td className="px-6 py-4">{i.product_id}</td>
                  <td className="px-6 py-4">{i.sku}</td>
                  <td className="px-6 py-4 flex gap-2 items-center">
                    {i.quantity}
                    {i.quantity < i.min_stock && (
                      <AlertCircle className="text-red-500 w-4 h-4" />
                    )}
                  </td>
                  <td className="px-6 py-4">{i.min_stock}</td>
                  <td className="px-6 py-4">
                    {typeof i.price === "number"
                      ? `$${i.price.toFixed(2)}`
                      : "N/A"}
                  </td>
                  <td className="px-6 py-4">{i.expiry_date || "N/A"}</td>
                  <td className="px-6 py-4">{i.location}</td>
                  <td className="px-6 py-4 flex gap-3">
                    <button
                      className="text-indigo-600 hover:underline"
                      onClick={() => {
                        handleEditClick(i);
                        // preset editForm (already done in handleEditClick)
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="text-yellow-600 hover:underline"
                      onClick={() => setTransferItem(i)}
                    >
                      Transfer
                    </button>
                    <button
                      className="text-red-600 hover:underline"
                      onClick={() => setDeleteItem(i)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {filteredItems.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-6 text-center text-gray-500"
                  >
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-[500px]">
            <h2 className="text-lg mb-4 font-medium">Add New Product</h2>

            <div className="grid grid-cols-2 gap-3">
              <TextInput
                label="Product"
                placeholder="Steel Sheets"
                value={newItem.product_id}
                onChange={(v) => setNewItem({ ...newItem, product_id: v })}
              />
              <TextInput
                label="SKU"
                placeholder="RM-001"
                value={newItem.sku}
                onChange={(v) => setNewItem({ ...newItem, sku: v })}
              />
              <NumberInput
                label="Quantity"
                placeholder="500"
                value={newItem.quantity}
                onChange={(v) => setNewItem({ ...newItem, quantity: v })}
              />
              <NumberInput
                label="Min stock"
                placeholder="200"
                value={newItem.min_stock}
                onChange={(v) => setNewItem({ ...newItem, min_stock: v })}
              />
              <NumberInput
                label="Price"
                placeholder="25.99"
                value={newItem.price}
                step={0.01}
                onChange={(v) => setNewItem({ ...newItem, price: v })}
              />
              <TextInput
                label="Expiry date"
                placeholder="YYYY-MM-DD or leave blank"
                value={newItem.expiry_date}
                onChange={(v) => setNewItem({ ...newItem, expiry_date: v })}
              />
            </div>

            <TextInput
              label="Location"
              placeholder="Section A - Rack 1"
              value={newItem.location}
              onChange={(v) => setNewItem({ ...newItem, location: v })}
              className="mt-3"
            />

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddItem}
                className="flex-1 bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
              >
                Add Product
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-gray-200 py-2 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-[500px]">
            <h2 className="text-lg mb-4 font-medium">Edit Product</h2>

            <div className="grid grid-cols-2 gap-3">
              <NumberInput
                label="Quantity"
                value={editForm.quantity}
                onChange={(v) => setEditForm({ ...editForm, quantity: v })}
              />
              <NumberInput
                label="Min stock"
                value={editForm.min_stock}
                onChange={(v) => setEditForm({ ...editForm, min_stock: v })}
              />
              <NumberInput
                label="Price"
                step={0.01}
                value={editForm.price}
                onChange={(v) => setEditForm({ ...editForm, price: v })}
              />
            </div>

            <TextInput
              label="Location"
              value={editForm.location}
              onChange={(v) => setEditForm({ ...editForm, location: v })}
              className="mt-3"
            />

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveEdit}
                className="flex-1 bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
              >
                Save
              </button>
              <button
                onClick={() => setEditingItem(null)}
                className="flex-1 bg-gray-200 py-2 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Transfer Modal */}
      {transferItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-[500px]">
            <h2 className="text-lg mb-4 font-medium">Transfer Product</h2>

            <NumberInput
              label="Transfer quantity"
              value={transferQty}
              onChange={(v) => setTransferQty(v)}
            />

            <label className="block mt-3">
              <span className="block text-sm text-gray-700 mb-1">
                Target warehouse
              </span>
              <select
                className="w-full border p-2 rounded"
                value={targetWarehouse}
                onChange={(e) => setTargetWarehouse(e.target.value)}
              >
                {(Object.keys(warehouseLabels) as WarehouseType[])
                  .filter((w) => w !== activeWarehouse)
                  .map((w) => (
                    <option key={w} value={w}>
                      {warehouseLabels[w]}
                    </option>
                  ))}
              </select>
            </label>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleTransferItem}
                className="flex-1 bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
              >
                Transfer
              </button>
              <button
                onClick={() => {
                  setTransferItem(null);
                  setTransferQty(0);
                  setTargetWarehouse("");
                }}
                className="flex-1 bg-gray-200 py-2 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {deleteItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-[420px]">
            <h2 className="text-lg mb-4 font-medium">Confirm Delete</h2>
            <p className="text-gray-700">
              Are you sure you want to delete <b>{deleteItem.product_id}</b>{" "}
              (SKU {deleteItem.sku})?
            </p>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => handleDeleteItem(deleteItem.id)}
                className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteItem(null)}
                className="flex-1 bg-gray-200 py-2 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ===============================
   UI helpers
================================ */

const StatCard: FC<{ title: string; value: ReactNode; danger?: boolean }> = ({
  title,
  value,
  danger,
}) => {
  return (
    <div className="bg-white p-6 rounded-xl border">
      <p className="text-sm text-gray-600">{title}</p>
      <p className={`text-2xl ${danger ? "text-red-600" : "text-gray-900"}`}>
        {value}
      </p>
    </div>
  );
};

const TextInput: FC<{
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}> = ({ label, placeholder, value, onChange, className }) => (
  <label className={`block ${className ?? ""}`}>
    <span className="block text-sm text-gray-700 mb-1">{label}</span>
    <input
      className="w-full border p-2 rounded"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </label>
);

const NumberInput: FC<{
  label: string;
  placeholder?: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}> = ({ label, placeholder, value, onChange, step }) => (
  <label className="block">
    <span className="block text-sm text-gray-700 mb-1">{label}</span>
    <input
      type="number"
      step={step ?? 1}
      className="w-full border p-2 rounded"
      placeholder={placeholder}
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  </label>
);
