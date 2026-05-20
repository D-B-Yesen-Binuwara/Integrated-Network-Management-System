using INMS.Application.Interfaces;
using INMS.Domain.Enums;
using INMS.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace INMS.API.Controllers;

[Route("api/impact-analysis")]
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

    // Marks a device as DOWN and performs impact analysis.
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
            return StatusCode(500, new { error = "Analysis failed", details = ex.Message, stackTrace = ex.StackTrace });
        }
    }

    // Clears the impact by marking a device as UP.
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
            return StatusCode(500, new { error = "Clear operation failed", details = ex.Message, stackTrace = ex.StackTrace });
        }
    }

    // Retrieves the latest impact analysis result for a device.
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

    // Builds the response object containing device, root cause, and impacted devices with full details.
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

        var rootCause = await _context.RootCauses
            .AsNoTracking()
            .Where(rc => rc.RootCauseDeviceId == deviceId)
            .OrderByDescending(rc => rc.DetectedTime)
            .FirstOrDefaultAsync();

        IEnumerable<object> impactedDevices = Array.Empty<object>();

        if (rootCause != null)
        {
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
                select new
                {
                    d.DeviceId,
                    d.DeviceName,
                    d.DeviceType,
                    Status = d.Status.ToString(),
                    d.IP,
                    d.Latitude,
                    d.Longitude,
                    LEA = lea != null ? lea.Name : "",
                    Province = province != null ? province.Name : "",
                    Region = region != null ? region.Name : "",
                    impacted.ImpactType
                })
                .ToListAsync();

            impactedDevices = impactedRows;
        }

        var rootDevice = rootCause != null ? await _context.Devices
            .AsNoTracking()
            .Include(d => d.LEA)
            .ThenInclude(lea => lea!.Province)
            .ThenInclude(p => p!.Region)
            .FirstOrDefaultAsync(d => d.DeviceId == rootCause.RootCauseDeviceId) : null;

        return new
        {
            Device = new
            {
                device.DeviceId,
                device.DeviceName,
                Status = device.Status.ToString(),
                device.IP,
                device.Latitude,
                device.Longitude,
                device.DeviceType,
                LEA = device.LEA?.Name,
                Province = device.LEA?.Province?.Name,
                Region = device.LEA?.Province?.Region?.Name
            },
            RootCause = rootCause == null ? null : new
            {
                rootCause.RootCauseId,
                rootCause.RootCauseDeviceId,
                rootCause.RootCauseType,
                rootCause.DetectedTime,
                RootDevice = rootDevice == null ? null : new
                {
                    rootDevice.DeviceId,
                    rootDevice.DeviceName,
                    Status = rootDevice.Status.ToString(),
                    rootDevice.IP,
                    rootDevice.Latitude,
                    rootDevice.Longitude,
                    rootDevice.DeviceType,
                    LEA = rootDevice.LEA?.Name,
                    Province = rootDevice.LEA?.Province?.Name,
                    Region = rootDevice.LEA?.Province?.Region?.Name
                }
            },
            ImpactedDevices = impactedDevices
        };
    }

    // Updates the status of a device using the DeviceStatus enum.
    private async Task<bool> SetDeviceStatusAsync(int deviceId, DeviceStatus status)
    {
        var result = await _deviceService.UpdateStatusAsync(deviceId, status);
        return result != null;
    }
}