import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DeviceService from '../services/DeviceService';
import AlarmService from '../services/AlarmService';
import NodeFilterBar from '../components/NodeFilterBar';
import {
  getDeviceTypeLabel,
  getPriorityLabel,
  normalizeStatus,
  isUpStatus,
  isDownStatus,
  formatDate,
  getAlarmRowClass,
  getAlarmBadgeClass,
  getStatusBadgeClass,
  getTypeBadgeClass,
  getPriorityBadgeClass
} from '../utils/formatters';

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [devices, setDevices] = useState([]);
  const [alarms, setAlarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    region: '',
    type: '',
    status: ''
  });
  const [isActiveAlarmsExpanded, setIsActiveAlarmsExpanded] = useState(false);
  const [isDownNodesExpanded, setIsDownNodesExpanded] = useState(false);

  const toggleActiveAlarms = () => {
    setIsActiveAlarmsExpanded((prev) => {
      const next = !prev;
      if (next) {
        setIsDownNodesExpanded(false);
      }
      return next;
    });
  };

  const toggleDownNodes = () => {
    setIsDownNodesExpanded((prev) => {
      const next = !prev;
      if (next) {
        setIsActiveAlarmsExpanded(false);
      }
      return next;
    });
  };

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const [devicesData, alarmsData] = await Promise.all([
        DeviceService.getAll(),
        AlarmService.getAll()
      ]);

      setDevices(devicesData);
      setAlarms(alarmsData);
      setLastRefreshed(new Date());
    } catch (err) {
      setError('Failed to load devices. Is the API running?');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    load();
  };

  // Calculate metrics
  const totalNodes = devices.length;
  const activeNodes = devices.filter(d => isUpStatus(d.status)).length;
  const failedNodes = devices.filter(d => isDownStatus(d.status)).length;
  const activeAlarms = alarms.filter(a => a.isActive).length;

  const summaryCards = [
    {
      key: 'total',
      title: 'Total Nodes',
      value: totalNodes,
      caption: 'All monitored devices',
      containerClass: 'border-sky-200 bg-gradient-to-br from-sky-50 to-cyan-50',
      badgeClass: 'bg-sky-100 text-sky-700',
      icon: (
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <circle cx="12" cy="12" r="8.5" />
          <path d="M3.5 12h17" />
          <path d="M12 3.5a13.5 13.5 0 0 1 0 17" />
          <path d="M12 3.5a13.5 13.5 0 0 0 0 17" />
        </svg>
      )
    },
    {
      key: 'active',
      title: 'Active Nodes',
      value: activeNodes,
      caption: 'Nodes currently reachable',
      containerClass: 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-lime-50',
      badgeClass: 'bg-emerald-100 text-emerald-700',
      icon: (
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M12 4v4" />
          <path d="M12 16v4" />
          <path d="M4 12h4" />
          <path d="M16 12h4" />
          <circle cx="12" cy="12" r="5.5" />
          <path d="m9.5 12 1.6 1.8 3.4-3.6" />
        </svg>
      )
    },
    {
      key: 'down',
      title: 'Down Nodes',
      value: failedNodes,
      caption: 'Nodes requiring action',
      containerClass: 'border-rose-200 bg-gradient-to-br from-rose-50 to-orange-50',
      badgeClass: 'bg-rose-100 text-rose-700',
      icon: (
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M12 3.5 2.8 19.5h18.4L12 3.5Z" />
          <path d="M12 9v4.5" />
          <path d="M12 17.2h.01" />
        </svg>
      )
    },
    {
      key: 'alarms',
      title: 'Active Alarms',
      value: activeAlarms,
      caption: 'Unresolved network alerts',
      containerClass: 'border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50',
      badgeClass: 'bg-amber-100 text-amber-700',
      icon: (
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M12 4a5 5 0 0 1 5 5v3.2l1.5 2.3a1 1 0 0 1-.84 1.55H6.34a1 1 0 0 1-.84-1.55L7 12.2V9a5 5 0 0 1 5-5Z" />
          <path d="M10 18a2 2 0 0 0 4 0" />
        </svg>
      )
    }
  ];

  // Get recent active alarms
  const recentAlarms = alarms
    .filter(a => a.isActive)
    .sort((a, b) => new Date(b.raisedTime).getTime() - new Date(a.raisedTime).getTime())
    .slice(0, 5);

  const downNodes = devices
    .filter(d => isDownStatus(d.status))
    .sort((a, b) => (a.deviceName ?? '').localeCompare(b.deviceName ?? ''))
    .slice(0, 5);

  // Filter devices based on search and filters
  const filteredDevices = devices.filter(d => {
    const term = filters.search.toLowerCase();
    const matchesSearch =
      !term ||
      d.deviceName?.toLowerCase().includes(term) ||
      d.ip?.toLowerCase().includes(term);
    const deviceRegion = (d.regionName ?? d.region ?? '').toLowerCase();
    const matchesRegion = !filters.region || deviceRegion === filters.region.toLowerCase();
    const matchesType = !filters.type || getDeviceTypeLabel(d.deviceType) === filters.type;
    const matchesStatus = !filters.status || normalizeStatus(d.status) === filters.status;
    return matchesSearch && matchesRegion && matchesType && matchesStatus;
  });

  // Helper functions
  const getDeviceNameForAlarm = (deviceId) => {
    return devices.find(d => d.deviceId === deviceId)?.deviceName ?? `Device #${deviceId}`;
  };

  const hasAlarms = (deviceId) => {
    return alarms.some(a => a.deviceId === deviceId && a.isActive);
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20 text-gray-500">
          <svg className="animate-spin h-6 w-6 mr-3 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          Loading network data...
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-3 text-sm">
          ⚠️ {error}
        </div>
      )}

      {!loading && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            {summaryCards.map((card) => (
              <div
                key={card.key}
                className={`relative overflow-hidden rounded-2xl border px-5 py-4 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md ${card.containerClass}`}
              >
                <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/60" aria-hidden="true" />
                <div className="relative flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm md:text-base font-semibold uppercase tracking-wide text-gray-700">{card.title}</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{card.value}</p>
                    <p className="mt-1 text-xs text-gray-600">{card.caption}</p>
                  </div>
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${card.badgeClass}`}>
                    {card.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 items-start gap-4 mb-6">
            {/* Active Alarms */}
            <div className="self-start bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <button
                type="button"
                onClick={toggleActiveAlarms}
                className="w-full flex items-center justify-between gap-3 text-left"
                aria-expanded={isActiveAlarmsExpanded}
                aria-controls="active-alarms-content"
              >
                <h2 className="text-lg md:text-xl font-semibold text-gray-700">Active Alarms</h2>
                <div className="flex items-center gap-2 text-sm">
                  <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 px-2.5 py-0.5 font-semibold">
                    {activeAlarms} {activeAlarms === 1 ? 'alarm' : 'alarms'}
                  </span>
                  <svg
                    className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isActiveAlarmsExpanded ? 'rotate-180' : ''}`}
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden="true"
                  >
                    <path d="M4.5 7 10 13l5.5-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </button>

              {isActiveAlarmsExpanded && (
                <div id="active-alarms-content" className="mt-4">
                  {recentAlarms.length === 0 ? (
                    <div className="text-sm text-gray-400 text-center py-6 border border-dashed border-gray-200 rounded-lg">
                      No current alarms.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {recentAlarms.map((alarm) => (
                        <div
                          key={alarm.alarmId}
                          className={`${getAlarmRowClass(alarm.alarmType)} rounded-lg px-4 py-3 flex justify-between items-start`}
                        >
                          <div>
                            <span className={`${getAlarmBadgeClass(alarm.alarmType)} text-xs font-semibold px-2 py-0.5 rounded mr-2`}>
                              {alarm.alarmType}
                            </span>
                            <span className="text-sm text-gray-700">
                              {alarm.alarmType} at {getDeviceNameForAlarm(alarm.deviceId)}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                            {formatDate(alarm.raisedTime)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Down Nodes */}
            <div className="self-start bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <button
                type="button"
                onClick={toggleDownNodes}
                className="w-full flex items-center justify-between gap-3 text-left"
                aria-expanded={isDownNodesExpanded}
                aria-controls="down-nodes-content"
              >
                <h2 className="text-lg md:text-xl font-semibold text-gray-700">Down Nodes</h2>
                <div className="flex items-center gap-2 text-sm">
                  <span className="inline-flex items-center rounded-full bg-rose-100 text-rose-800 px-2.5 py-0.5 font-semibold">
                    {failedNodes} {failedNodes === 1 ? 'node' : 'nodes'}
                  </span>
                  <svg
                    className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isDownNodesExpanded ? 'rotate-180' : ''}`}
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden="true"
                  >
                    <path d="M4.5 7 10 13l5.5-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </button>

              {isDownNodesExpanded && (
                <div id="down-nodes-content" className="mt-4">
                  {downNodes.length === 0 ? (
                    <div className="text-sm text-gray-400 text-center py-6 border border-dashed border-gray-200 rounded-lg">
                      No down nodes currently.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {downNodes.map((device) => (
                        <div
                          key={device.deviceId}
                          className="bg-red-50 border-l-4 border-red-400 rounded-lg px-4 py-3 flex justify-between items-start"
                        >
                          <div>
                            <span className="bg-red-200 text-red-800 text-xs font-semibold px-2 py-0.5 rounded mr-2">
                              DOWN
                            </span>
                            <span className="text-sm text-gray-700">
                              {device.deviceName} ({device.ip})
                            </span>
                          </div>
                          <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                            {device.regionName ?? device.region ?? '-'} / {device.provinceName ?? device.province ?? '-'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Network Nodes Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg md:text-xl font-semibold text-gray-700">Network Nodes</h2>
              <button
                onClick={refresh}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-1.5 rounded-lg transition font-medium"
              >
                ↻ Refresh
              </button>
            </div>

            {/* Filters */}
            <NodeFilterBar filters={filters} onChange={setFilters} />

            {/* Table */}
            {filteredDevices.length === 0 ? (
              <div className="text-center text-gray-400 py-10 text-sm border border-dashed border-gray-200 rounded-lg">
                No devices match your filters.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-500 uppercase text-xs">
                        <th className="py-2 px-3 font-semibold">Name</th>
                        <th className="py-2 px-3 font-semibold">IP Address</th>
                        <th className="py-2 px-3 font-semibold">Type</th>
                        <th className="py-2 px-3 font-semibold">Region</th>
                        <th className="py-2 px-3 font-semibold">Province</th>
                        <th className="py-2 px-3 font-semibold">LEA ID</th>
                        <th className="py-2 px-3 font-semibold">Status</th>
                        <th className="py-2 px-3 font-semibold">Priority</th>
                        <th className="py-2 px-3 font-semibold">Alarms</th>
                        <th className="py-2 px-3 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDevices.map((device) => (
                        <tr key={device.deviceId} className="border-b border-gray-100 hover:bg-gray-50 transition">
                          <td className="py-2.5 px-3 font-medium text-gray-800">{device.deviceName}</td>
                          <td className="py-2.5 px-3 text-gray-600 font-mono text-xs">{device.ip}</td>
                          <td className="py-2.5 px-3">
                            <span className={`${getTypeBadgeClass(device.deviceType)} text-xs font-semibold px-2 py-0.5 rounded`}>
                              {getDeviceTypeLabel(device.deviceType)}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-gray-500">{device.regionName ?? device.region ?? '-'}</td>
                          <td className="py-2.5 px-3 text-gray-500">{device.provinceName ?? device.province ?? '-'}</td>
                          <td className="py-2.5 px-3 text-gray-500">{device.leaId}</td>
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
                          <td className="py-2.5 px-3">
                            <span className={`${hasAlarms(device.deviceId) ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'} text-xs font-semibold px-2 py-0.5 rounded`}>
                              {hasAlarms(device.deviceId) ? 'Failed' : 'Good'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <button
                              onClick={() => navigate(`/impact-analysis?deviceId=${device.deviceId}`)}
                              className="text-blue-600 hover:underline text-xs font-medium"
                            >
                              Analyze Impact
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="text-xs text-gray-400 mt-3">
                  Showing {filteredDevices.length} of {totalNodes} nodes &nbsp;·&nbsp;
                  Last refreshed: {formatTime(lastRefreshed.toISOString())}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
