/**
 * @typedef {Object} Device
 * @property {number} deviceId
 * @property {string} deviceName
 * @property {string|number} deviceType - text label or backend enum value
 * @property {string} ip
 * @property {string|number} status - UP/DOWN or backend enum value
 * @property {string|number} priorityLevel - Low/Avg/High/Critical or backend enum value
 * @property {number} leaId
 * @property {number} latitude
 * @property {number} longitude
 * @property {number} [assignedUserId]
 */

export const deviceModelSchema = {
  deviceId: 'number',
  deviceName: 'string',
  deviceType: 'string|number (enum: SLBN, CEAN, MSAN, Customer)',
  ip: 'string',
  status: 'string|number (enum: UP, DOWN)',
  priorityLevel: 'string|number (enum: Low, Avg, High, Critical)',
  leaId: 'number',
  latitude: 'number',
  longitude: 'number',
  assignedUserId: 'number (optional)'
};

/**
 * @typedef {Object} DeviceMapPoint
 * @property {number} deviceId
 * @property {string} deviceName
 * @property {string} deviceType
 * @property {number} latitude
 * @property {number} longitude
 * @property {string} status
 * @property {number} isImpacted
 */

export const deviceMapPointSchema = {
  deviceId: 'number',
  deviceName: 'string',
  deviceType: 'string',
  latitude: 'number',
  longitude: 'number',
  status: 'string',
  isImpacted: 'number (0 or 1)'
};
