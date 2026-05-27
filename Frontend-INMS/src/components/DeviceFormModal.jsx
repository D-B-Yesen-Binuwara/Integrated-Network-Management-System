import { useEffect, useMemo, useState } from 'react';
import { getDeviceTypeLabel, normalizeStatus } from '../utils/formatters';

const EMPTY_FORM = {
  deviceName: '',
  deviceType: 'SLBN',
  ip: '',
  status: 'UP',
  priorityLevel: 'Low',
  leaId: '',
  assignedUserId: '',
  latitude: '',
  longitude: ''
};

const inputCls = 'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10';
const selectCls = `${inputCls} pr-9 appearance-none`;

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

function normalizeType(value) {
  const label = getDeviceTypeLabel(value);
  return ['SLBN', 'CEAN', 'MSAN', 'Customer'].includes(label) ? label : 'SLBN';
}

function toFormValues(device) {
  if (!device) {
    return EMPTY_FORM;
  }

  return {
    deviceName: device.deviceName ?? '',
    deviceType: normalizeType(device.deviceType),
    ip: device.ip ?? '',
    status: normalizeStatus(device.status),
    priorityLevel: String(device.priorityLevel ?? 'Low'),
    leaId: device.leaId ?? '',
    assignedUserId: device.assignedUserId ?? '',
    latitude: device.latitude ?? '',
    longitude: device.longitude ?? ''
  };
}

function getDeviceTypeEnum(typeLabel) {
  const map = {
    'SLBN': 0,
    'CEAN': 1,
    'MSAN': 2,
    'Customer': 3
  };
  return map[typeLabel] ?? 0;
}

function getPriorityEnum(priorityLabel) {
  const map = {
    'Low': 1,
    'Avg': 2,
    'High': 3,
    'Critical': 4
  };
  return map[priorityLabel] ?? 1;
}

function toPayload(formValues) {
  return {
    deviceName: formValues.deviceName.trim(),
    deviceType: getDeviceTypeEnum(formValues.deviceType),
    ip: formValues.ip.trim(),
    status: normalizeStatus(formValues.status),
    priorityLevel: getPriorityEnum(formValues.priorityLevel),
    leaId: Number(formValues.leaId),
    latitude: Number(formValues.latitude),
    longitude: Number(formValues.longitude)
  };
}

export default function DeviceFormModal({ mode, initialDevice, onClose, onSubmit, onDelete, submitting, deleting }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    setForm(toFormValues(initialDevice));
    setSubmitError('');
  }, [initialDevice]);

  const isValid = useMemo(() => {
    return (
      form.deviceName.trim() !== ''
      && form.ip.trim() !== ''
      && form.leaId !== ''
      && form.latitude !== ''
      && form.longitude !== ''
    );
  }, [form]);

  const setField = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    setSubmitError('');
  };

  const handleSubmit = async () => {
    if (!isValid || submitting) {
      return;
    }

    try {
      await onSubmit(toPayload(form), form);
    } catch (error) {
      setSubmitError(error?.message ?? 'Unable to save device.');
    }
  };

  const handleDelete = async () => {
    if (mode !== 'edit' || !onDelete || deleting || submitting) {
      return;
    }

    try {
      await onDelete();
    } catch (error) {
      setSubmitError(error?.message ?? 'Unable to delete device.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">{mode === 'add' ? 'Add New Device' : 'Edit Device'}</h2>
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

        <div className="px-6 py-5 flex flex-col gap-4">
          {submitError && <p className="text-sm text-red-600">{submitError}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Device Name *</label>
              <input type="text" value={form.deviceName} onChange={(event) => setField('deviceName', event.target.value)} className={inputCls} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">IP *</label>
              <input type="text" value={form.ip} onChange={(event) => setField('ip', event.target.value)} className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Device Type *</label>
              <div className="relative">
                <select value={form.deviceType} onChange={(event) => setField('deviceType', event.target.value)} className={selectCls}>
                  <option value="SLBN">SLBN</option>
                  <option value="CEAN">CEAN</option>
                  <option value="MSAN">MSAN</option>
                  <option value="Customer">Customer</option>
                </select>
                <SelectChevron />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Status *</label>
              <div className="relative">
                <select value={form.status} onChange={(event) => setField('status', event.target.value)} className={selectCls}>
                  <option value="UP">UP</option>
                  <option value="DOWN">DOWN</option>
                </select>
                <SelectChevron />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Priority Level *</label>
              <div className="relative">
                <select value={form.priorityLevel} onChange={(event) => setField('priorityLevel', event.target.value)} className={selectCls}>
                  <option value="Low">Low</option>
                  <option value="Avg">Avg</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
                <SelectChevron />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">LEA ID *</label>
              <input type="number" value={form.leaId} onChange={(event) => setField('leaId', event.target.value)} className={inputCls} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Assigned User ID</label>
              <input type="number" value={form.assignedUserId} onChange={(event) => setField('assignedUserId', event.target.value)} className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Latitude *</label>
              <input type="number" step="any" value={form.latitude} onChange={(event) => setField('latitude', event.target.value)} className={inputCls} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Longitude *</label>
              <input type="number" step="any" value={form.longitude} onChange={(event) => setField('longitude', event.target.value)} className={inputCls} />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-200 rounded-b-2xl">
          {mode === 'edit' && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={submitting || deleting}
              className="mr-auto px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {deleting ? 'Deleting...' : 'Delete Device'}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            disabled={submitting || deleting}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid || submitting || deleting}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {submitting ? 'Saving...' : mode === 'add' ? 'Create Device' : 'Update Device'}
          </button>
        </div>
      </div>
    </div>
  );
}
