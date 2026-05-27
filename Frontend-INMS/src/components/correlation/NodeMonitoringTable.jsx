import {
  ALARM_TYPE,
  formatBatteryRemaining,
  getAlarmBadgeClass,
  getAlarmLabel,
  getAlarmStatus,
  getBatteryRemaining,
  normalizeMsanSubtype,
  normalizeNodeType
} from '../../utils/correlation';

function formatDateTime(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

export default function NodeMonitoringTable({
  nodes,
  now,
  onReassignVendor,
  onReassignCustomer
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200">
        <h2 className="text-base font-semibold text-slate-900">Node Monitoring</h2>
        <p className="text-xs text-slate-500 mt-0.5">Heartbeat-based alarm correlation by node</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 uppercase text-xs">
              <th className="py-2.5 px-3 font-semibold">Node ID/Name</th>
              <th className="py-2.5 px-3 font-semibold">Node Type</th>
              <th className="py-2.5 px-3 font-semibold">MSAN Subtype</th>
              <th className="py-2.5 px-3 font-semibold">Vendor</th>
              <th className="py-2.5 px-3 font-semibold">Customer</th>
              <th className="py-2.5 px-3 font-semibold">Alarm Status</th>
              <th className="py-2.5 px-3 font-semibold">Last Heartbeat</th>
              <th className="py-2.5 px-3 font-semibold">Battery Remaining</th>
              <th className="py-2.5 px-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {nodes.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-400">No nodes match the current filters.</td>
              </tr>
            ) : (
              nodes.map((node) => {
                const nodeType = normalizeNodeType(node.nodeType);
                const alarmStatus = getAlarmStatus(node, now);
                const batteryRemaining = getBatteryRemaining(node, now);
                const showBattery = nodeType === 'MSAN' && alarmStatus !== ALARM_TYPE.UP;

                return (
                  <tr key={node.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-800">{node.name}</span>
                        <span className="text-xs text-slate-500">#{node.id}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">{nodeType || '-'}</td>
                    <td className="py-2.5 px-3 text-slate-700">{nodeType === 'MSAN' ? (normalizeMsanSubtype(node.msanSubtype) || '-') : '-'}</td>
                    <td className="py-2.5 px-3 text-slate-700">{node.vendorName || '-'}</td>
                    <td className="py-2.5 px-3 text-slate-700">{node.customerName || '-'}</td>
                    <td className="py-2.5 px-3">
                      <span className={`${getAlarmBadgeClass(alarmStatus)} text-xs font-semibold px-2 py-0.5 rounded`}>
                        {getAlarmLabel(alarmStatus)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">{formatDateTime(node.lastHeartbeat)}</td>
                    <td className="py-2.5 px-3 text-slate-700">{showBattery ? formatBatteryRemaining(batteryRemaining) : '-'}</td>
                    <td className="py-2.5 px-3">
                      <div className="inline-flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => onReassignVendor(node)}
                          className="text-indigo-600 hover:text-indigo-700 text-xs font-medium"
                        >
                          Reassign Vendor
                        </button>
                        <button
                          type="button"
                          onClick={() => onReassignCustomer(node)}
                          className="text-emerald-600 hover:text-emerald-700 text-xs font-medium"
                        >
                          Reassign Customer
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
