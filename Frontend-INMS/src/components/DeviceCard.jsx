import {
  getDeviceTypeLabel,
  getPriorityLabel,
  normalizeStatus,
  getStatusBadgeClass,
  getTypeBadgeClass,
  getPriorityBadgeClass
} from '../utils/formatters';

function DataItem({ label, value, mono = false }) {
  return (
    <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">{label}</p>
      <p className={`mt-1 text-sm text-slate-800 ${mono ? 'font-mono' : ''}`}>{value ?? '-'}</p>
    </div>
  );
}

export default function DeviceCard({ device, assignedOperatorName, onView, onEdit }) {
  const statusText = normalizeStatus(device.status);

  return (
    <article
      className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 hover:shadow-md transition cursor-pointer"
      onClick={() => onView(device)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onView(device);
        }
      }}
      aria-label={`View details for ${device.deviceName}`}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{device.deviceName}</h3>
          <p className="text-xs text-slate-500 mt-1">ID #{device.deviceId ?? '-'}</p>
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onEdit(device);
          }}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
        >
          Edit
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className={`${getTypeBadgeClass(device.deviceType)} text-xs font-semibold px-2 py-0.5 rounded`}>
          {getDeviceTypeLabel(device.deviceType)}
        </span>
        <span className={`${getStatusBadgeClass(device.status)} text-xs font-semibold px-2 py-0.5 rounded`}>
          {statusText}
        </span>
        <span className={`${getPriorityBadgeClass(device.priorityLevel)} text-xs font-semibold px-2 py-0.5 rounded`}>
          {getPriorityLabel(device.priorityLevel)}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        <DataItem label="IP" value={device.ip} mono />
        <DataItem label="LEA ID" value={device.leaId} />
        <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
          <p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">Assigned User</p>
          <div className="mt-1 flex items-center gap-2">
            {device.assignedUserServiceId && (
              <span className="text-xs font-mono text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">{device.assignedUserServiceId}</span>
            )}
            <p className="text-sm text-slate-800">{assignedOperatorName}</p>
          </div>
        </div>
        <DataItem label="Latitude" value={device.latitude} />
        <DataItem label="Longitude" value={device.longitude} />
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onView(device);
          }}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
        >
          View
        </button>
      </div>
    </article>
  );
}
