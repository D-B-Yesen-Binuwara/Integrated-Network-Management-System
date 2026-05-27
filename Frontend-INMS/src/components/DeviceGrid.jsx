import {
  getDeviceTypeLabel,
  getPriorityLabel,
  normalizeStatus,
  getStatusBadgeClass,
  getTypeBadgeClass,
  getPriorityBadgeClass
} from '../utils/formatters';

export default function DeviceGrid({ devices, getAssignedOperatorName, onView, onEdit }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500 uppercase text-xs">
              <th className="py-2 px-3 font-semibold">Device Name</th>
              <th className="py-2 px-3 font-semibold">IP</th>
              <th className="py-2 px-3 font-semibold">Device Type</th>
              <th className="py-2 px-3 font-semibold">Status</th>
              <th className="py-2 px-3 font-semibold">Priority</th>
              <th className="py-2 px-3 font-semibold">LEA ID</th>
              <th className="py-2 px-3 font-semibold">Assigned User</th>
              <th className="py-2 px-3 font-semibold">Latitude</th>
              <th className="py-2 px-3 font-semibold">Longitude</th>
              <th className="py-2 px-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((device) => (
              <tr key={device.deviceId ?? `${device.deviceName}-${device.ip}`} className="border-b border-gray-100 hover:bg-gray-50 transition">
                <td className="py-2.5 px-3 font-medium text-gray-800">{device.deviceName}</td>
                <td className="py-2.5 px-3 text-gray-600 font-mono text-xs">{device.ip ?? '-'}</td>
                <td className="py-2.5 px-3">
                  <span className={`${getTypeBadgeClass(device.deviceType)} text-xs font-semibold px-2 py-0.5 rounded`}>
                    {getDeviceTypeLabel(device.deviceType)}
                  </span>
                </td>
                <td className="py-2.5 px-3">
                  <span className={`${getStatusBadgeClass(device.status)} text-xs font-bold px-2 py-0.5 rounded`}>
                    {normalizeStatus(device.status)}
                  </span>
                </td>
                <td className="py-2.5 px-3">
                  <span className={`${getPriorityBadgeClass(device.priorityLevel)} text-xs font-semibold px-2 py-0.5 rounded`}>
                    {getPriorityLabel(device.priorityLevel)}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-gray-600">{device.leaId ?? '-'}</td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2">
                    {device.assignedUserServiceId && (
                      <span className="text-xs font-mono text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">{device.assignedUserServiceId}</span>
                    )}
                    <span className="text-gray-600">{getAssignedOperatorName(device)}</span>
                  </div>
                </td>
                <td className="py-2.5 px-3 text-gray-600">{device.latitude ?? '-'}</td>
                <td className="py-2.5 px-3 text-gray-600">{device.longitude ?? '-'}</td>
                <td className="py-2.5 px-3">
                  <div className="inline-flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onEdit(device)}
                      className="text-slate-700 hover:text-slate-900 text-xs font-medium"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onView(device)}
                      className="text-indigo-600 hover:text-indigo-700 hover:underline text-xs font-medium"
                    >
                      View
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}