import { useState, useEffect } from "react";
import { alertsAPI } from "../api"; // adjust path if needed
import {
  Camera,
  AlertTriangle,
  CheckCircle,
  Video,
  Eye,
  EyeOff,
  Bell,
  BellOff,
  Sparkles,
  Users,
} from "lucide-react";

interface CameraFeed {
  id: string;
  name: string;
  location: string;
  status: "active" | "inactive" | "error";
  aiEnabled: boolean;
  thumbnail: string;
}

interface Alert {
  id: string;
  cameraId: string;
  cameraName: string;
  type: "anomaly" | "intrusion" | "safety" | "equipment" | "face_detection";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  timestamp: string;
  status: "new" | "acknowledged" | "resolved";
  aiConfidence: number;
  imageUrl?: string;
}

const cameraFeeds: CameraFeed[] = [
  {
    id: "cam1",
    name: "Main Entrance",
    location: "Building A - Entrance",
    status: "active",
    aiEnabled: true,
    thumbnail:
      "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=400&h=300&fit=crop",
  },
  {
    id: "cam2",
    name: "Production Floor",
    location: "Building B - Floor 1",
    status: "active",
    aiEnabled: true,
    thumbnail:
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=300&fit=crop",
  },
  {
    id: "cam3",
    name: "Warehouse",
    location: "Warehouse A",
    status: "active",
    aiEnabled: true,
    thumbnail:
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=300&fit=crop",
  },
  {
    id: "cam4",
    name: "Loading Dock",
    location: "Building C - Dock",
    status: "active",
    aiEnabled: true,
    thumbnail:
      "https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=400&h=300&fit=crop",
  },
  {
    id: "cam5",
    name: "Parking Area",
    location: "Outdoor - Lot 1",
    status: "inactive",
    aiEnabled: false,
    thumbnail:
      "https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=400&h=300&fit=crop",
  },
  {
    id: "cam6",
    name: "Quality Control",
    location: "Building B - Floor 2",
    status: "active",
    aiEnabled: true,
    thumbnail:
      "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400&h=300&fit=crop",
  },
];

export function AlertPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [simulateLive, setSimulateLive] = useState(false);

  // Simulate live alerts
  useEffect(() => {
    alertsAPI.getAlerts().then(setAlerts).catch(console.error);
  }, []);
  useEffect(() => {
    if (!simulateLive) return;

    const interval = setInterval(() => {
      const randomCamera =
        cameraFeeds[Math.floor(Math.random() * cameraFeeds.length)];
      const types: Alert["type"][] = [
        "anomaly",
        "intrusion",
        "safety",
        "equipment",
        "face_detection",
      ];
      const severities: Alert["severity"][] = [
        "low",
        "medium",
        "high",
        "critical",
      ];

      const newAlert: Alert = {
        id: Date.now().toString(),
        cameraId: randomCamera.id,
        cameraName: randomCamera.name,
        type: types[Math.floor(Math.random() * types.length)],
        severity: severities[Math.floor(Math.random() * severities.length)],
        description: "AI detected anomaly - analyzing pattern",
        timestamp: new Date().toISOString(),
        status: "new",
        aiConfidence: Math.floor(Math.random() * 20) + 75,
      };

      setAlerts((prev) => [newAlert, ...prev]);
    }, 10000);

    return () => clearInterval(interval);
  }, [simulateLive]);

  const filteredAlerts = alerts.filter((alert) => {
    if (selectedCamera && alert.cameraId !== selectedCamera) return false;
    if (filterSeverity !== "all" && alert.severity !== filterSeverity)
      return false;
    if (filterStatus !== "all" && alert.status !== filterStatus) return false;
    return true;
  });

  const updateAlertStatus = async (
    alertId: string,
    status: Alert["status"]
  ) => {
    await alertsAPI.updateStatus(alertId, status);
    setAlerts(
      alerts.map((alert) =>
        alert.id === alertId ? { ...alert, status } : alert
      )
    );
  };

  const getSeverityColor = (severity: Alert["severity"]) => {
    switch (severity) {
      case "low":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "high":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "critical":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getTypeIcon = (type: Alert["type"]) => {
    switch (type) {
      case "safety":
        return "⚠️";
      case "intrusion":
        return "🚨";
      case "equipment":
        return "🔧";
      case "face_detection":
        return "👤";
      default:
        return "🔍";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  };

  const newAlertsCount = alerts.filter((a) => a.status === "new").length;
  const activeCameras = cameraFeeds.filter((c) => c.status === "active").length;
  const aiEnabledCount = cameraFeeds.filter((c) => c.aiEnabled).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 mb-2">Security & Alerts</h1>
          <p className="text-gray-600">
            AI-powered monitoring and anomaly detection
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSimulateLive(!simulateLive)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              simulateLive
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            <Video className="w-5 h-5" />
            {simulateLive ? "Stop Simulation" : "Simulate Live"}
          </button>
          <button
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              notificationsEnabled
                ? "bg-indigo-600 text-white hover:bg-indigo-700"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {notificationsEnabled ? (
              <Bell className="w-5 h-5" />
            ) : (
              <BellOff className="w-5 h-5" />
            )}
            Notifications
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">New Alerts</p>
              <p className="text-gray-900 text-xl">{newAlertsCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Camera className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Active Cameras</p>
              <p className="text-gray-900 text-xl">
                {activeCameras}/{cameraFeeds.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">AI Enabled</p>
              <p className="text-gray-900 text-xl">{aiEnabledCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Resolved Today</p>
              <p className="text-gray-900 text-xl">
                {alerts.filter((a) => a.status === "resolved").length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Camera Feeds Grid */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-gray-900">Camera Feeds</h2>
          <div className="flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm">
            <Sparkles className="w-4 h-4" />
            <span>AI Detection Active</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cameraFeeds.map((camera) => (
            <div
              key={camera.id}
              className={`border rounded-lg overflow-hidden cursor-pointer transition-all ${
                selectedCamera === camera.id
                  ? "border-indigo-600 ring-2 ring-indigo-200"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() =>
                setSelectedCamera(
                  selectedCamera === camera.id ? null : camera.id
                )
              }
            >
              <div className="relative">
                <img
                  src={camera.thumbnail}
                  alt={camera.name}
                  className="w-full h-40 object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  {camera.status === "active" && (
                    <span className="px-2 py-1 bg-green-600 text-white text-xs rounded flex items-center gap-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      Live
                    </span>
                  )}
                  {camera.aiEnabled && (
                    <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded">
                      AI
                    </span>
                  )}
                </div>
              </div>
              <div className="p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-900">{camera.name}</p>
                    <p className="text-gray-600 text-sm">{camera.location}</p>
                  </div>
                  <Camera
                    className={`w-5 h-5 ${
                      camera.status === "active"
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Severities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div className="flex-1">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          {selectedCamera && (
            <button
              onClick={() => setSelectedCamera(null)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Clear Camera Filter
            </button>
          )}
        </div>
      </div>

      {/* Alerts List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-gray-900">Alerts ({filteredAlerts.length})</h2>
        </div>

        <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
          {filteredAlerts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No alerts matching the current filters
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  alert.status === "new" ? "bg-red-50" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{getTypeIcon(alert.type)}</div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-gray-900">{alert.description}</p>
                        <p className="text-gray-600 text-sm">
                          {alert.cameraName} •{" "}
                          {formatTimestamp(alert.timestamp)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                        <span
                          className={`px-3 py-1 rounded border text-sm ${getSeverityColor(
                            alert.severity
                          )}`}
                        >
                          {alert.severity}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <span className="text-sm text-gray-600">
                          AI Confidence: {alert.aiConfidence}%
                        </span>
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-purple-600 h-2 rounded-full"
                            style={{ width: `${alert.aiConfidence}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 ml-auto">
                        {alert.status === "new" && (
                          <button
                            onClick={() =>
                              updateAlertStatus(alert.id, "acknowledged")
                            }
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                          >
                            Acknowledge
                          </button>
                        )}
                        {alert.status === "acknowledged" && (
                          <button
                            onClick={() =>
                              updateAlertStatus(alert.id, "resolved")
                            }
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                          >
                            Resolve
                          </button>
                        )}
                        <span
                          className={`px-3 py-1 text-sm rounded ${
                            alert.status === "new"
                              ? "bg-red-100 text-red-700"
                              : alert.status === "acknowledged"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {alert.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* AI Model Info */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-gray-900 mb-2">AI Detection Models Active</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-gray-700">
                  Face Recognition Model v2.1
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-gray-700">
                  Anomaly Detection Model v1.8
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-gray-700">
                  Safety Equipment Detection v1.5
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-gray-700">
                  Behavior Analysis Model v2.0
                </span>
              </div>
            </div>
            <p className="text-gray-600 text-sm mt-3">
              Note: These AI models are placeholders. In production, connect to
              your Python backend API endpoints for real-time detection.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
