import { useEffect, useMemo, useState } from 'react';

const DEVICE_TYPE_OPTIONS = ['SLBN', 'CEAN', 'MSAN', 'Customer'];

const EMPTY_FORM = {
  name: '',
  brand: '',
  deviceType: '',
  description: ''
};

const inputClass = 'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10';

export default function VendorFormModal({ mode, initialVendor, onClose, onSubmit, submitting }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  useEffect(() => {
    setForm({
      name: initialVendor?.name ?? '',
      brand: initialVendor?.brand ?? '',
      deviceType: initialVendor?.deviceType ?? '',
      description: initialVendor?.description ?? ''
    });
    setError('');
  }, [initialVendor]);

  const isValid = useMemo(() => {
    return form.name.trim() !== '' && form.brand.trim() !== '' && form.deviceType !== '';
  }, [form]);

  const handleSubmit = async () => {
    if (!isValid || submitting) {
      return;
    }

    try {
      const payload = {
        name: form.name.trim(),
        brand: form.brand.trim(),
        deviceType: form.deviceType,
        description: form.description.trim() || undefined
      };
      console.log('[VendorFormModal] submitting payload:', payload);
      await onSubmit(payload);
    } catch (submitError) {
      console.error('[VendorFormModal] submit error:', submitError?.response?.data ?? submitError?.message);
      setError(submitError?.message ?? 'Failed to save vendor.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">{mode === 'add' ? 'Add Vendor' : 'Edit Vendor'}</h2>
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

        <div className="px-6 py-5 space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Vendor Name *</label>
            <input
              type="text"
              className={inputClass}
              value={form.name}
              onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))}
              placeholder="Enter vendor name"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Brand *</label>
            <input
              type="text"
              className={inputClass}
              value={form.brand}
              onChange={(event) => setForm((previous) => ({ ...previous, brand: event.target.value }))}
              placeholder="Enter brand name"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Device Type *</label>
            <select
              className={inputClass}
              value={form.deviceType}
              onChange={(event) => setForm((previous) => ({ ...previous, deviceType: event.target.value }))}
            >
              <option value="">Select device type</option>
              {DEVICE_TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Description</label>
            <textarea
              className={`${inputClass} min-h-24 resize-y`}
              value={form.description}
              onChange={(event) => setForm((previous) => ({ ...previous, description: event.target.value }))}
              placeholder="Optional vendor description"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-200 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid || submitting}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? 'Saving...' : mode === 'add' ? 'Add Vendor' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
