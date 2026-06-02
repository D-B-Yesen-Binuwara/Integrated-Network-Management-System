// components/NodeFilterBar.jsx
import {
  getDeviceTypeLabel,
  normalizeStatus
} from "../utils/formatters";

const DEVICE_TYPES = ["SLBN", "CEAN", "MSAN", "Customer"];
const STATUSES = ["UP", "DOWN", "UNREACHABLE", "IMPACTED"];

function buildOptions(nodes, getValue, fallbackValues = []) {
  const values = new Set(fallbackValues);

  nodes.forEach((node) => {
    const value = getValue(node);
    if (value) {
      values.add(value);
    }
  });

  return Array.from(values).sort((a, b) => a.localeCompare(b));
}

export default function NodeFilterBar({ filters, onChange, nodes = [] }) {
  const regionOptions = buildOptions(nodes, (node) => node.regionName ?? node.region);
  const typeOptions = buildOptions(nodes, (node) => getDeviceTypeLabel(node.deviceType ?? node.type), DEVICE_TYPES);
  const statusOptions = buildOptions(nodes, (node) => normalizeStatus(node.status), STATUSES);

  const input = "border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400";

  return (
    <div className="flex flex-wrap gap-3 mb-4">
      <input
        type="text"
        value={filters.search}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
        placeholder="Search by name or IP..."
        className={`${input} flex-1 min-w-48`}
      />

      <select
        value={filters.region}
        onChange={(e) => onChange({ ...filters, region: e.target.value })}
        className={input}
      >
        <option value="">All Regions</option>
        {regionOptions.map((r) => <option key={r} value={r}>{r}</option>)}
      </select>

      <select
        value={filters.type}
        onChange={(e) => onChange({ ...filters, type: e.target.value })}
        className={input}
      >
        <option value="">All Types</option>
        {typeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>

      <select
        value={filters.status}
        onChange={(e) => onChange({ ...filters, status: e.target.value })}
        className={input}
      >
        <option value="">All Status</option>
        {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
    </div>
  );
}
