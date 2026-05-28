using INMS.Application.Interfaces;
using INMS.Domain.Entities;
using INMS.Domain.Enums;
using INMS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace INMS.Application.Services;

public class ImpactAnalysisService : IImpactAnalysisService
{
    private readonly AppDbContext _context;
    private const string NodeDownAlarmType = "NODE_DOWN";
    private const string RootCauseNodeFailureType = "NODE_FAILURE";
    private const string ImpactTypeDownstream = "DOWNSTREAM";

    public ImpactAnalysisService(AppDbContext context)
    {
        _context = context;
    }

    public async Task AnalyzeFailureAsync(int deviceId)
    {
        var device = await _context.Devices
            .FirstOrDefaultAsync(d => d.DeviceId == deviceId);

        if (device == null || device.Status != DeviceStatus.DOWN)
        {
            return;
        }

        var links = await _context.DeviceLinks
            .Include(dl => dl.ParentDevice)
            .ToListAsync();

        var parentLinks = links
            .Where(link => link.ChildDeviceId == deviceId)
            .ToList();

        var hasDownOrUnreachableParent = parentLinks.Any(link =>
            link.ParentDevice == null ||
            link.ParentDevice.Status == DeviceStatus.DOWN ||
            link.ParentDevice.Status == DeviceStatus.UNREACHABLE);

        var isRootFailure = parentLinks.Count == 0 || !hasDownOrUnreachableParent;

        if (!isRootFailure)
        {
            await ClearRootCauseAsync(deviceId);
            device.Status = DeviceStatus.UNREACHABLE;
            await _context.SaveChangesAsync();
            return;
        }

        var rootCauseId = await EnsureRootCauseAsync(deviceId);
        var impactedDeviceIds = GetDownstreamDeviceIds(deviceId, links);

        var existingRows = await _context.ImpactedDevices
            .Where(x => x.RootCauseId == rootCauseId)
            .ToListAsync();

        if (existingRows.Count > 0)
        {
            _context.ImpactedDevices.RemoveRange(existingRows);
        }

        if (impactedDeviceIds.Count > 0)
        {
            var impactedRows = impactedDeviceIds
                .Select(impactedDeviceId => new ImpactedDevice
                {
                    RootCauseId = rootCauseId,
                    DeviceId = impactedDeviceId,
                    ImpactType = ImpactTypeDownstream
                })
                .ToList();

            await _context.ImpactedDevices.AddRangeAsync(impactedRows);

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
        var impactedDeviceIds = await ClearRootCauseInternalAsync(deviceId);

        // Persist removals first, then re-check remaining impacts from database.
        await _context.SaveChangesAsync();

        if (impactedDeviceIds.Count > 0)
        {
            var stillImpactedDeviceIds = await _context.ImpactedDevices
                .Where(id => impactedDeviceIds.Contains(id.DeviceId))
                .Select(id => id.DeviceId)
                .Distinct()
                .ToListAsync();

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
        var activeAlarm = await _context.Alarms
            .Where(a => a.DeviceId == rootDeviceId && a.IsActive && a.AlarmType == NodeDownAlarmType)
            .OrderByDescending(a => a.RaisedTime)
            .FirstOrDefaultAsync();

        if (activeAlarm == null)
        {
            activeAlarm = new Alarm
            {
                DeviceId = rootDeviceId,
                AlarmType = NodeDownAlarmType,
                RaisedTime = DateTime.UtcNow,
                IsActive = true
            };

            await _context.Alarms.AddAsync(activeAlarm);
            await _context.SaveChangesAsync();
        }

        var rootCause = await _context.RootCauses
            .Where(rc => rc.AlarmId == activeAlarm.AlarmId)
            .OrderByDescending(rc => rc.DetectedTime)
            .FirstOrDefaultAsync();

        if (rootCause == null)
        {
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

    private static HashSet<int> GetDownstreamDeviceIds(int rootDeviceId, IEnumerable<DeviceLink> links)
    {
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
}
