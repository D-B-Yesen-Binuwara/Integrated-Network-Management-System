using INMS.Application.Interfaces;
using INMS.Application.Services;
using INMS.Domain.Entities;
using INMS.Domain.Enums;
using INMS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace INMS.Application.Services;

/// Service responsible for impact analysis and failure propagation.
/// 1. Detects root cause failures (devices with no upstream parents failing)
/// 2. Propagates failures to downstream dependent devices (mark as UNREACHABLE)
/// 3. Creates alarms for root causes (NODE_DOWN) and impacted devices (NODE_UNREACHABLE)
/// 4. Maintains ImpactedDevice records for UI visualization
/// 5. Clears alarms and impact records when devices recover
public class ImpactAnalysisService : IImpactAnalysisService
{
    private readonly AppDbContext _context;
    private readonly ISimulationEventService _simulationEventService;

    // Alarm type constants for consistency
    private const string NodeDownAlarmType = "NODE_DOWN";
    private const string NodeUnreachableAlarmType = "NODE_UNREACHABLE";

    // Root cause type constants
    private const string RootCauseNodeFailureType = "NODE_FAILURE";

    // Impact type constants for ImpactedDevice records
    private const string ImpactTypeDownstream = "DOWNSTREAM";

    public ImpactAnalysisService(AppDbContext context, ISimulationEventService simulationEventService)
    {
        _context = context;
        _simulationEventService = simulationEventService;
    }

    public async Task AnalyzeFailureAsync(int deviceId)
    {
        // Retrieve the device and verify it's in DOWN state
        var device = await _context.Devices
            .FirstOrDefaultAsync(d => d.DeviceId == deviceId);

        if (device == null || device.Status != DeviceStatus.DOWN)
        {
            return;
        }

        // Fetch all device links to determine topology
        var links = await _context.DeviceLinks
            .Include(dl => dl.ParentDevice)
            .ToListAsync();

        // Identify parent links to determine if this is a root failure
        var parentLinks = links
            .Where(link => link.ChildDeviceId == deviceId)
            .ToList();

        // Check if any parent is down or impacted (cascading failure)
        var hasDownOrUnreachableParent = parentLinks.Any(link =>
            link.ParentDevice == null ||
            link.ParentDevice.Status == DeviceStatus.DOWN ||
            link.ParentDevice.Status == DeviceStatus.IMPACTED);

        // Root failure = no parents OR all parents are healthy
        var isRootFailure = parentLinks.Count == 0 || !hasDownOrUnreachableParent;

        if (!isRootFailure)
        {
            // This is a dependent failure (not a root cause)
            await ClearRootCauseAsync(deviceId);
            device.Status = DeviceStatus.IMPACTED;
            await _context.SaveChangesAsync();
            return;
        }

        // This is a root failure - create root cause and propagate impact
        var rootCauseId = await EnsureRootCauseAsync(deviceId);
        var impactedDeviceIds = GetDownstreamDeviceIds(deviceId, links);

        // Rebuild impact records to ensure data consistency
        await RebuildImpactedDevicesForRootCauseAsync(rootCauseId, deviceId, links);

        // Mark downstream devices as UNREACHABLE (but not the root itself which is DOWN)
        if (impactedDeviceIds.Count > 0)
        {
            var impactedDevices = await _context.Devices
                .Where(d => impactedDeviceIds.Contains(d.DeviceId) && d.Status != DeviceStatus.DOWN)
                .ToListAsync();

            foreach (var impactedDevice in impactedDevices)
            {
                impactedDevice.Status = DeviceStatus.UNREACHABLE;
            }
        }

        await _context.SaveChangesAsync();
    }

    public async Task ClearImpactAsync(int deviceId)
    {
        // Clear root cause records and get list of potentially impacted devices
        var impactedDeviceIds = await ClearRootCauseInternalAsync(deviceId);

        // Persist removals to database
        await _context.SaveChangesAsync();

        if (impactedDeviceIds.Count > 0)
        {
            // Check which of the previously impacted devices are still impacted by other root causes
            var stillImpactedDeviceIds = await _context.ImpactedDevices
                .Where(id => impactedDeviceIds.Contains(id.DeviceId))
                .Select(id => id.DeviceId)
                .Distinct()
                .ToListAsync();

            // Devices that are no longer impacted by any root cause can recover to UP
            var recoveredDeviceIds = impactedDeviceIds
                .Where(id => !stillImpactedDeviceIds.Contains(id))
                .ToHashSet();

            if (recoveredDeviceIds.Count > 0)
            {
                var recoveredDevices = await _context.Devices
                    .Where(d => recoveredDeviceIds.Contains(d.DeviceId) && d.Status == DeviceStatus.UNREACHABLE)
                    .ToListAsync();

                foreach (var recoveredDevice in recoveredDevices)
                {
                    recoveredDevice.Status = DeviceStatus.UP;
                }
            }
        }

        await _context.SaveChangesAsync();
    }

    public async Task ClearRootCauseAsync(int deviceId)
    {
        await ClearRootCauseInternalAsync(deviceId);
        await _context.SaveChangesAsync();
    }

    /// Creates or retrieves an UNREACHABLE alarm for a device that lost upstream connectivity.
    /// Links the device to the upstream root cause if one exists, otherwise just creates the alarm.
    public async Task EnsureUnreachableAlarmAsync(int deviceId)
    {
        // Create UNREACHABLE alarm if it doesn't exist
        var activeAlarm = await _context.Alarms
            .Where(a => a.DeviceId == deviceId && a.IsActive && a.AlarmType == NodeUnreachableAlarmType)
            .OrderByDescending(a => a.RaisedTime)
            .FirstOrDefaultAsync();

        if (activeAlarm == null)
        {
            activeAlarm = new Alarm
            {
                DeviceId = deviceId,
                AlarmType = NodeUnreachableAlarmType,
                RaisedTime = DateTime.UtcNow,
                IsActive = true
            };

            await _context.Alarms.AddAsync(activeAlarm);
            await _context.SaveChangesAsync();

            await _simulationEventService.LogAlarmEventAsync(
                deviceId, "ALARM_RAISED", activeAlarm.AlarmId, activeAlarm.RaisedTime);
        }

        // Find and link to upstream root cause (BFS upward through parents)
        var allLinks = await _context.DeviceLinks.AsNoTracking().ToListAsync();
        RootCause? foundRootCause = await FindUpstreamRootCause(deviceId, allLinks);

        if (foundRootCause != null)
        {
            // Link this unreachable device to the upstream root cause
            var rootCauseId = foundRootCause.RootCauseId;

            // Rebuild impacted devices for this root cause
            await RebuildImpactedDevicesForRootCauseAsync(rootCauseId, foundRootCause.RootCauseDeviceId, allLinks);
        }

        await _context.SaveChangesAsync();
    }

    /// Clears all active alarms for a device when it recovers to UP status.
    /// Also clears alarms for downstream devices that are no longer impacted.
    public async Task ClearAlarmsAsync(int deviceId)
    {
        var now = DateTime.UtcNow;

        // Clear all active alarms for this device
        var deviceAlarms = await _context.Alarms
            .Where(a => a.DeviceId == deviceId && a.IsActive)
            .ToListAsync();

        if (deviceAlarms.Count > 0)
        {
            foreach (var alarm in deviceAlarms)
            {
                alarm.IsActive = false;
                alarm.ClearedTime = now;
            }

            await _context.SaveChangesAsync();

            foreach (var alarm in deviceAlarms)
            {
                await _simulationEventService.LogAlarmEventAsync(
                    alarm.DeviceId, "ALARM_CLEARED", alarm.AlarmId, alarm.ClearedTime!.Value);
            }
        }

        // Clear alarms for downstream devices no longer impacted
        var rootCauseIds = await _context.RootCauses
            .Where(rc => rc.RootCauseDeviceId == deviceId)
            .Select(rc => rc.RootCauseId)
            .ToListAsync();

        if (rootCauseIds.Count > 0)
        {
            var impactedDeviceIds = await _context.ImpactedDevices
                .Where(i => rootCauseIds.Contains(i.RootCauseId))
                .Select(i => i.DeviceId)
                .Distinct()
                .ToListAsync();

            if (impactedDeviceIds.Count > 0)
            {
                var impactedAlarms = await _context.Alarms
                    .Where(a => impactedDeviceIds.Contains(a.DeviceId) && a.IsActive)
                    .ToListAsync();

                foreach (var alarm in impactedAlarms)
                {
                    alarm.IsActive = false;
                    alarm.ClearedTime = now;
                }

                await _context.SaveChangesAsync();

                foreach (var alarm in impactedAlarms)
                {
                    await _simulationEventService.LogAlarmEventAsync(
                        alarm.DeviceId, "ALARM_CLEARED", alarm.AlarmId, alarm.ClearedTime!.Value);
                }
            }
        }

        await _context.SaveChangesAsync();
    }

    /// Finds the root cause of a failure by traversing upstream through parent device links.
    /// Uses BFS to find the nearest upstream parent with an active NODE_DOWN alarm.
    private async Task<RootCause?> FindUpstreamRootCause(int deviceId, IEnumerable<DeviceLink> allLinks)
    {
        // Build parent adjacency: child -> list of parents
        var parentAdjacency = new Dictionary<int, List<int>>();
        foreach (var link in allLinks)
        {
            if (!parentAdjacency.TryGetValue(link.ChildDeviceId, out var parents))
            {
                parents = new List<int>();
                parentAdjacency[link.ChildDeviceId] = parents;
            }

            parents.Add(link.ParentDeviceId);
        }

        // BFS upward from this device to find nearest ancestor with active NODE_DOWN alarm
        RootCause? foundRootCause = null;
        var visited = new HashSet<int> { deviceId };
        var queue = new Queue<int>();
        queue.Enqueue(deviceId);

        while (queue.Count > 0 && foundRootCause == null)
        {
            var current = queue.Dequeue();

            if (!parentAdjacency.TryGetValue(current, out var parents))
            {
                continue;
            }

            foreach (var parentId in parents)
            {
                if (!visited.Add(parentId)) continue;

                // Check if parent has active NODE_DOWN alarm
                var parentDownAlarm = await _context.Alarms
                    .Where(a => a.DeviceId == parentId && a.IsActive && a.AlarmType == NodeDownAlarmType)
                    .OrderByDescending(a => a.RaisedTime)
                    .FirstOrDefaultAsync();

                if (parentDownAlarm != null)
                {
                    foundRootCause = await _context.RootCauses
                        .Where(rc => rc.AlarmId == parentDownAlarm.AlarmId)
                        .OrderByDescending(rc => rc.DetectedTime)
                        .FirstOrDefaultAsync();

                    if (foundRootCause != null)
                    {
                        break;
                    }
                }

                queue.Enqueue(parentId);
            }
        }

        return foundRootCause;
    }

    /// Rebuilds the ImpactedDevice records for a root cause to ensure all downstream devices are tracked.
    /// This keeps the impact analysis data fresh and consistent with the topology.
    private async Task RebuildImpactedDevicesForRootCauseAsync(
        int rootCauseId, int rootDeviceId, IEnumerable<DeviceLink> allLinks)
    {
        var impactedDeviceIds = GetDownstreamDeviceIds(rootDeviceId, allLinks);

        // Remove existing records to rebuild fresh
        var existingRows = await _context.ImpactedDevices
            .Where(x => x.RootCauseId == rootCauseId)
            .ToListAsync();

        if (existingRows.Count > 0)
        {
            _context.ImpactedDevices.RemoveRange(existingRows);
        }

        if (impactedDeviceIds.Count == 0)
        {
            return;
        }

        // Create fresh impact records for all downstream devices
        var impactedRows = impactedDeviceIds
            .Select(deviceId => new ImpactedDevice
            {
                RootCauseId = rootCauseId,
                DeviceId = deviceId,
                ImpactType = ImpactTypeDownstream
            })
            .ToList();

        await _context.ImpactedDevices.AddRangeAsync(impactedRows);
    }

    private async Task<HashSet<int>> ClearRootCauseInternalAsync(int deviceId)
    {
        var rootCauses = await _context.RootCauses
            .Where(rc => rc.RootCauseDeviceId == deviceId)
            .ToListAsync();

        if (rootCauses.Count == 0)
        {
            await ClearActiveNodeDownAlarmsAsync(deviceId);
            return new HashSet<int>();
        }

        var rootCauseIds = rootCauses
            .Select(rc => rc.RootCauseId)
            .ToHashSet();

        var impactedRows = await _context.ImpactedDevices
            .Where(id => rootCauseIds.Contains(id.RootCauseId))
            .ToListAsync();

        var impactedDeviceIds = impactedRows
            .Select(id => id.DeviceId)
            .ToHashSet();

        if (impactedRows.Count > 0)
        {
            _context.ImpactedDevices.RemoveRange(impactedRows);
        }

        _context.RootCauses.RemoveRange(rootCauses);

        await ClearActiveNodeDownAlarmsAsync(deviceId);
        return impactedDeviceIds;
    }

    private async Task ClearActiveNodeDownAlarmsAsync(int deviceId)
    {
        var activeNodeDownAlarms = await _context.Alarms
            .Where(a => a.DeviceId == deviceId && a.IsActive && a.AlarmType == NodeDownAlarmType)
            .ToListAsync();

        foreach (var alarm in activeNodeDownAlarms)
        {
            alarm.IsActive = false;
            alarm.ClearedTime = DateTime.UtcNow;
        }
    }

    private async Task<int> EnsureRootCauseAsync(int rootDeviceId)
    {
        // Retrieve or create the active NODE_DOWN alarm for this device
        var activeAlarm = await _context.Alarms
            .Where(a => a.DeviceId == rootDeviceId && a.IsActive && a.AlarmType == NodeDownAlarmType)
            .OrderByDescending(a => a.RaisedTime)
            .FirstOrDefaultAsync();

        if (activeAlarm == null)
        {
            // Create new alarm if none exists
            activeAlarm = new Alarm
            {
                DeviceId = rootDeviceId,
                AlarmType = NodeDownAlarmType,
                RaisedTime = DateTime.UtcNow,
                IsActive = true
            };

            await _context.Alarms.AddAsync(activeAlarm);
            await _context.SaveChangesAsync();

            await _simulationEventService.LogAlarmEventAsync(
                rootDeviceId, "ALARM_RAISED", activeAlarm.AlarmId, activeAlarm.RaisedTime);
        }

        // Retrieve or create the RootCause record for this alarm
        var rootCause = await _context.RootCauses
            .Where(rc => rc.AlarmId == activeAlarm.AlarmId)
            .OrderByDescending(rc => rc.DetectedTime)
            .FirstOrDefaultAsync();

        if (rootCause == null)
        {
            // Create new root cause record
            rootCause = new RootCause
            {
                AlarmId = activeAlarm.AlarmId,
                RootCauseDeviceId = rootDeviceId,
                RootCauseType = RootCauseNodeFailureType,
                DetectedTime = DateTime.UtcNow
            };

            await _context.RootCauses.AddAsync(rootCause);
            await _context.SaveChangesAsync();
        }

        return rootCause.RootCauseId;
    }

    /// Finds all downstream devices affected by a root failure using BFS traversal.
    private static HashSet<int> GetDownstreamDeviceIds(int rootDeviceId, IEnumerable<DeviceLink> links)
    {
        // Build child adjacency: parent -> list of children
        var adjacency = new Dictionary<int, List<int>>();

        foreach (var link in links)
        {
            if (!adjacency.TryGetValue(link.ParentDeviceId, out var children))
            {
                children = new List<int>();
                adjacency[link.ParentDeviceId] = children;
            }

            children.Add(link.ChildDeviceId);
        }

        // BFS traversal to find all reachable descendants
        var visited = new HashSet<int> { rootDeviceId };
        var impacted = new HashSet<int>();
        var queue = new Queue<int>();
        queue.Enqueue(rootDeviceId);

        while (queue.Count > 0)
        {
            var current = queue.Dequeue();

            if (!adjacency.TryGetValue(current, out var children))
            {
                continue;
            }

            foreach (var childId in children)
            {
                if (!visited.Add(childId))
                {
                    continue;
                }

                impacted.Add(childId);
                queue.Enqueue(childId);
            }
        }

        return impacted;
    }

    /// <summary>
    /// Placeholder implementation for the new enhanced method.
    /// This maintains interface compatibility while the enhanced service is being integrated.
    /// </summary>
    public async Task<ImpactAnalysisResult> AnalyzeDeviceImpactAsync(int deviceId)
    {
        // For now, return a basic result using existing logic
        var device = await _context.Devices
            .Include(d => d.LEA)
            .ThenInclude(lea => lea!.Province)
            .ThenInclude(p => p!.Region)
            .FirstOrDefaultAsync(d => d.DeviceId == deviceId);

        if (device == null)
        {
            throw new ArgumentException($"Device with ID {deviceId} not found.");
        }

        var rootCause = await _context.RootCauses
            .Where(rc => rc.RootCauseDeviceId == deviceId)
            .OrderByDescending(rc => rc.DetectedTime)
            .FirstOrDefaultAsync();

        var rootCauses = new List<RootCauseInfo>();
        var affectedDevices = new List<AffectedDeviceInfo>();

        if (rootCause != null)
        {
            var alarm = await _context.Alarms
                .FirstOrDefaultAsync(a => a.AlarmId == rootCause.AlarmId);

            rootCauses.Add(new RootCauseInfo
            {
                RootCauseId = rootCause.RootCauseId,
                RootCauseDeviceId = rootCause.RootCauseDeviceId,
                RootCauseType = rootCause.RootCauseType,
                DetectedTime = rootCause.DetectedTime,
                AlarmType = alarm?.AlarmType ?? "UNKNOWN",
                RootDevice = new DeviceInfo
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
                }
            });

            // Get affected devices
            var impactedRows = await (
                from impacted in _context.ImpactedDevices.AsNoTracking()
                join d in _context.Devices.AsNoTracking() on impacted.DeviceId equals d.DeviceId
                join lea in _context.LEAs.AsNoTracking() on d.LEAId equals lea.LEAId into leaJoin
                from lea in leaJoin.DefaultIfEmpty()
                join province in _context.Provinces.AsNoTracking() on lea.ProvinceId equals province.ProvinceId into provinceJoin
                from province in provinceJoin.DefaultIfEmpty()
                join region in _context.Regions.AsNoTracking() on province.RegionId equals region.RegionId into regionJoin
                from region in regionJoin.DefaultIfEmpty()
                where impacted.RootCauseId == rootCause.RootCauseId
                select new AffectedDeviceInfo
                {
                    DeviceId = d.DeviceId,
                    DeviceName = d.DeviceName,
                    DeviceType = d.DeviceType.ToString(),
                    Status = d.Status.ToString(),
                    IP = d.IP,
                    Latitude = (double?)d.Latitude,
                    Longitude = (double?)d.Longitude,
                    LEA = lea != null ? lea.Name : "",
                    Province = province != null ? province.Name : "",
                    Region = region != null ? region.Name : "",
                    ImpactType = impacted.ImpactType
                })
                .ToListAsync();

            affectedDevices.AddRange(impactedRows);
        }

        return new ImpactAnalysisResult
        {
            AnalyzedDevice = new DeviceInfo
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
            },
            RootCauses = rootCauses,
            AffectedDevices = affectedDevices,
            AnalysisTimestamp = DateTime.UtcNow
        };
    }
}
