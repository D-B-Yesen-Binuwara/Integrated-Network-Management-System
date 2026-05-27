// pages/ImpactAnalysis.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import SummaryCard from "../components/SummaryCard";
import NodeFilterBar from "../components/NodeFilterBar";
import DeviceService from "../services/DeviceService";
import ImpactAnalysisService from "../services/ImpactAnalysisService";
import {
  getDeviceTypeLabel,
  getStatusBadgeClass,
  getTypeBadgeClass,
  normalizeStatus
} from "../utils/formatters";

const DEFAULT_FILTERS = { search: "", region: "", type: "", status: "" };
const EMPTY_SUMMARY = {
  slbnAffected: 0,
  ceanAffected: 0,
  msanAffected: 0,
  customerAffected: 0,
  totalAffected: 0
};

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.value)) return value.value;
  return [];
}

function findDevice(devices, query) {
  const term = String(query ?? "").trim().toLowerCase();
  if (!term) return null;

  const exact = devices.find((device) =>
    String(device.deviceId) === term ||
    String(device.deviceName ?? "").toLowerCase() === term ||
    String(device.ip ?? "").toLowerCase() === term
  );

  if (exact) return exact;

  return devices.find((device) =>
    String(device.deviceName ?? "").toLowerCase().includes(term) ||
    String(device.ip ?? "").toLowerCase().includes(term)
  ) ?? null;
}

function getNodeType(node) {
  return getDeviceTypeLabel(node.deviceType ?? node.type);
}

function getNodeRegion(node) {
  return node.regionName ?? node.region ?? "-";
}

function getNodeProvince(node) {
  return node.provinceName ?? node.province ?? "-";
}

function getNodeLocation(node) {
  if (node.location) return node.location;
  if (node.latitude != null && node.longitude != null) return `${node.latitude}, ${node.longitude}`;
  return "-";
}

export default function ImpactAnalysis() {
  const [searchParams] = useSearchParams();
  const [devices, setDevices] = useState([]);
  const [nodeSearch, setNodeSearch] = useState("");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [analysis, setAnalysis] = useState(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [isLoadingDevices, setIsLoadingDevices] = useState(true);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    DeviceService.getAll()
      .then((response) => {
        if (!active) return;
        setDevices(asArray(response));
      })
      .catch(() => {
        if (!active) return;
        setError("Device list eka load karanna bari una. Backend/API eka check karanna.");
      })
      .finally(() => {
        if (active) setIsLoadingDevices(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const loadResult = useCallback(async (deviceId) => {
    setIsLoadingAnalysis(true);
    setError("");

    try {
      const result = await ImpactAnalysisService.getResult(deviceId);
      setAnalysis(result);
      setSelectedDeviceId(deviceId);
    } catch {
      setAnalysis(null);
      setError("Impact result eka load karanna bari una.");
    } finally {
      setIsLoadingAnalysis(false);
    }
  }, []);

  useEffect(() => {
    const deviceId = Number(searchParams.get("deviceId"));
    if (!deviceId || devices.length === 0) return;

    const matchedDevice = devices.find((device) => Number(device.deviceId) === deviceId);
    if (!matchedDevice) return;

    setNodeSearch(matchedDevice.deviceName);
    setSelectedDeviceId(deviceId);
    void loadResult(deviceId);
  }, [devices, loadResult, searchParams]);

  const impactedNodes = useMemo(() => asArray(analysis?.impactedDevices), [analysis]);
  const segments = useMemo(() => asArray(analysis?.isolatedSegments), [analysis]);
  const summary = analysis?.summary ?? EMPTY_SUMMARY;
  const sourceDevice = analysis?.sourceDevice ?? null;
  const affectedCount = Number(summary.totalAffected ?? impactedNodes.length);

  const filtered = impactedNodes.filter((node) => {
    const term = filters.search.trim().toLowerCase();
    const name = String(node.deviceName ?? node.name ?? "").toLowerCase();
    const ip = String(node.ip ?? "").toLowerCase();
    const region = getNodeRegion(node);
    const type = getNodeType(node);
    const status = normalizeStatus(node.status);

    if (term && !name.includes(term) && !ip.includes(term)) return false;
    if (filters.region && region !== filters.region) return false;
    if (filters.type && type !== filters.type) return false;
    if (filters.status && status !== filters.status) return false;
    return true;
  });

  const handleRunAnalysis = async (event) => {
    event.preventDefault();

    const device = findDevice(devices, nodeSearch);
    if (!device) {
      setAnalysis(null);
      setError("Device eka hoyaganna bari una. Node name/IP eka hariyata enter karanna.");
      return;
    }

    setSelectedDeviceId(device.deviceId);
    setNodeSearch(device.deviceName);
    setIsLoadingAnalysis(true);
    setError("");

    try {
      const result = await ImpactAnalysisService.analyze(device.deviceId);
      setAnalysis(result);
    } catch {
      setError("Run analysis fail una. Backend log eka check karanna.");
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  const handleClearImpact = async () => {
    if (!selectedDeviceId) return;

    setIsLoadingAnalysis(true);
    setError("");

    try {
      const result = await ImpactAnalysisService.clear(selectedDeviceId);
      setAnalysis(result);
    } catch {
      setError("Impact clear karanna bari una.");
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">
          Fault Localization & Impact Analysis
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Identify affected nodes and isolated network segments
        </p>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
        <label className="text-sm font-medium text-gray-600">
          Select Source Node
        </label>
        <form onSubmit={handleRunAnalysis} className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            list="impact-node-options"
            value={nodeSearch}
            onChange={(e) => setNodeSearch(e.target.value)}
            placeholder={isLoadingDevices ? "Loading nodes..." : "Search node by name or IP..."}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
            disabled={isLoadingDevices || isLoadingAnalysis}
          />
          <datalist id="impact-node-options">
            {devices.map((device) => (
              <option key={device.deviceId} value={device.deviceName}>
                {device.ip}
              </option>
            ))}
          </datalist>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isLoadingDevices || isLoadingAnalysis || !nodeSearch.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoadingAnalysis ? "Analyzing..." : "Run Analysis"}
            </button>
            {selectedDeviceId && (
              <button
                type="button"
                onClick={handleClearImpact}
                disabled={isLoadingAnalysis}
                className="border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 rounded-lg transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Clear
              </button>
            )}
          </div>
        </form>

        {sourceDevice && (
          <div className="text-xs text-gray-500">
            Source: <span className="font-medium text-gray-700">{sourceDevice.deviceName}</span>
            {" | "}
            {sourceDevice.ip}
            {" | "}
            {getNodeType(sourceDevice)}
            {" | "}
            {normalizeStatus(sourceDevice.status)}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard title="SLBN Nodes Affected" value={summary.slbnAffected} color="bg-purple-50 border-purple-300" />
        <SummaryCard title="CEAN Nodes Affected" value={summary.ceanAffected} color="bg-blue-50 border-blue-300" />
        <SummaryCard title="MSAN Nodes Affected" value={summary.msanAffected} color="bg-teal-50 border-teal-300" />
        <SummaryCard title="Total Nodes Affected" value={affectedCount} color="bg-orange-50 border-orange-300" />
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-base font-semibold text-gray-700 mb-3">
          Isolated Network Segments
        </h2>
        {segments.length === 0 ? (
          <div className="bg-gray-50 border-l-4 border-gray-300 rounded px-4 py-3 text-sm text-gray-500">
            No isolated downstream segments detected.
          </div>
        ) : (
          <div className="space-y-2">
            {segments.map((segment) => (
              <div
                key={`${segment.regionName}-${segment.provinceName}-${segment.leaName}`}
                className="bg-yellow-50 border-l-4 border-yellow-400 rounded px-4 py-3 text-sm text-yellow-800"
              >
                {segment.regionName} / {segment.provinceName} / {segment.leaName}: {segment.affectedCount} nodes affected
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-base font-semibold text-gray-700 mb-4">
          Affected Nodes ({affectedCount})
        </h2>

        <NodeFilterBar filters={filters} onChange={setFilters} nodes={impactedNodes} />

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 uppercase text-xs">
                <th className="py-2 px-3 font-semibold">Node Name</th>
                <th className="py-2 px-3 font-semibold">IP Address</th>
                <th className="py-2 px-3 font-semibold">Type</th>
                <th className="py-2 px-3 font-semibold">Region</th>
                <th className="py-2 px-3 font-semibold">Province</th>
                <th className="py-2 px-3 font-semibold">Parent</th>
                <th className="py-2 px-3 font-semibold">Childs</th>
                <th className="py-2 px-3 font-semibold">Location</th>
                <th className="py-2 px-3 font-semibold">Impact</th>
                <th className="py-2 px-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center text-gray-400 py-10 text-sm">
                    No affected nodes found.
                  </td>
                </tr>
              ) : (
                filtered.map((node) => (
                  <tr key={node.deviceId ?? node.deviceName} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="py-2.5 px-3 font-medium text-gray-800">{node.deviceName}</td>
                    <td className="py-2.5 px-3 text-gray-600 font-mono text-xs">{node.ip}</td>
                    <td className="py-2.5 px-3">
                      <span className={`${getTypeBadgeClass(getNodeType(node))} text-xs font-semibold px-2 py-0.5 rounded`}>
                        {getNodeType(node)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-600">{getNodeRegion(node)}</td>
                    <td className="py-2.5 px-3 text-gray-600">{getNodeProvince(node)}</td>
                    <td className="py-2.5 px-3 text-gray-500 text-xs">{node.parent ?? "-"}</td>
                    <td className="py-2.5 px-3 text-gray-500 text-xs">{node.childs ?? "-"}</td>
                    <td className="py-2.5 px-3 text-gray-500 text-xs whitespace-nowrap">{getNodeLocation(node)}</td>
                    <td className="py-2.5 px-3 text-gray-500 text-xs">{node.impactType ?? "-"}</td>
                    <td className="py-2.5 px-3">
                      <span className={`${getStatusBadgeClass(node.status)} text-xs font-bold px-2 py-0.5 rounded`}>
                        {normalizeStatus(node.status)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
