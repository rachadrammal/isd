import { useState } from "react";
import { useEffect } from "react";
import {
  Plus,
  Search,
  Play,
  CheckCircle,
  StopCircle,
  Factory,
  Package,
  Archive,
  AlertCircle,
  Sparkles,
} from "lucide-react";

interface Recipe {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  recipe: Recipe[];
  productionTime: number; // in minutes
  unitsPerRun: number; // Changed from batchSize
}

interface ProductionRun {
  // Changed from ProductionBatch
  id: string;
  productId: string;
  productName: string;
  runNumber: string; // Changed from batchNumber
  productionLineId: string;
  quantity: number;
  status: "planned" | "in-progress" | "completed" | "stopped"; // Added 'stopped'
  machineStopped: boolean;
  stopReason?: string;
  startDate: string;
  completionDate: string;
  assignedTo: string;
}

interface ProductionLine {
  id: string;
  name: string;
  productId: string; // Each line is dedicated to one product
  productName: string;
  status: "operational" | "stopped" | "maintenance";
  currentRunId?: string;
}
const token = localStorage.getItem("token");
const authHeader: HeadersInit = token
  ? { Authorization: `Bearer ${token}` }
  : {};

const availableIngredients = [
  { id: "ing1", name: "Raw Material A", stock: 1000, unit: "kg" },
  { id: "ing2", name: "Raw Material B", stock: 500, unit: "kg" },
  { id: "ing3", name: "Component X", stock: 2000, unit: "units" },
  { id: "ing4", name: "Component Y", stock: 1500, unit: "units" },
  { id: "ing5", name: "Chemical Z", stock: 300, unit: "liters" },
];

export function ProductionPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productionLines, setProductionLines] = useState<ProductionLine[]>([]);
  const [activeRuns, setActiveRuns] = useState<ProductionRun[]>([]);
  const [archivedRuns, setArchivedRuns] = useState<ProductionRun[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [showStopModal, setShowStopModal] = useState(false);
  const [selectedRun, setSelectedRun] = useState<ProductionRun | null>(null);
  const [viewArchive, setViewArchive] = useState(false);

  // Load products
  useEffect(() => {
    fetch("http://localhost:5000/api/products", { headers: authHeader })
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch(() => alert("Failed to load products"));
  }, []);

  // Load production lines (you’ll need a backend route for this)
  useEffect(() => {
    fetch("http://localhost:5000/api/production/lines", { headers: authHeader })
      .then((res) => res.json())
      .then((data) => setProductionLines(data))
      .catch(() => alert("Failed to load production lines"));
  }, []);

  // Load active runs
  useEffect(() => {
    fetch("http://localhost:5000/api/production/runs", { headers: authHeader })
      .then((res) => res.json())
      .then((data) => setActiveRuns(data))
      .catch(() => alert("Failed to load production runs"));
  }, []);

  // Load archived runs
  useEffect(() => {
    fetch("http://localhost:5000/api/production/archived", {
      headers: authHeader,
    })
      .then((res) => res.json())
      .then((data) => setArchivedRuns(data))
      .catch(() => alert("Failed to load archived runs"));
  }, []);
  // New run form
  const [runProductId, setRunProductId] = useState("");
  const [runProductionLineId, setRunProductionLineId] = useState("");
  const [runQuantity, setRunQuantity] = useState(1);
  const [runStartDate, setRunStartDate] = useState("");
  const [runAssignedTo, setRunAssignedTo] = useState("");

  // Stop reason
  const [stopReason, setStopReason] = useState("");

  const currentRuns = viewArchive ? archivedRuns : activeRuns;

  const filteredRuns = currentRuns.filter(
    (run) =>
      (run.runNumber ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (run.productName ?? "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (run.assignedTo ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateRequiredIngredients = (product: Product, runCount: number) => {
    return product?.recipe.map((item) => ({
      ...item,
      totalRequired: item.quantity * runCount,
    }));
  };

  const handleCreateRun = async () => {
    const product = products.find((p) => p.id === runProductId);
    if (!product) return;

    const payload = {
      product_id: runProductId,
      run_number: `RUN-${Date.now()}`,
      production_line_id: runProductionLineId,
      quantity: runQuantity * product.unitsPerRun,
      status: "planned",
      machine_stopped: false,
      start_date: runStartDate,
      assigned_to: runAssignedTo,
    };

    const res = await fetch("http://localhost:5000/api/production/runs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader,
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const newRun = await res.json();
      setActiveRuns([newRun.run, ...activeRuns]);
      setShowCreateModal(false);
    } else {
      alert("Failed to create production run");
    }
  };
  // ========================================================================
  // AI MODEL INTEGRATION - Production Scheduling Optimization
  // ========================================================================
  // TODO: Use AI to optimize production scheduling
  // Example:
  // const optimization = await productionAPI.optimizeSchedule({
  //   new_run: newRun,
  //   existing_runs: activeRuns,
  //   available_resources: availableIngredients
  // });
  // Suggest optimal start time, resource allocation, and sequencing
  // ========================================================================

  const updateRunStatus = async (
    runId: string,
    status: ProductionRun["status"]
  ) => {
    const res = await fetch(
      `http://localhost:5000/api/production/runs/${runId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
        body: JSON.stringify({ status }),
      }
    );

    if (res.ok) {
      const data = await res.json();
      if (status === "completed") {
        setArchivedRuns([data.run, ...archivedRuns]);
        setActiveRuns(activeRuns.filter((r) => r.runNumber !== runId));
      } else {
        setActiveRuns(
          activeRuns.map((r) => (r.runNumber === runId ? data.run : r))
        );
      }
    } else {
      alert("Failed to update run status");
    }
  };

  const handleStopMachine = (run: ProductionRun) => {
    setSelectedRun(run);
    setStopReason("");
    setShowStopModal(true);
  };

  const confirmStopMachine = async () => {
    if (!selectedRun) return;

    const res = await fetch(
      `http://localhost:5000/api/production/runs/${selectedRun.id}/machine-status`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
        body: JSON.stringify({ machine_stopped: true, reason: stopReason }),
      }
    );

    if (res.ok) {
      const data = await res.json();
      setActiveRuns(
        activeRuns.map((r) => (r.id === selectedRun.id ? data.run : r))
      );
      setShowStopModal(false);
      setSelectedRun(null);
    } else {
      alert("Failed to stop machine");
    }
  };

  // ========================================================================
  // AI MODEL INTEGRATION - Anomaly Detection for Machine Stops
  // ========================================================================
  // TODO: Use AI to analyze why machines stop and predict failures
  // Example:
  // await productionAPI.logMachineStop({
  //   run_id: selectedRun.id,
  //   line_id: selectedRun.productionLineId,
  //   reason: stopReason,
  //   timestamp: new Date()
  // });
  // Get AI predictions for maintenance needs
  // ========================================================================
  const updateLineStatus = async (lineId: string, newStatus: string) => {
    const res = await fetch(
      `http://localhost:5000/api/production/lines/${lineId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
        body: JSON.stringify({ status: newStatus }),
      }
    );

    if (res.ok) {
      const updated = await res.json();
      setProductionLines(
        productionLines.map((l) => (l.id === lineId ? updated.line : l))
      );
    } else {
      alert("Failed to update line status");
    }
  };
  const resumeMachine = async (runId: string) => {
    const res = await fetch(
      `http://localhost:5000/api/production/runs/${runId}/machine-status`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
        body: JSON.stringify({ machine_stopped: false }),
      }
    );

    if (res.ok) {
      const data = await res.json();
      setActiveRuns(activeRuns.map((r) => (r.id === runId ? data.run : r)));
    } else {
      alert("Failed to resume machine");
    }
  };

  const getStatusColor = (status: ProductionRun["status"]) => {
    switch (status) {
      case "planned":
        return "bg-gray-100 text-gray-700";
      case "in-progress":
        return "bg-blue-100 text-blue-700";
      case "completed":
        return "bg-green-100 text-green-700";
      case "stopped":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getLineStatusColor = (status: ProductionLine["status"]) => {
    switch (status) {
      case "operational":
        return "bg-green-100 text-green-700";
      case "stopped":
        return "bg-red-100 text-red-700";
      case "maintenance":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const completedRunsCount = archivedRuns.length;
  const inProgressRuns = activeRuns.filter(
    (r) => r.status === "in-progress"
  ).length;
  const stoppedMachines = activeRuns.filter((r) => r.machineStopped).length;
  const totalProduced = archivedRuns.reduce((sum, r) => sum + r.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 mb-2">Production Management</h1>
          <p className="text-gray-600">
            Manage production lines and track manufacturing runs
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setViewArchive(!viewArchive)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              viewArchive
                ? "bg-gray-600 text-white hover:bg-gray-700"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            <Archive className="w-5 h-5" />
            {viewArchive ? "View Active" : "View Archive"}
          </button>
          {!viewArchive && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Production Run
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Completed Runs</p>
              <p className="text-gray-900 text-xl">{completedRunsCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Play className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">In Progress</p>
              <p className="text-gray-900 text-xl">{inProgressRuns}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <StopCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Stopped Machines</p>
              <p className="text-gray-900 text-xl">{stoppedMachines}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Total Produced</p>
              <p className="text-gray-900 text-xl">{totalProduced}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Production Lines Status */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-gray-900">Production Lines</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {productionLines.map((line) => (
            <div
              key={line.id}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-gray-900">{line.name}</p>
                  <p className="text-gray-600 text-sm">{line.productName}</p>
                </div>
                <select
                  value={line.status}
                  onChange={(e) => updateLineStatus(line.id, e.target.value)}
                  className={`px-2 py-1 rounded text-xs ${getLineStatusColor(
                    line.status
                  )}`}
                >
                  <option value="operational">Operational</option>
                  <option value="stopped">Stopped</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              {line.currentRunId && (
                <div className="text-sm text-gray-600">
                  Current Run:{" "}
                  {activeRuns.find((r) => r.id === line.currentRunId)
                    ?.runNumber || "N/A"}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Products with Recipes */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-gray-900">Product Recipes</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-gray-900">{product.name}</p>
                  <p className="text-gray-600 text-sm">{product.sku}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedProduct(product);
                    setShowRecipeModal(true);
                  }}
                  className="text-indigo-600 hover:bg-indigo-50 px-3 py-1 rounded text-sm"
                >
                  View Recipe
                </button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Units per Run:</span>
                  <span className="text-gray-900">
                    {product.unitsPerRun} units
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Production Time:</span>
                  <span className="text-gray-900">
                    {product.productionTime} min
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ingredients:</span>
                  <span className="text-gray-900">
                    {product.recipe?.length ?? 0} items
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search production runs by number, product, or team..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Production Runs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-gray-700 text-sm">
                  Run #
                </th>
                <th className="px-6 py-3 text-left text-gray-700 text-sm">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-gray-700 text-sm">
                  Production Line
                </th>
                <th className="px-6 py-3 text-left text-gray-700 text-sm">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-gray-700 text-sm">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-gray-700 text-sm">
                  Machine
                </th>
                <th className="px-6 py-3 text-left text-gray-700 text-sm">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-left text-gray-700 text-sm">
                  Start Date
                </th>
                <th className="px-6 py-3 text-left text-gray-700 text-sm">
                  Completion
                </th>
                {!viewArchive && (
                  <th className="px-6 py-3 text-left text-gray-700 text-sm">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRuns.map((run) => {
                const line = productionLines.find(
                  (l) => l.id === run.productionLineId
                );
                return (
                  <tr key={run.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="text-gray-900">{run.runNumber}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900">{run.productName}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-600 text-sm">
                        {line?.name || "N/A"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900">{run.quantity} units</p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded text-sm ${getStatusColor(
                          run.status
                        )}`}
                      >
                        {run.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {run.machineStopped ? (
                        <div className="flex items-center gap-1 text-red-600">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-sm">Stopped</span>
                        </div>
                      ) : (
                        <span className="text-green-600 text-sm">Running</span>
                      )}
                      {run.stopReason && (
                        <p className="text-gray-500 text-xs mt-1">
                          {run.stopReason}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-600">{run.assignedTo}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-600 text-sm">{run.startDate}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-600 text-sm">
                        {run.completionDate || "Pending"}
                      </p>
                    </td>
                    {!viewArchive && (
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {run.status === "planned" && (
                            <button
                              onClick={() =>
                                updateRunStatus(run.runNumber, "in-progress")
                              }
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Start Production"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          )}
                          {run.status === "in-progress" &&
                            !run.machineStopped && (
                              <>
                                <button
                                  onClick={() => handleStopMachine(run)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Stop Machine"
                                >
                                  <StopCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    updateRunStatus(run.runNumber, "completed")
                                  }
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                  title="Mark Complete"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          {run.machineStopped && (
                            <button
                              onClick={() => resumeMachine(run.id)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Resume Machine"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Run Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full">
            <h2 className="text-gray-900 mb-4">Create Production Run</h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-gray-700 mb-2">Product *</label>
                <select
                  value={runProductId}
                  onChange={(e) => setRunProductId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} (Units per Run: {product.unitsPerRun})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">
                  Production Line *
                </label>
                <select
                  value={runProductionLineId}
                  onChange={(e) => setRunProductionLineId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Production Line</option>
                  {productionLines.map((line) => (
                    <option key={line.id} value={line.id}>
                      {line.name} ({line.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">
                  Number of Runs *
                </label>
                <input
                  type="number"
                  min="1"
                  value={runQuantity}
                  onChange={(e) =>
                    setRunQuantity(parseInt(e.target.value) || 1)
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter number of runs"
                />
                {runProductId && (
                  <p className="text-gray-600 text-sm mt-1">
                    Total units:{" "}
                    {runQuantity *
                      (products.find((p) => p.id === runProductId)
                        ?.unitsPerRun || 0)}
                  </p>
                )}
              </div>

              {runProductId && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-gray-900 mb-2">Required Ingredients:</p>
                  <div className="space-y-1">
                    {calculateRequiredIngredients(
                      products.find((p) => p.id === runProductId)!,
                      runQuantity
                    ).map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-700">
                          {item.ingredientName}
                        </span>
                        <span className="text-gray-900">
                          {item.totalRequired} {item.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-gray-700 mb-2">Start Date *</label>
                <input
                  type="date"
                  value={runStartDate}
                  onChange={(e) => setRunStartDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Assign To *</label>
                <select
                  value={runAssignedTo}
                  onChange={(e) => setRunAssignedTo(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Team</option>
                  <option value="Team A">Team A</option>
                  <option value="Team B">Team B</option>
                  <option value="Team C">Team C</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCreateRun}
                className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Create Production Run
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setRunProductId("");
                  setRunProductionLineId("");
                  setRunQuantity(1);
                  setRunStartDate("");
                  setRunAssignedTo("");
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stop Machine Modal */}
      {showStopModal && selectedRun && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full">
            <h2 className="text-gray-900 mb-4">Stop Machine</h2>

            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                You are about to stop the machine for production run{" "}
                <strong>{selectedRun.runNumber}</strong>
              </p>

              <label className="block text-gray-700 mb-2">
                Reason for stopping *
              </label>
              <textarea
                value={stopReason}
                onChange={(e) => setStopReason(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={4}
                placeholder="Enter reason for stopping the machine..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={confirmStopMachine}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
              >
                Stop Machine
              </button>
              <button
                onClick={() => {
                  setShowStopModal(false);
                  setSelectedRun(null);
                  setStopReason("");
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recipe Details Modal */}
      {showRecipeModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full">
            <h2 className="text-gray-900 mb-4">
              Recipe for {selectedProduct.name}
            </h2>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600 text-sm">SKU</p>
                  <p className="text-gray-900">{selectedProduct.sku}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Units per Run</p>
                  <p className="text-gray-900">
                    {selectedProduct.unitsPerRun} units
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Production Time</p>
                  <p className="text-gray-900">
                    {selectedProduct.productionTime} minutes
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Total Ingredients</p>
                  <p className="text-gray-900">
                    {selectedProduct.recipe.length}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-gray-900 mb-3">Ingredients per Run:</p>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  {selectedProduct.recipe.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0"
                    >
                      <div>
                        <p className="text-gray-900">{item.ingredientName}</p>
                        <p className="text-gray-600 text-sm">
                          {availableIngredients.find(
                            (ing) => ing.id === item.ingredientId
                          )?.stock || 0}{" "}
                          {item.unit} in stock
                        </p>
                      </div>
                      <p className="text-gray-900">
                        {item.quantity} {item.unit}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-gray-900 mb-1">AI Suggestion</p>
                    <p className="text-gray-600 text-sm">
                      {/* ================================================================ */}
                      {/* AI MODEL INTEGRATION - Recipe Optimization Suggestions */}
                      {/* ================================================================ */}
                      {/* TODO: Use AI to suggest recipe optimizations */}
                      {/* Example: Analyze ingredient costs, availability, and suggest */}
                      {/* alternative recipes or ingredient substitutions */}
                      {/* ================================================================ */}
                      Based on current demand trends, consider optimizing this
                      recipe for cost efficiency. Connect AI model for detailed
                      suggestions.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowRecipeModal(false);
                setSelectedProduct(null);
              }}
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
