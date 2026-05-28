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

    [HttpPost("analyze/{deviceId:int}")]
    public async Task<IActionResult> Analyze(int deviceId)
    {
        var updated = await SetDeviceStatusAsync(deviceId, DeviceStatus.DOWN);
        if (!updated)
        {
            return NotFound();
        }

        await _impactAnalysisService.AnalyzeFailureAsync(deviceId);
        return Ok(await BuildResultAsync(deviceId));
    }

    [HttpPost("clear/{deviceId:int}")]
    public async Task<IActionResult> Clear(int deviceId)
    {
        var updated = await SetDeviceStatusAsync(deviceId, DeviceStatus.UP);
        if (!updated)
        {
            return NotFound();
        }

        await _impactAnalysisService.ClearImpactAsync(deviceId);
        return Ok(await BuildResultAsync(deviceId));
    }

    [HttpGet("result/{deviceId:int}")]
    public async Task<IActionResult> GetResult(int deviceId)
    {
        var device = await _deviceService.GetByIdAsync(deviceId);
        if (device == null)
        {
            return NotFound();
        }

        return Ok(await BuildResultAsync(deviceId));
    }

    private async Task<object> BuildResultAsync(int deviceId)
    {
        var device = await _context.Devices
            .AsNoTracking()
            .FirstAsync(d => d.DeviceId == deviceId);

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
                where impacted.RootCauseId == rootCause.RootCauseId
                select new
                {
                    impacted.DeviceId,
                    d.DeviceName,
                    d.DeviceType,
                    d.Status,
                    impacted.ImpactType
                })
                .ToListAsync();

            impactedDevices = impactedRows;
        }

        return new
        {
            Device = new
            {
                device.DeviceId,
                device.DeviceName,
                device.DeviceType,
                device.Status
            },
            RootCause = rootCause == null
                ? null
                : new
                {
                    rootCause.RootCauseId,
                    rootCause.RootCauseDeviceId,
                    rootCause.RootCauseType,
                    rootCause.DetectedTime
                },
            ImpactedDevices = impactedDevices
        };
    }

    private async Task<bool> SetDeviceStatusAsync(int deviceId, DeviceStatus status)
    {
        var updatedDevice = await _deviceService.UpdateStatusAsync(deviceId, status);
        return updatedDevice != null;
    }
}
