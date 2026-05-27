export const HEARTBEAT_TIMEOUT_HOURS = 5 / 60;

export const ALARM_TYPE = {
  UP: 'UP',
  POWER_DOWN: 'POWER_DOWN',
  BATTERY_DOWN: 'BATTERY_DOWN',
  LINK_NODE_DOWN: 'LINK_NODE_DOWN'
};

export function normalizeNodeType(nodeType) {
  const normalized = String(nodeType ?? '').trim().toUpperCase();
  if (normalized === 'CEAN') return 'CEA';
  return normalized;
}

export function normalizeMsanSubtype(subtype) {
  const normalized = String(subtype ?? '').trim().toUpperCase();
  if (!normalized) return '';
  if (normalized === 'FIBER') return 'FIBRE';
  return normalized;
}

export function getAlarmStatus(node, currentTime = new Date()) {
  const heartbeat = node?.lastHeartbeat;

  if (!heartbeat) {
    return ALARM_TYPE.LINK_NODE_DOWN;
  }

  const lastHeartbeat = new Date(heartbeat);

  if (Number.isNaN(lastHeartbeat.getTime())) {
    return ALARM_TYPE.LINK_NODE_DOWN;
  }

  const diffHours = (currentTime.getTime() - lastHeartbeat.getTime()) / (1000 * 60 * 60);

  if (diffHours <= HEARTBEAT_TIMEOUT_HOURS) {
    return ALARM_TYPE.UP;
  }

  const nodeType = normalizeNodeType(node?.nodeType);
  const batteryBackupHours = Number(node?.batteryBackupHours);

  if (nodeType === 'MSAN' && Number.isFinite(batteryBackupHours) && batteryBackupHours > 0) {
    if (diffHours <= batteryBackupHours) {
      return ALARM_TYPE.POWER_DOWN;
    }
    if (diffHours <= batteryBackupHours + 0.1) {
      return ALARM_TYPE.BATTERY_DOWN;
    }
    return ALARM_TYPE.LINK_NODE_DOWN;
  }

  return ALARM_TYPE.LINK_NODE_DOWN;
}

export function getBatteryRemaining(node, currentTime = new Date()) {
  const nodeType = normalizeNodeType(node?.nodeType);
  const batteryBackupHours = Number(node?.batteryBackupHours);

  if (nodeType !== 'MSAN' || !Number.isFinite(batteryBackupHours) || batteryBackupHours <= 0 || !node?.lastHeartbeat) {
    return null;
  }

  const lastHeartbeat = new Date(node.lastHeartbeat);

  if (Number.isNaN(lastHeartbeat.getTime())) {
    return null;
  }

  const diffHours = (currentTime.getTime() - lastHeartbeat.getTime()) / (1000 * 60 * 60);
  const remainingHours = Math.max(0, batteryBackupHours - diffHours);

  return remainingHours;
}

export function formatBatteryRemaining(remainingHours) {
  if (remainingHours == null) {
    return '-';
  }

  if (remainingHours <= 0) {
    return '0m';
  }

  const wholeHours = Math.floor(remainingHours);
  const minutes = Math.round((remainingHours - wholeHours) * 60);

  if (wholeHours <= 0) {
    return `${minutes}m`;
  }

  if (minutes <= 0) {
    return `${wholeHours}h`;
  }

  return `${wholeHours}h ${minutes}m`;
}

export function getAlarmLabel(alarmType) {
  switch (alarmType) {
    case ALARM_TYPE.UP:
      return 'UP';
    case ALARM_TYPE.POWER_DOWN:
      return 'Power Down - Running on Battery';
    case ALARM_TYPE.BATTERY_DOWN:
      return 'Battery Down';
    case ALARM_TYPE.LINK_NODE_DOWN:
      return 'Link/Node Down';
    default:
      return 'Unknown';
  }
}

export function getAlarmBadgeClass(alarmType) {
  switch (alarmType) {
    case ALARM_TYPE.UP:
      return 'bg-green-100 text-green-800 border border-green-200';
    case ALARM_TYPE.POWER_DOWN:
      return 'bg-orange-100 text-orange-800 border border-orange-200';
    case ALARM_TYPE.BATTERY_DOWN:
      return 'bg-red-100 text-red-700 border border-red-200';
    case ALARM_TYPE.LINK_NODE_DOWN:
      return 'bg-red-200 text-red-900 border border-red-300';
    default:
      return 'bg-slate-100 text-slate-700 border border-slate-200';
  }
}

export function getCustomerOverallStatus(nodes, currentTime = new Date()) {
  if (!Array.isArray(nodes) || nodes.length === 0) {
    return 'UP';
  }

  const upCount = nodes.filter((node) => getAlarmStatus(node, currentTime) === ALARM_TYPE.UP).length;

  if (upCount === nodes.length) {
    return 'UP';
  }

  if (upCount === 0) {
    return 'DOWN';
  }

  return 'DEGRADED';
}

export function getCustomerStatusBadgeClass(status) {
  if (status === 'UP') {
    return 'bg-green-100 text-green-800 border border-green-200';
  }
  if (status === 'DEGRADED') {
    return 'bg-amber-100 text-amber-800 border border-amber-200';
  }
  return 'bg-red-100 text-red-800 border border-red-200';
}
