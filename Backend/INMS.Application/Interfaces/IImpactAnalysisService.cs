using INMS.Application.Services;

namespace INMS.Application.Interfaces;

// Service for analyzing network failures and their impact on dependent devices.
// Handles root cause identification, impact propagation, and alarm management.
// Responsibility: Impact Analysis & Failure Propagation (SRP)
public interface IImpactAnalysisService
{
    // Analyzes a device failure and propagates impact to downstream devices.
    // Creates alarms, identifies root cause, and marks impacted devices as unreachable.
    Task AnalyzeFailureAsync(int deviceId);

    // Clears root cause records and associated impact when a device recovers.
    Task ClearRootCauseAsync(int deviceId);

    // Clears all impact-related records (alarms, root causes, impacted devices).
    // Called when a failed device recovers to UP status.
    Task ClearImpactAsync(int deviceId);

    // Creates or retrieves an UNREACHABLE alarm for a dependent device.
    // Finds the upstream root cause and links the unreachable device to it.
    Task EnsureUnreachableAlarmAsync(int deviceId);

    // Clears all active alarms for a device and its downstream impacted devices.
    // Called when a failed device recovers.
    Task ClearAlarmsAsync(int deviceId);

    // NEW: Analyzes impact for any device by finding root causes and affected devices
    // This is the main method for the enhanced impact analysis
    Task<ImpactAnalysisResult> AnalyzeDeviceImpactAsync(int deviceId);
}
