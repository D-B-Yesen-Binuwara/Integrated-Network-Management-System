using System.Globalization;
using INMS.Application.Interfaces;
using INMS.Domain.Enums;
using INMS.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace INMS.API.Controllers;

[Route("api/impact-analysis/legacy")]
[ApiController]
public class ImpactAnalysisController : ControllerBase
{
    private readonly IImpactAnalysisService _impactAnalysisService;
    private readonly IDeviceService _deviceService;
    private readonly AppDbContext _context;

    public ImpactAnalysisController(
        IImpactAnalysisService impactAnalysisService,
        IDeviceService deviceService,
        AppDbContext context)
    {
        _impactAnalysisService = impactAnalysisService;
        _deviceService = deviceService;
        _context = context;
    }

    [HttpPost("analyze/{deviceId:int}")]
    public async Task<IActionResult> Analyze(int deviceId)
    {
        try
        {
            var updated = await SetDeviceStatusAsync(deviceId, DeviceStatus.DOWN);
            if (!updated)
            {
                return NotFound($"Device with ID {deviceId} not found.");
            }

            await _impactAnalysisService.AnalyzeFailureAsync(deviceId);
            return Ok(await BuildResultAsync(deviceId));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Analysis failed", details = ex.Message });
        }
    }

    [HttpPost("clear/{deviceId:int}")]
    public async Task<IActionResult> Clear(int deviceId)
    {
        try
        {
            var updated = await SetDeviceStatusAsync(deviceId, DeviceStatus.UP);
            if (!updated)
            {
                return NotFound($"Device with ID {deviceId} not found.");
            }

            await _impactAnalysisService.ClearImpactAsync(deviceId);
            return Ok(await BuildResultAsync(deviceId));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Clear operation failed", details = ex.Message });
        }
    }

    [HttpGet("result/{deviceId:int}")]
    public async Task<IActionResult> GetResult(int deviceId)
    {
        var device = await _deviceService.GetByIdAsync(deviceId);
        if (device == null)
        {
            return NotFound($"Device with ID {deviceId} not found.");
        }

        return Ok(await BuildResultAsync(deviceId));
    }

    private async Task<object> BuildResultAsync(int deviceId)
    {
        var device = await _context.Devices
            .AsNoTracking()
            .Include(d => d.LEA)
            .ThenInclude(lea => lea!.Province)
            .ThenInclude(p => p!.Region)
            .FirstOrDefaultAsync(d => d.DeviceId == deviceId);

        if (device == null)
        {
            return new { Message = $"Device with ID {deviceId} not found." };
        }

        var sourceNodes = await GetTopologyNodesAsync(new[] { deviceId }, new Dictionary<int, string>());
        var sourceNode = sourceNodes.First();
        var rootCause = await GetCurrentRootCauseAsync(device);
        var impactTypesByDeviceId = new Dictionary<int, string>();

        if (rootCause != null)
        {
            var impactedRows = await _context.ImpactedDevices
                .AsNoTracking()
                .Where(impacted => impacted.RootCauseId == rootCause.RootCauseId)
                .Select(impacted => new { impacted.DeviceId, impacted.ImpactType })
                .ToListAsync();

            impactTypesByDeviceId = impactedRows
                .GroupBy(impacted => impacted.DeviceId)
                .ToDictionary(
                    group => group.Key,
                    group => string.Join(", ", group
                        .Select(impacted => impacted.ImpactType)
                        .Distinct()
                        .OrderBy(impactType => impactType)));
        }

        var impactedNodes = await GetTopologyNodesAsync(impactTypesByDeviceId.Keys.ToList(), impactTypesByDeviceId);
        var summary = BuildSummary(impactedNodes);
        var isolatedSegments = impactedNodes
            .GroupBy(node => new { node.RegionName, node.ProvinceName, node.LeaName })
            .Select(group => new ImpactAnalysisSegmentDto(
                group.Key.RegionName,
                group.Key.ProvinceName,
                group.Key.LeaName,
                group.Count()))
            .OrderByDescending(segment => segment.AffectedCount)
            .ThenBy(segment => segment.RegionName)
            .ThenBy(segment => segment.ProvinceName)
            .ThenBy(segment => segment.LeaName)
            .ToList();

        return new
        {
            Device = new
            {
                device.DeviceId,
                device.DeviceName,
                DeviceType = device.DeviceType.ToString(),
                device.IP,
                Status = device.Status.ToString()
            },
            SourceDevice = sourceNode,
            RootCause = rootCause == null
                ? null
                : new
                {
                    rootCause.RootCauseId,
                    rootCause.RootCauseDeviceId,
                    rootCause.RootCauseType,
                    rootCause.DetectedTime
                },
            ImpactedDevices = impactedNodes,
            Summary = summary,
            IsolatedSegments = isolatedSegments
        };
    }

    private async Task<RootCauseRow?> GetCurrentRootCauseAsync(INMS.Domain.Entities.Device device)
    {
        if (device.Status != DeviceStatus.DOWN)
        {
            return null;
        }

        return await (
            from rootCause in _context.RootCauses.AsNoTracking()
            join alarm in _context.Alarms.AsNoTracking() on rootCause.AlarmId equals alarm.AlarmId
            where rootCause.RootCauseDeviceId == device.DeviceId && alarm.IsActive
            orderby rootCause.DetectedTime descending
            select new RootCauseRow(
                rootCause.RootCauseId,
                rootCause.AlarmId,
                rootCause.RootCauseDeviceId,
                rootCause.RootCauseType,
                rootCause.DetectedTime))
            .FirstOrDefaultAsync();
    }

    private async Task<List<ImpactAnalysisNodeDto>> GetTopologyNodesAsync(
        IReadOnlyCollection<int> deviceIds,
        IReadOnlyDictionary<int, string> impactTypesByDeviceId)
    {
        if (deviceIds.Count == 0)
        {
            return [];
        }

        var rows = await _context.Devices
            .AsNoTracking()
            .Where(device => deviceIds.Contains(device.DeviceId))
            .Select(device => new
            {
                device.DeviceId,
                device.DeviceName,
                device.DeviceType,
                device.IP,
                device.Status,
                device.PriorityLevel,
                device.LEAId,
                LeaName = device.LEA == null ? "Unknown LEA" : device.LEA.Name,
                ProvinceName = device.LEA == null || device.LEA.Province == null
                    ? "Unknown Province"
                    : device.LEA.Province.Name,
                RegionName = device.LEA == null || device.LEA.Province == null || device.LEA.Province.Region == null
                    ? "Unknown Region"
                    : device.LEA.Province.Region.Name,
                device.Latitude,
                device.Longitude
            })
            .ToListAsync();

        var linkRows = await (
            from link in _context.DeviceLinks.AsNoTracking()
            join parent in _context.Devices.AsNoTracking() on link.ParentDeviceId equals parent.DeviceId
            join child in _context.Devices.AsNoTracking() on link.ChildDeviceId equals child.DeviceId
            where deviceIds.Contains(link.ParentDeviceId) || deviceIds.Contains(link.ChildDeviceId)
            select new
            {
                link.ParentDeviceId,
                link.ChildDeviceId,
                ParentName = parent.DeviceName,
                ChildName = child.DeviceName
            })
            .ToListAsync();

        var parentsByChild = linkRows
            .Where(link => deviceIds.Contains(link.ChildDeviceId))
            .GroupBy(link => link.ChildDeviceId)
            .ToDictionary(
                group => group.Key,
                group => string.Join(", ", group.Select(link => link.ParentName).OrderBy(name => name)));

        var childrenByParent = linkRows
            .Where(link => deviceIds.Contains(link.ParentDeviceId))
            .GroupBy(link => link.ParentDeviceId)
            .ToDictionary(
                group => group.Key,
                group => string.Join(", ", group.Select(link => link.ChildName).OrderBy(name => name)));

        return rows
            .Select(row =>
            {
                impactTypesByDeviceId.TryGetValue(row.DeviceId, out var impactType);
                parentsByChild.TryGetValue(row.DeviceId, out var parent);
                childrenByParent.TryGetValue(row.DeviceId, out var children);

                return new ImpactAnalysisNodeDto(
                    row.DeviceId,
                    row.DeviceName,
                    row.DeviceType.ToString(),
                    row.IP,
                    row.Status.ToString(),
                    row.PriorityLevel.ToString(),
                    row.LEAId,
                    row.LeaName,
                    row.ProvinceName,
                    row.RegionName,
                    row.Latitude,
                    row.Longitude,
                    string.IsNullOrWhiteSpace(parent) ? "-" : parent,
                    string.IsNullOrWhiteSpace(children) ? "-" : children,
                    FormatLocation(row.Latitude, row.Longitude),
                    impactType);
            })
            .OrderBy(node => GetDeviceTypeSort(node.DeviceType))
            .ThenBy(node => node.DeviceName)
            .ToList();
    }

    private static ImpactAnalysisSummaryDto BuildSummary(IReadOnlyCollection<ImpactAnalysisNodeDto> impactedNodes)
    {
        return new ImpactAnalysisSummaryDto(
            impactedNodes.Count(node => node.DeviceType == nameof(DeviceType.SLBN)),
            impactedNodes.Count(node => node.DeviceType == nameof(DeviceType.CEAN)),
            impactedNodes.Count(node => node.DeviceType == nameof(DeviceType.MSAN)),
            impactedNodes.Count(node => node.DeviceType == nameof(DeviceType.Customer)),
            impactedNodes.Count);
    }

    private static int GetDeviceTypeSort(string deviceType)
    {
        return deviceType switch
        {
            nameof(DeviceType.SLBN) => 0,
            nameof(DeviceType.CEAN) => 1,
            nameof(DeviceType.MSAN) => 2,
            nameof(DeviceType.Customer) => 3,
            _ => 4
        };
    }

    private static string FormatLocation(decimal latitude, decimal longitude)
    {
        return string.Create(
            CultureInfo.InvariantCulture,
            $"{latitude:0.####}, {longitude:0.####}");
    }

    private async Task<bool> SetDeviceStatusAsync(int deviceId, DeviceStatus status)
    {
        var result = await _deviceService.UpdateStatusAsync(deviceId, status);
        return result != null;
    }

    private sealed record RootCauseRow(
        int RootCauseId,
        int AlarmId,
        int RootCauseDeviceId,
        string RootCauseType,
        DateTime DetectedTime);

    private sealed record ImpactAnalysisNodeDto(
        int DeviceId,
        string DeviceName,
        string DeviceType,
        string Ip,
        string Status,
        string PriorityLevel,
        int LeaId,
        string LeaName,
        string ProvinceName,
        string RegionName,
        decimal Latitude,
        decimal Longitude,
        string Parent,
        string Childs,
        string Location,
        string? ImpactType);

    private sealed record ImpactAnalysisSummaryDto(
        int SlbnAffected,
        int CeanAffected,
        int MsanAffected,
        int CustomerAffected,
        int TotalAffected);

    private sealed record ImpactAnalysisSegmentDto(
        string RegionName,
        string ProvinceName,
        string LeaName,
        int AffectedCount);
}
