import { useEffect, useMemo, useState } from 'react';
import UserService from '../services/UserService';

const DEVICE_TYPE_OPTIONS = [
  { label: 'All', value: 'All' },
  { label: 'SLBN', value: 'SLBN' },
  { label: 'CEA', value: 'CEAN' },
  { label: 'MSAN', value: 'MSAN' },
  { label: 'Customer', value: 'Customer' }
];

const DEVICE_STATUS_OPTIONS = [
  { label: 'All Status', value: 'All' },
  { label: 'Up', value: 'UP' },
  { label: 'Down', value: 'DOWN' },
  { label: 'Unreachable', value: 'UNREACHABLE' }
];

function SelectChevron() {
  return (
    <svg
      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M5.5 7.5 10 12l4.5-4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function getUserOptionLabel(user) {
  const serviceId = user?.serviceId ?? user?.ServiceId ?? '';
  const fullName = user?.fullName ?? user?.FullName ?? '';
  const fallbackId = user?.userId ?? user?.UserId ?? '';

  if (serviceId && fullName) return `${serviceId} - ${fullName}`;
  if (fullName) return fullName;
  if (serviceId) return String(serviceId);
  if (fallbackId) return `User #${fallbackId}`;
  return 'Unknown User';
}

function getUserValue(user) {
  const userId = user?.userId ?? user?.UserId;
  if (userId != null) return String(userId);

  const serviceId = user?.serviceId ?? user?.ServiceId;
  return serviceId != null ? String(serviceId) : '';
}

export default function DeviceManagementFilter({
  search,
  selectedType,
  selectedUser,
  selectedStatus,
  onSearchChange,
  onTypeChange,
  onUserChange,
  onStatusChange
}) {
  const inputClass = 'w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10';
  const selectClass = 'w-full pl-3 pr-9 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 appearance-none';
  const [users, setUsers] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const loadUsers = async () => {
      try {
        const response = await UserService.getAll();
        if (!cancelled) {
          setUsers(Array.isArray(response) ? response : []);
        }
      } catch (error) {
        console.error('Failed to load users for filter:', error);
        if (!cancelled) {
          setUsers([]);
        }
      }
    };

    loadUsers();

    return () => {
      cancelled = true;
    };
  }, []);

  const userOptions = useMemo(() => {
    return users
      .map((user) => ({
        value: getUserValue(user),
        label: getUserOptionLabel(user)
      }))
      .filter((option) => option.value)
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [users]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by IP, Device Name or Service ID"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Device Type</label>
          <div className="relative">
            <select
              value={selectedType}
              onChange={(event) => onTypeChange(event.target.value)}
              className={selectClass}
            >
              {DEVICE_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <SelectChevron />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Assigned User</label>
          <div className="relative">
            <select
              value={selectedUser}
              onChange={(event) => onUserChange(event.target.value)}
              className={selectClass}
            >
              <option value="All">All Users</option>
              {userOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <SelectChevron />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Device Status</label>
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(event) => onStatusChange(event.target.value)}
              className={selectClass}
            >
              {DEVICE_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <SelectChevron />
          </div>
        </div>
      </div>
    </div>
  );
}
