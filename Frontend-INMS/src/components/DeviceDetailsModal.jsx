import { getDeviceTypeLabel, getPriorityLabel, normalizeStatus } from '../utils/formatters';

function DetailRow({ label, value }) {
  return (
    <div className="grid grid-cols-2 gap-3 py-2 border-b border-slate-100 last:border-b-0">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="text-sm text-slate-800 break-all">{value ?? '-'}</p>
    </div>
  );
}

export default function DeviceDetailsModal({ device, assignedOperatorName, onClose, onEdit }) {
  if (!device) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Device Details</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5">
          <DetailRow label="Device Name" value={device.deviceName} />
          <DetailRow label="IP" value={device.ip} />
          <DetailRow label="Device Type" value={getDeviceTypeLabel(device.deviceType)} />
          <DetailRow label="Status" value={normalizeStatus(device.status)} />
          <DetailRow label="Priority Level" value={getPriorityLabel(device.priorityLevel)} />
          <DetailRow label="LEA ID" value={device.leaId} />
          <DetailRow label="Assigned User" value={
            <span className="flex items-center gap-2">
              {assignedOperatorName}
              {device.assignedUserServiceId && (
                <span className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{device.assignedUserServiceId}</span>
              )}
            </span>
          } />
          <DetailRow label="Latitude" value={device.latitude} />
          <DetailRow label="Longitude" value={device.longitude} />
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-200 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => onEdit(device)}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
          >
            Edit Device
          </button>
        </div>
      </div>
    </div>
  );
}
