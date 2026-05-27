import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import DeviceService from '../services/DeviceService';
import { normalizeStatus } from '../utils/formatters';

const NetworkMap = () => {
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);
  const markerLayer = useRef(L.layerGroup());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const MARKER_SHADOW_URL = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png';
  const STATUS_COLORS = {
    UP: '#16a34a',
    DOWN: '#dc2626',
    UNREACHABLE: '#facc15'
  };
  const DEVICE_TYPE_LEGEND = [
    { label: 'SLBN', value: 'SLBN' },
    { label: 'CEAN', value: 'CEAN' },
    { label: 'MSAN', value: 'MSAN' },
    { label: 'Customer', value: 'Customer' }
  ];

  const STATUS_LEGEND = [
    { label: 'UP', value: 'UP' },
    { label: 'DOWN', value: 'DOWN' },
    { label: 'UNREACHABLE', value: 'UNREACHABLE' }
  ];

  const initializeMap = () => {
    if (mapInstance.current) {
      return;
    }

    mapInstance.current = L.map(mapContainer.current).setView([7.8731, 80.7718], 7);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapInstance.current);

    markerLayer.current.addTo(mapInstance.current);

    setTimeout(() => {
      if (mapInstance.current) {
        mapInstance.current.invalidateSize();
      }
    }, 0);
  };

  const getStatusColor = (status) => {
    const normalized = normalizeStatus(status);
    if (normalized === 'DOWN') {
      return STATUS_COLORS.DOWN;
    }
    if (normalized === 'UNREACHABLE') {
      return STATUS_COLORS.UNREACHABLE;
    }
    return STATUS_COLORS.UP;
  };

  const getInnerShapeSvg = (deviceType) => {
    const typeLabel = String(deviceType ?? '').trim().toUpperCase();

    if (typeLabel === 'SLBN' || deviceType === 0) {
      return '<circle cx="16" cy="14" r="4.1" fill="#111827" />';
    }

    if (typeLabel === 'CEAN' || deviceType === 1) {
      return '<rect x="11.7" y="9.7" width="8.6" height="8.6" rx="1" fill="#111827" />';
    }

    if (typeLabel === 'MSAN' || deviceType === 2) {
      return '<polygon points="16,8.9 21.1,17.7 10.9,17.7" fill="#111827" />';
    }

    return '<polygon points="16,8.7 21.3,14 16,19.3 10.7,14" fill="#111827" />';
  };

  const getPegSvgDataUrl = (status, deviceType) => {
    const pegColor = getStatusColor(status);
    const innerShape = getInnerShapeSvg(deviceType);

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="46" viewBox="0 0 32 46">
        <path d="M16 1.5C8.4 1.5 2.2 7.7 2.2 15.3c0 9.9 11.4 20.1 13.2 21.6.4.4 1 .4 1.4 0 1.8-1.5 13.2-11.7 13.2-21.6C29.8 7.7 23.6 1.5 16 1.5Z" fill="${pegColor}" stroke="#1f2937" stroke-width="1.2" />
        <circle cx="16" cy="14" r="8.1" fill="#f8fafc" />
        ${innerShape}
      </svg>
    `;

    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  };

  const getMarkerIcon = (status, deviceType) => {
    return L.icon({
      iconUrl: getPegSvgDataUrl(status, deviceType),
      shadowUrl: MARKER_SHADOW_URL,
      iconSize: [26, 40],
      iconAnchor: [13, 40],
      popupAnchor: [0, -34],
      shadowSize: [41, 41],
      shadowAnchor: [13, 40]
    });
  };

  const plotMarkers = (devices) => {
    markerLayer.current.clearLayers();

    for (const device of devices) {
      L.marker([device.latitude, device.longitude], {
        icon: getMarkerIcon(device.status, device.deviceType)
      })
        .bindPopup(
          `<strong>Device ID:</strong> ${device.deviceId}<br>
           <strong>Device Name:</strong> ${device.deviceName}<br>
           <strong>Device Type:</strong> ${device.deviceType}<br>
           <strong>Status:</strong> ${normalizeStatus(device.status)}`
        )
        .addTo(markerLayer.current);
    }
  };

  const loadMapDevices = async () => {
    try {
      const devices = await DeviceService.getDevicesForMap();
      plotMarkers(devices);
      if (mapInstance.current) {
        mapInstance.current.invalidateSize();
      }
      setLoading(false);
    } catch (err) {
      setError('Failed to load map devices. Is the API running?');
      setLoading(false);
      console.error(err);
    }
  };

  useEffect(() => {
    setLoading(true);
    initializeMap();
    loadMapDevices();

    // Cleanup
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="mx-auto pr-4 pl-4">
        <div className="bg-white rounded-lg border-2 border-gray-300 shadow-lg overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-300 bg-gray-50">
            <h2 className="text-xl font-bold text-gray-800">Network Map - Sri Lanka</h2>
            <p className="text-sm text-gray-600 mt-1">Real-time network device visualization and monitoring</p>
          </div>

          {/* Error */}
          {error && (
            <div className="m-6 bg-red-50 border-2 border-red-300 text-red-700 rounded-lg px-6 py-4">
              <div className="flex items-start">
                <span className="text-2xl mr-3">⚠️</span>
                <div>
                  <h3 className="font-semibold">Failed to Load Map</h3>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Map Container */}
          <div className="border-t border-gray-300 relative">
            <div
              ref={mapContainer}
              style={{ height: '600px' }}
              className="w-full"
            ></div>

            <div className="absolute top-4 right-4 z-[500] flex flex-col gap-3">
              <div className="bg-white/95 backdrop-blur-sm border border-gray-300 rounded-lg shadow-md px-3 py-2">
                <h4 className="text-xs font-bold text-gray-800 mb-2">Device Type</h4>
                <div className="space-y-1.5">
                  {DEVICE_TYPE_LEGEND.map((item) => (
                    <div key={item.value} className="flex items-center gap-2">
                      <img
                        src={getPegSvgDataUrl('UP', item.value)}
                        alt={item.label}
                        className="w-[18px] h-[28px]"
                      />
                      <span className="text-xs text-gray-700">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white/95 backdrop-blur-sm border border-gray-300 rounded-lg shadow-md px-3 py-2">
                <h4 className="text-xs font-bold text-gray-800 mb-2">Status Colour</h4>
                <div className="space-y-1.5">
                  {STATUS_LEGEND.map((item) => (
                    <div key={item.value} className="flex items-center gap-2">
                      <img
                        src={getPegSvgDataUrl(item.value, 'SLBN')}
                        alt={item.label}
                        className="w-[18px] h-[28px]"
                      />
                      <span className="text-xs text-gray-700">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {loading && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500 bg-white/75">
                <svg className="animate-spin h-8 w-8 mr-3 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                <span className="text-lg font-medium">Loading map...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkMap;
