using INMS.Application.Interfaces;
using INMS.Domain.Entities;
using INMS.Domain.Enums;
using INMS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace INMS.Application.Services;

/// <summary>
/// Enhanced Impact Analysis Service that handles:
/// 1. Root cause detection by traversing upward through parent hierarchy
/// 2. Multiple parent failure scenarios
/// 3. Downstream impact propagation
/// 4. Proper alarm type management
/// </summary>
public class EnhancedImpactAnalysisService : IImpactAnalysisService
{
    private readonly AppDbContext _context;
    private readonly ISimulationEventService _simulationEventService;

    // Alarm type constants
    private const string NodeDownAlarmType = "NODE_DOWN";
    private const string NodeUnreachableAlarmType = "NODE_UNREACHABLE";
    private const string PowerFailureAlarmType = "POWER_FAILURE";
    
    // Root cause type constants
    private const string RootCauseNodeFailureType = "NODE_FAILURE";
    private const string RootCausePowerFailureType = "POWER_FAILURE";
    
    // Impact type constants
    private const string ImpactTypeDownstream = "DOWNSTREAM";
    private const string ImpactTypeUpstream = "UPSTREAM";

    public EnhancedImpactAnalysisService(AppDbContext context, ISimulationEventService simulationEventService)
    {
        _context = context;
        _simulationEventService = simulationEventService;
    }

    /// <summary>
    /// Analyzes impact for any device regardless of its current status.
    /// Finds root cause by traversing upward and identifies all affected downstream devices.
    /// </summary>
    public async Task<ImpactAnalysisResult> AnalyzeDeviceImpactAsync(int deviceId)
    {
        var device = await _context.Devices
            .Include(d => d.LEA)
            .ThenInclude(lea => lea!.Province)
            .ThenInclude(p => p!.Region)
            .FirstOrDefaultAsync(d => d.DeviceId == deviceId);

        if (device == null)
        {
            throw new ArgumentException($"Device with ID {deviceId} not found.");
        }

        // Get all device links for topology analysis
        var allLinks = await _context.DeviceLinks
            .Include(dl => dl.ParentDevice)
            .Include(dl => dl.ChildDevice)
            .ToListAsync();

        // Find root cause(s) by traversing upward
        var rootCauses = await FindRootCausesAsync(deviceId, allLinks);
        
        // If no root cause found and device is not UP, it might be the root cause itself
        if (!rootCauses.Any() && device.Status != DeviceStatus.UP)
        {
            var rootCause = await EnsureRootCauseForDeviceAsync(deviceId, device.Status);
            if (rootCause != null)
            {
                rootCauses.Add(rootCause);
            }
        }

        // Find all affected downstream devices for each root cause
        var allAffectedDevices = new List<AffectedDeviceInfo>();
        
        foreach (var rootCause in rootCauses)
        {
            var downstreamDevices = await GetDownstreamAffectedDevicesAsync(rootCause.RootCauseDeviceId, allLinks);
            allAffectedDevices.AddRange(downstreamDevices);
        }

        // Remove duplicates and sort by device ID
        var uniqueAffectedDevices = allAffectedDevices
            .GroupBy(d => d.DeviceId)
            .Select(g => g.First())
            .OrderBy(d => d.DeviceId)
            .ToList();

        return new ImpactAnalysisResult
        {
            AnalyzedDevice = MapToDeviceInfo(device),
            RootCauses = (await Task.WhenAll(rootCauses.Select(MapToRootCauseInfo))).ToList(),
            AffectedDevices = uniqueAffectedDevices,
            AnalysisTimestamp = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Triggers failure analysis for a device (marks as DOWN and propagates impact)
    /// </summary>
    public async Task AnalyzeFailureAsync(int deviceId)
    {
        // Set device status to DOWN
        var device = await _context.Devices.FirstOrDefaultAsync(d => d.DeviceId == deviceId);
        if (device == null) return;

        device.Status = DeviceStatus.DOWN;
        
        // Create root cause and propagate impact
        var rootCause = await EnsureRootCauseForDeviceAsync(deviceId, DeviceStatus.DOWN);
        if (rootCause != null)
        {
            await PropagateImpactDownstreamAsync(rootCause.RootCauseId, deviceId);
        }

        await _context.SaveChangesAsync();
    }

    /// <summary>
    /// Clears impact analysis for a device (marks as UP and clears downstream impact)
    /// </summary>
    public async Task ClearImpactAsync(int deviceId)
    {
        // Set device status to UP
        var device = await _context.Devices.FirstOrDefaultAsync(d => d.DeviceId == deviceId);
        if (device == null) return;

        device.Status = DeviceStatus.UP;

        // Clear root causes and impact records
        await ClearRootCauseAsync(deviceId);
        
        // Clear alarms
        await ClearAlarmsAsync(deviceId);

        await _context.SaveChangesAsync();
    }

    /// <summary>
    /// Finds all root causes by traversing upward through the device hierarchy
    /// </summary>
    private async Task<List<RootCause>> FindRootCausesAsync(int deviceId, List<DeviceLink> allLinks)
    {
        var rootCauses = new List<RootCause>();
        var visited = new HashSet<int>();
        var queue = new Queue<int>();
        
        queue.Enqueue(deviceId);
        visited.Add(deviceId);

        while (queue.Count > 0)
        {
            var currentDeviceId = queue.Dequeue();
            
            // Check if current device has an active root cause
            var existingRootCause = await _context.RootCauses
                .Where(rc => rc.RootCauseDeviceId == currentDeviceId)
                .OrderByDescending(rc => rc.DetectedTime)
                .FirstOrDefaultAsync();

            if (existingRootCause != null)
            {
                rootCauses.Add(existingRootCause);
                continue; // Don't traverse further up from a known root cause
            }

            // Get parent devices
            var parentLinks = allLinks.Where(link => link.ChildDeviceId == currentDeviceId).ToList();
            
            if (!parentLinks.Any())
            {
                // No parents - if device is not UP, it could be a root cause
                var device = await _context.Devices.FirstOrDefaultAsync(d => d.DeviceId == currentDeviceId);
                if (device != null && device.Status != DeviceStatus.UP)
                {
                    var rootCause = await EnsureRootCauseForDeviceAsync(currentDeviceId, device.Status);
                    if (rootCause != null)
                    {
                        rootCauses.Add(rootCause);
                    }
                }
                continue;
            }

            // Check parent devices
            bool hasFailedParent = false;
            foreach (var parentLink in parentLinks)
            {
                if (visited.Contains(parentLink.ParentDeviceId)) continue;

                var parentDevice = parentLink.ParentDevice;
                if (parentDevice != null && parentDevice.Status != DeviceStatus.UP)
                {
                    hasFailedParent = true;
                    queue.Enqueue(parentLink.ParentDeviceId);
                    visited.Add(parentLink.ParentDeviceId);
                }
            }

            // If no failed parents but device is not UP, it might be a root cause
            if (!hasFailedParent)
            {
                var device = await _context.Devices.FirstOrDefaultAsync(d => d.DeviceId == currentDeviceId);
                if (device != null && device.Status != DeviceStatus.UP)
                {
                    var rootCause = await EnsureRootCauseForDeviceAsync(currentDeviceId, device.Status);
                    if (rootCause != null)
                    {
                        rootCauses.Add(rootCause);
                    }
                }
            }
        }

        return rootCauses.Distinct().ToList();
    }

    /// <summary>
    /// Gets all downstream devices affected by a root cause
    /// </summary>
    private async Task<List<AffectedDeviceInfo>> GetDownstreamAffectedDevicesAsync(int rootDeviceId, List<DeviceLink> allLinks)
    {
        var affectedDevices = new List<AffectedDeviceInfo>();
        var visited = new HashSet<int> { rootDeviceId };
        var queue = new Queue<int>();
        
        queue.Enqueue(rootDeviceId);

        while (queue.Count > 0)
        {
            var currentDeviceId = queue.Dequeue();
            
            // Get child devices
            var childLinks = allLinks.Where(link => link.ParentDeviceId == currentDeviceId).ToList();
            
            foreach (var childLink in childLinks)
            {
                if (visited.Contains(childLink.ChildDeviceId)) continue;
                
                visited.Add(childLink.ChildDeviceId);
                queue.Enqueue(childLink.ChildDeviceId);
                
                // Get device details
                var childDevice = await _context.Devices
                    .Include(d => d.LEA)
                    .ThenInclude(lea => lea!.Province)
                    .ThenInclude(p => p!.Region)
                    .FirstOrDefaultAsync(d => d.DeviceId == childLink.ChildDeviceId);

                if (childDevice != null)
                {
                    affectedDevices.Add(new AffectedDeviceInfo
                    {
                        DeviceId = childDevice.DeviceId,
                        DeviceName = childDevice.DeviceName,
                        DeviceType = childDevice.DeviceType.ToString(),
                        Status = childDevice.Status.ToString(),
                        IP = childDevice.IP,
                        Latitude = (double?)childDevice.Latitude,
                        Longitude = (double?)childDevice.Longitude,
                        LEA = childDevice.LEA?.Name,
                        Province = childDevice.LEA?.Province?.Name,
                        Region = childDevice.LEA?.Province?.Region?.Name,
                        ImpactType = ImpactTypeDownstream
                    });
                }
            }
        }

        return affectedDevices;
    }

    /// <summary>
    /// Creates or retrieves a root cause for a device based on its status
    /// </summary>
    private async Task<RootCause?> EnsureRootCauseForDeviceAsync(int deviceId, DeviceStatus status)
    {
        // Determine alarm type based on device status
        string alarmType = status switch
        {
            DeviceStatus.DOWN => NodeDownAlarmType,
            DeviceStatus.UNREACHABLE => NodeUnreachableAlarmType,
            DeviceStatus.IMPACTED => NodeUnreachableAlarmType,
            _ => NodeDownAlarmType
        };

        string rootCauseType = status switch
        {
            DeviceStatus.DOWN => RootCauseNodeFailureType,
            _ => RootCauseNodeFailureType
        };

        // Create or get existing alarm
        var alarm = await _context.Alarms
            .Where(a => a.DeviceId == deviceId && a.IsActive && a.AlarmType == alarmType)
            .OrderByDescending(a => a.RaisedTime)
            .FirstOrDefaultAsync();

        if (alarm == null)
        {
            alarm = new Alarm
            {
                DeviceId = deviceId,
                AlarmType = alarmType,
                RaisedTime = DateTime.UtcNow,
                IsActive = true
            };
            
            await _context.Alarms.AddAsync(alarm);
            await _context.SaveChangesAsync();
        }

        // Create or get existing root cause
        var rootCause = await _context.RootCauses
            .Where(rc => rc.RootCauseDeviceId == deviceId)
            .OrderByDescending(rc => rc.DetectedTime)
            .FirstOrDefaultAsync();

        if (rootCause == null)
        {
            rootCause = new RootCause
            {
                AlarmId = alarm.AlarmId,
                RootCauseDeviceId = deviceId,
                RootCauseType = rootCauseType,
                DetectedTime = DateTime.UtcNow
            };
            
            await _context.RootCauses.AddAsync(rootCause);
            await _context.SaveChangesAsync();
        }

        return rootCause;
    }

    /// <summary>
    /// Propagates impact to all downstream devices
    /// </summary>
    private async Task PropagateImpactDownstreamAsync(int rootCauseId, int rootDeviceId)
    {
        var allLinks = await _context.DeviceLinks.ToListAsync();
        var downstreamDeviceIds = GetDownstreamDeviceIds(rootDeviceId, allLinks);

        // Clear existing impact records for this root cause
        var existingImpacts = await _context.ImpactedDevices
            .Where(i => i.RootCauseId == rootCauseId)
            .ToListAsync();
        
        _context.ImpactedDevices.RemoveRange(existingImpacts);

        // Create new impact records
        var impactRecords = downstreamDeviceIds.Select(deviceId => new ImpactedDevice
        {
            RootCauseId = rootCauseId,
            DeviceId = deviceId,
            ImpactType = ImpactTypeDownstream
        }).ToList();

        await _context.ImpactedDevices.AddRangeAsync(impactRecords);

        // Update device statuses
        var devicesToUpdate = await _context.Devices
            .Where(d => downstreamDeviceIds.Contains(d.DeviceId))
            .ToListAsync();

        foreach (var device in devicesToUpdate)
        {
            device.Status = DeviceStatus.UNREACHABLE;
        }
    }

    /// <summary>
    /// Helper method to get downstream device IDs using BFS
    /// </summary>
    private static HashSet<int> GetDownstreamDeviceIds(int rootDeviceId, List<DeviceLink> links)
    {
        var adjacency = new Dictionary<int, List<int>>();
        
        foreach (var link in links)
        {
            if (!adjacency.ContainsKey(link.ParentDeviceId))
                adjacency[link.ParentDeviceId] = new List<int>();
            
            adjacency[link.ParentDeviceId].Add(link.ChildDeviceId);
        }

        var visited = new HashSet<int> { rootDeviceId };
        var impacted = new HashSet<int>();
        var queue = new Queue<int>();
        
        queue.Enqueue(rootDeviceId);

        while (queue.Count > 0)
        {
            var current = queue.Dequeue();
            
            if (adjacency.TryGetValue(current, out var children))
            {
                foreach (var childId in children)
                {
                    if (visited.Add(childId))
                    {
                        impacted.Add(childId);
                        queue.Enqueue(childId);
                    }
                }
            }
        }

        return impacted;
    }

    /// <summary>
    /// Clears root cause records for a device
    /// </summary>
    public async Task ClearRootCauseAsync(int deviceId)
    {
        var rootCauses = await _context.RootCauses
            .Where(rc => rc.RootCauseDeviceId == deviceId)
            .ToListAsync();

        if (rootCauses.Any())
        {
            var rootCauseIds = rootCauses.Select(rc => rc.RootCauseId).ToList();
            
            // Remove impact records
            var impactRecords = await _context.ImpactedDevices
                .Where(i => rootCauseIds.Contains(i.RootCauseId))
                .ToListAsync();
            
            _context.ImpactedDevices.RemoveRange(impactRecords);
            _context.RootCauses.RemoveRange(rootCauses);
        }
    }

    /// <summary>
    /// Clears all active alarms for a device
    /// </summary>
    public async Task ClearAlarmsAsync(int deviceId)
    {
        var activeAlarms = await _context.Alarms
            .Where(a => a.DeviceId == deviceId && a.IsActive)
            .ToListAsync();

        foreach (var alarm in activeAlarms)
        {
            alarm.IsActive = false;
            alarm.ClearedTime = DateTime.UtcNow;
        }
    }

    // Mapping methods
    private static DeviceInfo MapToDeviceInfo(Device device)
    {
        return new DeviceInfo
        {
            DeviceId = device.DeviceId,
            DeviceName = device.DeviceName,
            DeviceType = device.DeviceType.ToString(),
            Status = device.Status.ToString(),
            IP = device.IP,
            Latitude = (double?)device.Latitude,
            Longitude = (double?)device.Longitude,
            LEA = device.LEA?.Name,
            Province = device.LEA?.Province?.Name,
            Region = device.LEA?.Province?.Region?.Name
        };
    }

    private async Task<RootCauseInfo> MapToRootCauseInfo(RootCause rootCause)
    {
        var rootDevice = await _context.Devices
            .Include(d => d.LEA)
            .ThenInclude(lea => lea!.Province)
            .ThenInclude(p => p!.Region)
            .FirstOrDefaultAsync(d => d.DeviceId == rootCause.RootCauseDeviceId);

        var alarm = await _context.Alarms
            .FirstOrDefaultAsync(a => a.AlarmId == rootCause.AlarmId);

        return new RootCauseInfo
        {
            RootCauseId = rootCause.RootCauseId,
            RootCauseDeviceId = rootCause.RootCauseDeviceId,
            RootCauseType = rootCause.RootCauseType,
            DetectedTime = rootCause.DetectedTime,
            AlarmType = alarm?.AlarmType ?? "UNKNOWN",
            RootDevice = rootDevice != null ? MapToDeviceInfo(rootDevice) : null
        };
    }

    // Not implemented in this enhanced version - keeping for interface compatibility
    public async Task EnsureUnreachableAlarmAsync(int deviceId)
    {
        await EnsureRootCauseForDeviceAsync(deviceId, DeviceStatus.UNREACHABLE);
    }
}

// DTOs for the enhanced service
public class ImpactAnalysisResult
{
    public DeviceInfo AnalyzedDevice { get; set; } = null!;
    public List<RootCauseInfo> RootCauses { get; set; } = new();
    public List<AffectedDeviceInfo> AffectedDevices { get; set; } = new();
    public DateTime AnalysisTimestamp { get; set; }
}

public class DeviceInfo
{
    public int DeviceId { get; set; }
    public string DeviceName { get; set; } = string.Empty;
    public string DeviceType { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? IP { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public string? LEA { get; set; }
    public string? Province { get; set; }
    public string? Region { get; set; }
}

public class RootCauseInfo
{
    public int RootCauseId { get; set; }
    public int RootCauseDeviceId { get; set; }
    public string RootCauseType { get; set; } = string.Empty;
    public DateTime DetectedTime { get; set; }
    public string AlarmType { get; set; } = string.Empty;
    public DeviceInfo? RootDevice { get; set; }
}

public class AffectedDeviceInfo : DeviceInfo
{
    public string ImpactType { get; set; } = string.Empty;
}