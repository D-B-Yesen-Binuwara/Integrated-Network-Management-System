import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getDeviceTypeLabel, getStatusBadgeClass, getTypeBadgeClass, normalizeStatus } from '../utils/formatters';
import ImpactAnalysisService from '../services/ImpactAnalysisService';

const EMPTY_RESULT = {
  device: null,
  rootCause: null,
  impactedDevices: []
};

function MetricCard({ label, value, hint, className }) {
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${className}`}>
      <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{label}</div>
      <div className="mt-2 text-3xl font-semibold text-slate-950">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{hint}</div>
    </div>
  );
}

function formatDateTime(value) {
  if (!value) {
    return '-';
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleString();
}

function normalizeResult(result) {
  return {
    device: result?.device ?? null,
    rootCause: result?.rootCause ?? null,
    impactedDevices: Array.isArray(result?.impactedDevices) ? result.impactedDevices : []
  };
}

export default function ImpactAnalysis() {
  const [searchParams] = useSearchParams();
  const [deviceIdInput, setDeviceIdInput] = useState(searchParams.get('deviceId') ?? '');
  const [result, setResult] = useState(EMPTY_RESULT);
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const deviceId = searchParams.get('deviceId');
    if (deviceId) {
      setDeviceIdInput(deviceId);
      void loadResult(Number(deviceId));
    }
  }, [searchParams]);

  const impactedByType = useMemo(() => {
    return result.impactedDevices.reduce(
      (accumulator, device) => {
        const label = getDeviceTypeLabel(device.deviceType);
        if (label in accumulator) {
          accumulator[label] += 1;
        }
        return accumulator;
      },
      { SLBN: 0, CEAN: 0, MSAN: 0, Customer: 0 }
    );
  }, [result.impactedDevices]);

  const rootCauseLabel = result.rootCause?.rootCauseType ?? 'No root cause';

  async function loadResult(deviceId) {
    if (!Number.isFinite(deviceId) || deviceId <= 0) {
      setError('Enter a valid device ID.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await ImpactAnalysisService.getResult(deviceId);
      setResult(normalizeResult(response));
    } catch (err) {
      setResult(EMPTY_RESULT);
      setError(err?.response?.data?.title ?? err?.message ?? 'Failed to load impact analysis.');
    } finally {
      setLoading(false);
    }
  }

  async function runAnalysis() {
    const deviceId = Number(deviceIdInput);
    if (!Number.isFinite(deviceId) || deviceId <= 0) {
      setError('Enter a valid device ID.');
      return;
    }

    setAction('analyze');
    setError('');

    try {
      const response = await ImpactAnalysisService.analyze(deviceId);
      setResult(normalizeResult(response));
    } catch (err) {
      setError(err?.response?.data?.title ?? err?.message ?? 'Failed to run impact analysis.');
    } finally {
      setAction('');
    }
  }

  async function clearImpact() {
    const deviceId = Number(deviceIdInput);
    if (!Number.isFinite(deviceId) || deviceId <= 0) {
      setError('Enter a valid device ID.');
      return;
    }

    setAction('clear');
    setError('');

    try {
      const response = await ImpactAnalysisService.clear(deviceId);
      setResult(normalizeResult(response));
    } catch (err) {
      setError(err?.response?.data?.title ?? err?.message ?? 'Failed to clear impact analysis.');
    } finally {
      setAction('');
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#1e293b,_#020617_55%)] px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/90 shadow-[0_30px_120px_rgba(15,23,42,0.4)] backdrop-blur">
          <div className="border-b border-slate-200 px-6 py-6 sm:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-600">Impact Analysis</div>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                  Rebuilt fault localization flow
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-600">
                  Run an analysis for a device, inspect the root cause, and review all downstream impacted nodes from the backend.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <MetricCard
                  label="Root cause"
                  value={result.rootCause ? 'Detected' : 'None'}
                  hint={rootCauseLabel}
                  className="border-cyan-100 bg-cyan-50"
                />
                <MetricCard
                  label="Impacted devices"
                  value={result.impactedDevices.length}
                  hint="Downstream nodes returned by the API"
                  className="border-amber-100 bg-amber-50"
                />
                <MetricCard
                  label="Selected device"
                  value={result.device?.deviceName ?? '—'}
                  hint={`Status: ${normalizeStatus(result.device?.status)}`}
                  className="border-slate-100 bg-slate-50"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6 px-6 py-6 sm:px-8">
            <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[1fr_auto_auto] lg:items-end">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Device ID</span>
                <input
                  type="number"
                  min="1"
                  value={deviceIdInput}
                  onChange={(event) => setDeviceIdInput(event.target.value)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  placeholder="Type a device ID"
                />
              </label>

              <button
                type="button"
                onClick={runAnalysis}
                disabled={loading || action !== ''}
                className="rounded-xl bg-cyan-600 px-5 py-3 font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {action === 'analyze' ? 'Analyzing...' : 'Run Analysis'}
              </button>

              <button
                type="button"
                onClick={clearImpact}
                disabled={loading || action !== ''}
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {action === 'clear' ? 'Clearing...' : 'Clear Impact'}
              </button>
            </div>

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-10 text-center text-slate-500">
                Loading impact analysis...
              </div>
            ) : (
              <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-950">Root Cause</h2>
                      <p className="text-sm text-slate-500">Current analysis result for the selected device.</p>
                    </div>
                    <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-medium text-cyan-800">
                      {rootCauseLabel}
                    </span>
                  </div>

                  {result.rootCause ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Device</div>
                        <div className="mt-2 text-sm font-medium text-slate-950">{result.device?.deviceName ?? 'Unknown'}</div>
                        <div className="mt-1 text-xs text-slate-500">ID {result.device?.deviceId ?? '—'}</div>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Detected Time</div>
                        <div className="mt-2 text-sm font-medium text-slate-950">
                          {formatDateTime(result.rootCause.detectedTime)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                      No root cause has been detected yet for the selected device.
                    </div>
                  )}
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-950">Impact Summary</h2>
                      <p className="text-sm text-slate-500">Downstream nodes affected by the selected failure.</p>
                    </div>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                      {result.impactedDevices.length} total
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <MetricCard label="SLBN" value={impactedByType.SLBN} hint="Impacted SLBN nodes" className="border-sky-100 bg-sky-50" />
                    <MetricCard label="CEAN" value={impactedByType.CEAN} hint="Impacted CEAN nodes" className="border-violet-100 bg-violet-50" />
                    <MetricCard label="MSAN" value={impactedByType.MSAN} hint="Impacted MSAN nodes" className="border-teal-100 bg-teal-50" />
                    <MetricCard label="Customer" value={impactedByType.Customer} hint="Impacted customer nodes" className="border-orange-100 bg-orange-50" />
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold text-slate-950">Impacted Devices</h2>
                    <p className="text-sm text-slate-500">The API returns all downstream devices that are currently affected.</p>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500">
                        <tr>
                          <th className="px-4 py-3 font-medium">Device</th>
                          <th className="px-4 py-3 font-medium">Type</th>
                          <th className="px-4 py-3 font-medium">Status</th>
                          <th className="px-4 py-3 font-medium">Impact</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                        {result.impactedDevices.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                              No impacted devices found.
                            </td>
                          </tr>
                        ) : (
                          result.impactedDevices.map((device) => (
                            <tr key={device.deviceId}>
                              <td className="px-4 py-3">
                                <div className="font-medium text-slate-950">{device.deviceName ?? `Device ${device.deviceId}`}</div>
                                <div className="text-xs text-slate-400">ID {device.deviceId}</div>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`${getTypeBadgeClass(device.deviceType)} rounded px-2 py-1 text-xs font-semibold`}>
                                  {getDeviceTypeLabel(device.deviceType)}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`${getStatusBadgeClass(device.status)} rounded px-2 py-1 text-xs font-semibold`}>
                                  {normalizeStatus(device.status)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-500">{device.impactType ?? '-'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}