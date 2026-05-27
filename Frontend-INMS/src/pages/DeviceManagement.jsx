import { useEffect, useMemo, useState } from 'react';
import DeviceService from '../services/DeviceService';
import DeviceManagementFilter from '../components/DeviceManagementFilter';
import DeviceCard from '../components/DeviceCard';
import DeviceGrid from '../components/DeviceGrid';
import DeviceFormModal from '../components/DeviceFormModal';
import DeviceDetailsModal from '../components/DeviceDetailsModal';
import { getDeviceTypeLabel, normalizeStatus } from '../utils/formatters';

function getAssignedOperatorName(device) {
  return device.assignedUserFullName || (device.assignedUserId != null ? `User #${device.assignedUserId}` : '-');
}

function matchesSearch(device, searchTerm) {
  if (!searchTerm) return true;
  const term = searchTerm.toLowerCase();
  const assignedServiceId = String(device.assignedUserServiceId ?? '').toLowerCase();
  return (
    String(device.ip ?? '').toLowerCase().includes(term)
    || String(device.deviceName ?? '').toLowerCase().includes(term)
    || String(device.assignedUserFullName ?? '').toLowerCase().includes(term)
    || assignedServiceId.includes(term)
  );
}

function mapById(devices) {
  const map = new Map();
  devices.forEach((device) => {
    if (device.deviceId != null) {
      map.set(device.deviceId, device);
    }
  });
  return map;
}

export default function DeviceManagement() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedUser, setSelectedUser] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [viewMode, setViewMode] = useState('card');

  const [activeDevice, setActiveDevice] = useState(null);
  const [formMode, setFormMode] = useState('add');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadDevices = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await DeviceService.getAll();
      setDevices(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setError('Failed to load devices. Is the API running?');
      console.error(requestError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);

  const devicesById = useMemo(() => mapById(devices), [devices]);

  const filteredDevices = useMemo(() => {
    return devices.filter((device) => {
      const typeLabel = getDeviceTypeLabel(device.deviceType);
      const matchesType = selectedType === 'All' || typeLabel === selectedType;
      const matchesUser = selectedUser === 'All' || String(device.assignedUserId ?? '') === selectedUser;
      const statusLabel = normalizeStatus(device.status);
      const matchesStatus = selectedStatus === 'All' || statusLabel === selectedStatus;
      return matchesType && matchesUser && matchesStatus && matchesSearch(device, search);
    });
  }, [devices, search, selectedType, selectedUser, selectedStatus]);

  const openAddModal = () => {
    setFormMode('add');
    setActiveDevice(null);
    setIsFormOpen(true);
  };

  const openEditModal = (device) => {
    const latestDevice = device?.deviceId != null
      ? (devicesById.get(device.deviceId) ?? device)
      : device;

    setFormMode('edit');
    setActiveDevice(latestDevice);
    setIsDetailsOpen(false);
    setIsFormOpen(true);
  };

  const openDetails = (device) => {
    const latestDevice = device?.deviceId != null
      ? (devicesById.get(device.deviceId) ?? device)
      : device;

    setActiveDevice(latestDevice);
    setIsDetailsOpen(true);
  };

  const closeDetails = () => {
    setIsDetailsOpen(false);
  };

  const closeForm = () => {
    if (!submitting && !deleting) {
      setIsFormOpen(false);
    }
  };

  const handleDeleteDevice = async () => {
    if (formMode !== 'edit' || activeDevice?.deviceId == null || deleting) {
      return;
    }

    const confirmed = window.confirm(`Delete device "${activeDevice.deviceName ?? activeDevice.deviceId}"? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError('');

    try {
      await DeviceService.delete(activeDevice.deviceId);
      setDevices((previous) => previous.filter((device) => device.deviceId !== activeDevice.deviceId));
      setIsFormOpen(false);
      setIsDetailsOpen(false);
      setActiveDevice(null);
    } catch (apiError) {
      const errorMsg = apiError?.response?.data?.message || apiError?.message || 'Failed to delete device.';
      console.error('Delete device error:', apiError);
      throw new Error(errorMsg);
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmitForm = async (payload, fullFormData) => {
    setSubmitting(true);
    setError('');

    try {
      if (formMode === 'add') {
        const created = await DeviceService.create(payload);
        let createdDevice = created;

        if (created?.deviceId != null && fullFormData?.assignedUserId && Number(fullFormData.assignedUserId) > 0) {
          await DeviceService.assignUser(created.deviceId, Number(fullFormData.assignedUserId));
          createdDevice = {
            ...created,
            assignedUserId: Number(fullFormData.assignedUserId)
          };
        }

        if (createdDevice?.deviceId != null) {
          setDevices((previous) => {
            const next = Array.isArray(previous) ? [...previous] : [];
            // Check if device already exists
            const index = next.findIndex((item) => item.deviceId === createdDevice.deviceId);
            if (index >= 0) {
              next[index] = createdDevice;
            } else {
              next.unshift(createdDevice);
            }
            return next;
          });
        }
      } else if (activeDevice?.deviceId != null) {
        const updated = await DeviceService.update(activeDevice.deviceId, payload);
        let mergedDevice = { ...activeDevice, ...updated, ...payload };

        if (fullFormData?.assignedUserId && Number(fullFormData.assignedUserId) > 0) {
          await DeviceService.assignUser(activeDevice.deviceId, Number(fullFormData.assignedUserId));
        }

        // Reload to get assignedUserFullName from backend
        const refreshed = await DeviceService.getAll();
        const refreshedDevice = Array.isArray(refreshed)
          ? refreshed.find((d) => d.deviceId === activeDevice.deviceId)
          : null;
        mergedDevice = refreshedDevice ? { ...mergedDevice, ...refreshedDevice } : mergedDevice;

        // Map explicit status selection to simulation endpoints every time.
        // This avoids relying on stale local `isSimulatedDown` state after navigation.
        const nextStatus = String(fullFormData?.status ?? '').toUpperCase();

        if (nextStatus === 'DOWN') {
          await DeviceService.simulateFailure(activeDevice.deviceId);
          mergedDevice = {
            ...mergedDevice,
            status: 'DOWN',
            isSimulatedDown: true
          };
        }

        if (nextStatus === 'UP') {
          await DeviceService.recover(activeDevice.deviceId);
          mergedDevice = {
            ...mergedDevice,
            status: 'UP',
            isSimulatedDown: false
          };
        }

        setDevices((previous) => previous.map((device) => (
          device.deviceId === activeDevice.deviceId
            ? { ...device, ...mergedDevice }
            : device
        )));

        // Update the currently displayed details if in edit mode
        setActiveDevice(mergedDevice);
      }

      setIsFormOpen(false);
    } catch (apiError) {
      const errorMsg = apiError?.response?.data?.message || apiError?.message || 'Failed to save device.';
      console.error('Form submission error:', apiError);
      throw new Error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Device Management</h1>
          <p className="text-sm text-slate-500 mt-1">Monitor, filter, review, and maintain network devices.</p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 shadow-md transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add New Device
        </button>
      </header>

      {error && (
        <div className="px-4 py-3 rounded-lg text-sm font-medium bg-red-50 text-red-800 border border-red-200">
          {error}
        </div>
      )}

      <DeviceManagementFilter
        search={search}
        selectedType={selectedType}
        selectedUser={selectedUser}
        selectedStatus={selectedStatus}
        onSearchChange={setSearch}
        onTypeChange={setSelectedType}
        onUserChange={setSelectedUser}
        onStatusChange={setSelectedStatus}
      />
      <div className="flex justify-end -mt-0 -mb-0">
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0 shadow-sm">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`inline-flex items-center justify-center h-7 w-7 rounded-md transition ${
              viewMode === 'grid'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
            aria-label="Switch to grid view"
            title="Grid view"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('card')}
            className={`inline-flex items-center justify-center h-6 w-6 rounded-md transition ${
              viewMode === 'card'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
            aria-label="Switch to card view"
            title="Card view"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="4" width="18" height="6" rx="1" />
              <rect x="3" y="14" width="18" height="6" rx="1" />
            </svg>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-500 bg-white rounded-xl border border-slate-200">
          <svg className="animate-spin h-6 w-6 mr-3 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading devices...
        </div>
      ) : filteredDevices.length === 0 ? (
        <div className="text-center text-slate-400 py-12 text-sm border border-dashed border-slate-300 rounded-xl bg-white">
          No devices match your current filters.
        </div>
      ) : (
        <>
          {viewMode === 'card' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {filteredDevices.map((device) => (
                <DeviceCard
                  key={device.deviceId ?? `${device.deviceName}-${device.ip}`}
                  device={device}
                  assignedOperatorName={getAssignedOperatorName(device)}
                  onView={openDetails}
                  onEdit={openEditModal}
                />
              ))}
            </div>
          )}

          {viewMode === 'grid' && (
            <DeviceGrid
              devices={filteredDevices}
              getAssignedOperatorName={getAssignedOperatorName}
              onView={openDetails}
              onEdit={openEditModal}
            />
          )}
        </>
      )}

      {isDetailsOpen && activeDevice && (
        <DeviceDetailsModal
          device={activeDevice}
          assignedOperatorName={getAssignedOperatorName(activeDevice)}
          onClose={closeDetails}
          onEdit={openEditModal}
        />
      )}

      {isFormOpen && (
        <DeviceFormModal
          mode={formMode}
          initialDevice={formMode === 'edit' ? activeDevice : null}
          onClose={closeForm}
          onSubmit={handleSubmitForm}
          onDelete={handleDeleteDevice}
          submitting={submitting}
          deleting={deleting}
        />
      )}
    </div>
  );
}
