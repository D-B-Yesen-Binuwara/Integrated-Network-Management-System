import { useEffect, useState } from 'react';
import VendorTable from '../../components/vendors/VendorTable';
import VendorService from '../../services/VendorService';
import VendorFormModal from './VendorFormModal';

function readFirst(source, keys, fallback = null) {
  for (const key of keys) {
    const value = source?.[key];
    if (value !== undefined && value !== null && String(value) !== '') {
      return value;
    }
  }
  return fallback;
}

function normalizeVendor(rawVendor) {
  return {
    id: String(readFirst(rawVendor, ['vendorId', 'id', 'vendorID'], '')),
    name: String(readFirst(rawVendor, ['name', 'vendorName'], 'Unknown Vendor')),
    brand: String(readFirst(rawVendor, ['brand'], '')),
    deviceType: String(readFirst(rawVendor, ['deviceType'], '')),
    description: String(readFirst(rawVendor, ['description', 'details'], '')),
    assignedNodeCount: Number(readFirst(rawVendor, ['deviceCount', 'assignedNodeCount', 'nodeCount'], 0)) || 0,
    isActive: readFirst(rawVendor, ['isActive'], true),
    createdAt: readFirst(rawVendor, ['createdAt'], undefined)
  };
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [modalState, setModalState] = useState({
    open: false,
    mode: 'add',
    vendor: null
  });

  const [submitting, setSubmitting] = useState(false);

  const loadVendors = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await VendorService.getAll();
      const list = (Array.isArray(data) ? data : []).map(normalizeVendor).filter((vendor) => vendor.id);
      setVendors(list);
    } catch (requestError) {
      const errorText = requestError?.response?.data?.message || requestError?.message || 'Failed to load vendors.';
      setError(errorText);
      console.error(requestError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const openAddModal = () => {
    setModalState({ open: true, mode: 'add', vendor: null });
  };

  const openEditModal = (vendor) => {
    setModalState({ open: true, mode: 'edit', vendor });
  };

  const closeModal = () => {
    if (!submitting) {
      setModalState({ open: false, mode: 'add', vendor: null });
    }
  };

  const handleSubmitVendor = async (payload) => {
    setSubmitting(true);
    setError('');

    try {
      if (modalState.mode === 'add') {
        await VendorService.create(payload);
        setMessage('Vendor created successfully.');
      } else if (modalState.vendor?.id) {
        await VendorService.update(modalState.vendor.id, { ...payload, isActive: modalState.vendor.isActive ?? true });
        setMessage('Vendor updated successfully.');
      }

      closeModal();
      await loadVendors();
    } catch (apiError) {
      const errorText = apiError?.response?.data?.message || apiError?.message || 'Failed to save vendor.';
      throw new Error(errorText);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVendor = async (vendor) => {
    if ((vendor.assignedNodeCount ?? 0) > 0) {
      window.alert('This vendor cannot be deleted because it has assigned nodes.');
      return;
    }

    const confirmed = window.confirm(`Delete vendor "${vendor.name}"? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await VendorService.delete(vendor.id);
      setMessage('Vendor deleted successfully.');
      await loadVendors();
    } catch (apiError) {
      const errorText = apiError?.response?.data?.message || apiError?.message || 'Failed to delete vendor.';
      setError(errorText);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide">Home / Vendors</p>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Vendor Management</h1>
          <p className="text-sm text-slate-500 mt-1">Create and manage NMS vendors and their supported node types.</p>
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
          Add Vendor
        </button>
      </header>

      {error && (
        <div className="px-4 py-3 rounded-lg text-sm font-medium bg-red-50 text-red-800 border border-red-200">
          {error}
        </div>
      )}

      {message && (
        <div className="px-4 py-3 rounded-lg text-sm font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
          {message}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 flex justify-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <VendorTable
          vendors={vendors}
          onEdit={openEditModal}
          onDelete={handleDeleteVendor}
        />
      )}

      {modalState.open && (
        <VendorFormModal
          mode={modalState.mode}
          initialVendor={modalState.vendor}
          onClose={closeModal}
          onSubmit={handleSubmitVendor}
          submitting={submitting}
        />
      )}
    </div>
  );
}
