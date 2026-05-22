using INMS.Application.Interfaces;
using INMS.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace INMS.API.BackgroundServices;

/// <summary>
/// Background service that detects device failures by monitoring heartbeat timeouts.
/// When a failure is detected, it triggers impact analysis through IImpactAnalysisService.
/// 
/// Responsibility: Monitor heartbeats and detect failures (SRP)
/// Delegates: Impact analysis operations to IImpactAnalysisService
/// </summary>
public class HeartbeatFailureDetectionService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<HeartbeatFailureDetectionService> _logger;
    private const int CheckIntervalSeconds = 30; // Reduced frequency
    private const int FailureTimeoutSeconds = 60; // Increased timeout

    public HeartbeatFailureDetectionService(
        IServiceProvider serviceProvider,
        ILogger<HeartbeatFailureDetectionService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Heartbeat Failure Detection Service started");

        await Task.Delay(TimeSpan.FromSeconds(45), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await DetectFailures();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during failure detection");
            }

            await Task.Delay(TimeSpan.FromSeconds(CheckIntervalSeconds), stoppingToken);
        }
    }

        private async Task DetectFailures()
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<INMS.Infrastructure.Persistence.AppDbContext>();
        var simulationEventService = scope.ServiceProvider.GetRequiredService<ISimulationEventService>();
        var impactAnalysisService = scope.ServiceProvider.GetRequiredService<IImpactAnalysisService>();
        var currentTime = DateTime.UtcNow;

        // Get devices for status updates (need full entities)
        var devices = await context.Devices.ToListAsync();

        var deviceLinks = await context.DeviceLinks
            .AsNoTracking()
            .ToListAsync();

        var deviceIds = devices.Select(d => d.DeviceId).ToList();
        
        // Optimize: Get latest heartbeat per device with a simpler query
        var latestHeartbeats = new Dictionary<int, Domain.Entities.Heartbeat>();
        
        foreach (var deviceId in deviceIds)
        {
            var latestHeartbeat = await context.Heartbeats
                .Where(h => h.DeviceId == deviceId)
                .OrderByDescending(h => h.Timestamp)
                .FirstOrDefaultAsync();
                
            if (latestHeartbeat != null)
            {
                latestHeartbeats[deviceId] = latestHeartbeat;
            }
        }

        var parentIdsByChild = deviceLinks
            .GroupBy(dl => dl.ChildDeviceId)
            .ToDictionary(g => g.Key, g => g.Select(x => x.ParentDeviceId).Distinct().ToList());

        // Calculate base status based on heartbeat presence and timeout
        var baseStatusByDevice = new Dictionary<int, DeviceStatus>(devices.Count);
        foreach (var device in devices)
        {
            // IsSimulatedDown doesn't directly set DOWN - instead it causes scheduler to skip heartbeats.
            // The detector marks DOWN when heartbeats are missing for longer than the timeout.
            latestHeartbeats.TryGetValue(device.DeviceId, out var lastHeartbeat);

            if (lastHeartbeat == null)
            {
                baseStatusByDevice[device.DeviceId] = DeviceStatus.DOWN;
                continue;
            }

            var timeSinceLast = (currentTime - lastHeartbeat.Timestamp).TotalSeconds;
            baseStatusByDevice[device.DeviceId] = timeSinceLast > FailureTimeoutSeconds
                ? DeviceStatus.DOWN
                : DeviceStatus.UP;
        }

        // Propagate cascading status changes based on topology
        var computedStatusByDevice = new Dictionary<int, DeviceStatus>(baseStatusByDevice);
        bool hasChanges;

        do
        {
            hasChanges = false;

            foreach (var device in devices)
            {
                var currentStatus = computedStatusByDevice[device.DeviceId];
                
                // Devices already DOWN don't change status
                if (currentStatus == DeviceStatus.DOWN)
                {
                    continue;
                }

                // Root devices (no parents) follow their base status
                if (!parentIdsByChild.TryGetValue(device.DeviceId, out var parentIds) || parentIds.Count == 0)
                {
                    var desiredRootStatus = baseStatusByDevice[device.DeviceId];
                    if (currentStatus != desiredRootStatus)
                    {
                        computedStatusByDevice[device.DeviceId] = desiredRootStatus;
                        hasChanges = true;
                    }
                    continue;
                }

                // Dependent devices become UNREACHABLE if all parents are unavailable
                bool allParentsUnavailable = parentIds.All(parentId =>
                    computedStatusByDevice.TryGetValue(parentId, out var parentStatus) &&
                    (parentStatus == DeviceStatus.DOWN || parentStatus == DeviceStatus.UNREACHABLE));

                var desiredStatus = allParentsUnavailable
                    ? DeviceStatus.UNREACHABLE
                    : DeviceStatus.UP;

                if (currentStatus != desiredStatus)
                {
                    computedStatusByDevice[device.DeviceId] = desiredStatus;
                    hasChanges = true;
                }
            }
        } while (hasChanges);

        // Apply status changes and trigger appropriate impact analysis operations
        foreach (var device in devices)
        {
            var oldStatus = device.Status;
            var resolvedStatus = computedStatusByDevice[device.DeviceId];

            // No change - skip
            if (oldStatus == resolvedStatus)
            {
                continue;
            }

            device.Status = resolvedStatus;

            // Handle simulated down state
            if (device.IsSimulatedDown && resolvedStatus == DeviceStatus.DOWN && oldStatus != DeviceStatus.DOWN)
            {
                await simulationEventService.LogEventAsync(device.DeviceId, "SIMULATED_DOWN");
                _logger.LogWarning($"Device {device.DeviceId} forced DOWN because IsSimulatedDown=true");
            }

            // Device transitioned to DOWN - analyze failure impact
            if (resolvedStatus == DeviceStatus.DOWN && oldStatus != DeviceStatus.DOWN)
            {
                await simulationEventService.LogEventAsync(device.DeviceId, "HEARTBEAT_TIMEOUT");
                _logger.LogWarning($"Device {device.DeviceId} marked OFFLINE due to heartbeat timeout");

                // Trigger impact analysis to identify root cause and propagate to downstream devices
                await impactAnalysisService.AnalyzeFailureAsync(device.DeviceId);
            }
            // Device recovered to UP - clear all related alarms
            else if (resolvedStatus == DeviceStatus.UP && oldStatus != DeviceStatus.UP)
            {
                await simulationEventService.LogEventAsync(device.DeviceId, "HEARTBEAT_RECOVERED");
                _logger.LogInformation($"Device {device.DeviceId} recovered and marked ONLINE");
                
                // Clear all active alarms for this device and its downstream devices
                await impactAnalysisService.ClearAlarmsAsync(device.DeviceId);
            }
            // Device became UNREACHABLE due to upstream failure - create unreachable alarm
            else if (resolvedStatus == DeviceStatus.UNREACHABLE && oldStatus != DeviceStatus.UNREACHABLE)
            {
                _logger.LogInformation($"Device {device.DeviceId} marked UNREACHABLE due to upstream dependency");

                // Create unreachable alarm and link to upstream root cause if available
                await impactAnalysisService.EnsureUnreachableAlarmAsync(device.DeviceId);
            }
        }

        await context.SaveChangesAsync();
    }
}
