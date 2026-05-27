import { useCallback, useEffect, useMemo, useState } from 'react';
import SummaryCard from '../components/SummaryCard';
import AssignmentModal from '../components/correlation/AssignmentModal';
import CustomerImpactTable from '../components/correlation/CustomerImpactTable';
import NodeMonitoringTable from '../components/correlation/NodeMonitoringTable';
import CorrelationService from '../services/CorrelationService';
import {
  ALARM_TYPE,
  getAlarmStatus,
  getCustomerOverallStatus,
  normalizeMsanSubtype,
  normalizeNodeType
} from '../utils/correlation';

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
  const rawSupported = readFirst(rawVendor, ['supportedNodeTypes', 'supportedNodes', 'supportedTypes'], []);
  const supportedNodeTypes = Array.isArray(rawSupported)
    ? rawSupported
    : String(rawSupported)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

  return {
    id: String(readFirst(rawVendor, ['id', 'vendorId', 'vendorID'], '')),
    name: String(readFirst(rawVendor, ['name', 'vendorName'], 'Unknown Vendor')),
    supportedNodeTypes: supportedNodeTypes.map((type) => normalizeNodeType(type))
  };
}

function normalizeNodeTypeFromAny(value) {
  if (typeof value === 'number') {
    if (value === 2) return 'MSAN';
    if (value === 1) return 'CEA';
    if (value === 0) return 'SLBN';
  }
  return normalizeNodeType(value);
}

function normalizeNode(rawNode) {
  const batteryBackup = Number(readFirst(rawNode, ['batteryBackupHours', 'batteryHours', 'backupBatteryHours'], 0));
  return {
    id: String(readFirst(rawNode, ['id', 'nodeId', 'deviceId'], '')),
    name: String(readFirst(rawNode, ['name', 'nodeName', 'deviceName'], 'Unknown Node')),
    nodeType: normalizeNodeTypeFromAny(readFirst(rawNode, ['nodeType', 'type', 'deviceType'], '')),
    msanSubtype: normalizeMsanSubtype(readFirst(rawNode, ['msanSubtype', 'subType', 'nodeSubType'], '')),
    vendorId: String(readFirst(rawNode, ['vendorId', 'vendorID'], '')),
    vendorName: String(readFirst(rawNode, ['vendorName'], '')),
    customerId: String(readFirst(rawNode, ['customerId', 'customerID'], '')),
    customerName: String(readFirst(rawNode, ['customerName'], '')),
    batteryBackupHours: Number.isFinite(batteryBackup) ? batteryBackup : undefined,
    lastHeartbeat: readFirst(rawNode, ['lastHeartbeat', 'latestHeartbeat', 'heartbeatTimestamp', 'lastSeen'], null)
  };
}

function normalizeCustomer(rawCustomer) {
  return {
    id: String(readFirst(rawCustomer, ['id', 'customerId', 'customerID'], '')),
    name: String(readFirst(rawCustomer, ['name', 'customerName'], 'Unknown Customer'))
  };
}

const ALARM_FILTER_OPTIONS = [
  { label: 'All Alarm Status', value: 'All' },
  { label: 'UP', value: ALARM_TYPE.UP },
  { label: 'Power Down - Running on Battery', value: ALARM_TYPE.POWER_DOWN },
  { label: 'Battery Down', value: ALARM_TYPE.BATTERY_DOWN },
  { label: 'Link/Node Down', value: ALARM_TYPE.LINK_NODE_DOWN }
];

export default function CorrelationPage() {
  const [vendors, setVendors] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [now, setNow] = useState(new Date());

  const [filters, setFilters] = useState({
    vendorId: 'All',
    nodeType: 'All',
    msanSubtype: 'All',
    customerId: 'All',
    alarmStatus: 'All',
    search: ''
  });

  const [assignmentModalState, setAssignmentModalState] = useState({
    open: false,
    mode: 'vendor',
    node: null,
    value: ''
  });

  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const [vendorsResponse, nodesResponse, customersResponse] = await Promise.all([
        CorrelationService.getVendors(),
        CorrelationService.getNodes(),
        CorrelationService.getCustomers()
      ]);

      const normalizedVendors = (Array.isArray(vendorsResponse) ? vendorsResponse : []).map(normalizeVendor);
      const normalizedCustomers = (Array.isArray(customersResponse) ? customersResponse : []).map(normalizeCustomer);

      const vendorsById = new Map(normalizedVendors.map((vendor) => [String(vendor.id), vendor]));
      const customersById = new Map(normalizedCustomers.map((customer) => [String(customer.id), customer]));

      const normalizedNodes = (Array.isArray(nodesResponse) ? nodesResponse : []).map((rawNode) => {
        const node = normalizeNode(rawNode);
        return {
          ...node,
          vendorName: node.vendorName || vendorsById.get(String(node.vendorId))?.name || '',
          customerName: node.customerName || customersById.get(String(node.customerId))?.name || ''
        };
      });

      setVendors(normalizedVendors.filter((vendor) => vendor.id));
      setCustomers(normalizedCustomers.filter((customer) => customer.id));
      setNodes(normalizedNodes.filter((node) => node.id));
      setError('');
      setNow(new Date());
    } catch (loadError) {
      const errorText = loadError?.response?.data?.message || loadError?.message || 'Failed to load correlation data.';
      setError(errorText);
      console.error('Correlation data load failed:', loadError);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadData({ silent: true });
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [loadData]);

  const nodesWithAlarm = useMemo(() => {
    return nodes.map((node) => ({
      ...node,
      alarmStatus: getAlarmStatus(node, now)
    }));
  }, [nodes, now]);

  const customerImpactRows = useMemo(() => {
    return customers.map((customer) => {
      const customerNodes = nodes.filter((node) => String(node.customerId) === String(customer.id));
      const nodesDown = customerNodes.filter((node) => getAlarmStatus(node, now) !== ALARM_TYPE.UP).length;
      const overallStatus = getCustomerOverallStatus(customerNodes, now);

      return {
        id: customer.id,
        name: customer.name,
        nodeCount: customerNodes.length,
        nodesDown,
        overallStatus
      };
    });
  }, [customers, nodes, now]);

  const filteredNodes = useMemo(() => {
    return nodesWithAlarm.filter((node) => {
      const matchesVendor = filters.vendorId === 'All' || String(node.vendorId) === filters.vendorId;
      const matchesNodeType = filters.nodeType === 'All' || normalizeNodeType(node.nodeType) === filters.nodeType;
      const matchesMsanSubtype = filters.msanSubtype === 'All'
        || normalizeMsanSubtype(node.msanSubtype) === filters.msanSubtype
        || normalizeNodeType(node.nodeType) !== 'MSAN';
      const matchesCustomer = filters.customerId === 'All' || String(node.customerId) === filters.customerId;
      const matchesAlarm = filters.alarmStatus === 'All' || node.alarmStatus === filters.alarmStatus;

      const searchTerm = filters.search.trim().toLowerCase();
      const matchesSearch = !searchTerm
        || String(node.name || '').toLowerCase().includes(searchTerm)
        || String(node.customerName || '').toLowerCase().includes(searchTerm);

      return matchesVendor && matchesNodeType && matchesMsanSubtype && matchesCustomer && matchesAlarm && matchesSearch;
    });
  }, [nodesWithAlarm, filters]);

  const summary = useMemo(() => {
    const totalNodes = nodesWithAlarm.length;
    const nodesUp = nodesWithAlarm.filter((node) => node.alarmStatus === ALARM_TYPE.UP).length;
    const nodesDown = totalNodes - nodesUp;
    const affectedCustomers = customerImpactRows.filter((row) => row.overallStatus !== 'UP').length;

    return {
      totalVendors: vendors.length,
      totalNodes,
      nodesUp,
      nodesDown,
      affectedCustomers
    };
  }, [vendors, nodesWithAlarm, customerImpactRows]);

  const vendorOptions = useMemo(() => vendors.map((vendor) => ({ value: String(vendor.id), label: vendor.name })), [vendors]);
  const customerOptions = useMemo(() => customers.map((customer) => ({ value: String(customer.id), label: customer.name })), [customers]);

  const openAssignmentModal = (mode, node) => {
    const currentValue = mode === 'vendor' ? String(node.vendorId || '') : String(node.customerId || '');
    setAssignmentModalState({
      open: true,
      mode,
      node,
      value: currentValue
    });
  };

  const handleAssignmentSubmit = async (selectedValue) => {
    if (!assignmentModalState.node) {
      return;
    }

    setSubmitting(true);

    try {
      if (assignmentModalState.mode === 'vendor') {
        await CorrelationService.assignNodeVendor(assignmentModalState.node.id, selectedValue);
        setMessage('Node vendor reassigned successfully.');
      } else {
        await CorrelationService.assignNodeCustomer(assignmentModalState.node.id, selectedValue);
        setMessage('Node customer reassigned successfully.');
      }

      setAssignmentModalState({ open: false, mode: 'vendor', node: null, value: '' });
      await loadData({ silent: true });
    } catch (assignmentError) {
      const errorText = assignmentError?.response?.data?.message || assignmentError?.message || 'Failed to update node assignment.';
      setError(errorText);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Correlation</h1>
        <p className="text-sm text-slate-500">Vendor-node-customer mapping with heartbeat-based alarm correlation</p>
      </header>

      {error && (
        <div className="px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      {message && (
        <div className="px-4 py-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm">
          {message}
        </div>
      )}

      <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <SummaryCard title="Total Vendors" value={summary.totalVendors} color="bg-blue-50 border-blue-200" />
        <SummaryCard title="Total Nodes" value={summary.totalNodes} color="bg-cyan-50 border-cyan-200" />
        <SummaryCard title="Nodes Up" value={summary.nodesUp} color="bg-emerald-50 border-emerald-200" />
        <SummaryCard title="Nodes Down" value={summary.nodesDown} color="bg-rose-50 border-rose-200" />
        <SummaryCard title="Affected Customers" value={summary.affectedCustomers} color="bg-amber-50 border-amber-200" />
      </section>

      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Filter & Search</h2>
          <p className="text-xs text-slate-500 mt-0.5">Filter by vendor, node type, subtype, customer, and alarm status</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Vendor</label>
            <select
              value={filters.vendorId}
              onChange={(event) => setFilters((previous) => ({ ...previous, vendorId: event.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="All">All Vendors</option>
              {vendorOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Node Type</label>
            <select
              value={filters.nodeType}
              onChange={(event) => setFilters((previous) => ({ ...previous, nodeType: event.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="All">All Types</option>
              <option value="MSAN">MSAN</option>
              <option value="CEA">CEA</option>
              <option value="SLBN">SLBN</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">MSAN Subtype</label>
            <select
              value={filters.msanSubtype}
              onChange={(event) => setFilters((previous) => ({ ...previous, msanSubtype: event.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="All">All Subtypes</option>
              <option value="FIBRE">FIBRE</option>
              <option value="COPPER">COPPER</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Customer</label>
            <select
              value={filters.customerId}
              onChange={(event) => setFilters((previous) => ({ ...previous, customerId: event.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="All">All Customers</option>
              {customerOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Alarm Status</label>
            <select
              value={filters.alarmStatus}
              onChange={(event) => setFilters((previous) => ({ ...previous, alarmStatus: event.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              {ALARM_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(event) => setFilters((previous) => ({ ...previous, search: event.target.value }))}
              placeholder="Search node or customer"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
        </div>
      </section>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 flex justify-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <NodeMonitoringTable
            nodes={filteredNodes}
            now={now}
            onReassignVendor={(node) => openAssignmentModal('vendor', node)}
            onReassignCustomer={(node) => openAssignmentModal('customer', node)}
          />

          <CustomerImpactTable customers={customerImpactRows} />
        </>
      )}

      {assignmentModalState.open && assignmentModalState.node && (
        <AssignmentModal
          title={assignmentModalState.mode === 'vendor' ? 'Reassign Vendor' : 'Reassign Customer'}
          nodeName={assignmentModalState.node.name}
          options={assignmentModalState.mode === 'vendor' ? vendorOptions : customerOptions}
          value={assignmentModalState.value}
          onClose={() => setAssignmentModalState({ open: false, mode: 'vendor', node: null, value: '' })}
          onSubmit={handleAssignmentSubmit}
          submitting={submitting}
        />
      )}
    </div>
  );
}
