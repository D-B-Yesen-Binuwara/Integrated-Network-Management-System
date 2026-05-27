using Microsoft.AspNetCore.Mvc;
using INMS.Application.Interfaces;

namespace INMS.API.Controllers;

[Route("api/devices")]
[ApiController]
public class DeviceHealthController : ControllerBase
{
    private readonly IDeviceService _deviceService;
    private readonly IHeartbeatService _heartbeatService;

    public DeviceHealthController(IDeviceService deviceService, IHeartbeatService heartbeatService)
    {
        _deviceService = deviceService;
        _heartbeatService = heartbeatService;
    }

    // Fetch health status and latest heartbeat info for a specific device
    [HttpGet("{id}/health")]
    public async Task<IActionResult> GetDeviceHealth(int id)
    {
        var device = await _deviceService.GetByIdAsync(id);
        if (device == null) return NotFound();

        var latestHeartbeat = await _heartbeatService.GetLatestHeartbeatAsync(id);

        var healthStatus = new
        {
            DeviceId = device.DeviceId,
            DeviceName = device.DeviceName,
            Status = device.Status.ToString(),
            LastHeartbeat = latestHeartbeat?.Timestamp,
            TimeSinceLastHeartbeat = latestHeartbeat != null
                ? (double?)(DateTime.UtcNow - latestHeartbeat.Timestamp).TotalSeconds
                : (double?)null,
            IsHealthy = latestHeartbeat != null && (DateTime.UtcNow - latestHeartbeat.Timestamp).TotalSeconds < 30
        };

        return Ok(healthStatus);
    }

    // Fetch a summary of total, online, and offline device counts
    [HttpGet("health/summary")]
    public async Task<IActionResult> GetHealthSummary()
    {
        var devices = await _deviceService.GetAllAsync();
        var summary = new
        {
            TotalDevices = devices.Count(),
            OnlineDevices = devices.Count(d => d.Status == Domain.Enums.DeviceStatus.UP),
            OfflineDevices = devices.Count(d => d.Status == Domain.Enums.DeviceStatus.DOWN)
        };

        return Ok(summary);
    }
}
