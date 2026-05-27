using INMS.Application.Interfaces;
using INMS.Application.Services;
using INMS.Domain.Enums;
using Microsoft.AspNetCore.Mvc;

namespace INMS.API.Controllers;

[Route("api/impact-analysis")]
[ApiController]
public class EnhancedImpactAnalysisController : ControllerBase
{
    private readonly IImpactAnalysisService _impactAnalysisService;
    private readonly IDeviceService _deviceService;

    public EnhancedImpactAnalysisController(
        IImpactAnalysisService impactAnalysisService,
        IDeviceService deviceService)
    {
        _impactAnalysisService = impactAnalysisService;
        _deviceService = deviceService;
    }

    /// <summary>
    /// Analyzes impact for any device by finding root causes and affected devices.
    /// This is the main endpoint for impact analysis that handles all scenarios:
    /// - Finds root cause by traversing upward through parent hierarchy
    /// - Handles multiple parent failure scenarios
    /// - Identifies all downstream affected devices
    /// - Works for devices in any status (UP, DOWN, UNREACHABLE, IMPACTED)
    /// </summary>
    [HttpGet("analyze/{deviceId:int}")]
    public async Task<IActionResult> AnalyzeDeviceImpact(int deviceId)
    {
        try
        {
            var result = await _impactAnalysisService.AnalyzeDeviceImpactAsync(deviceId);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { 
                error = "Impact analysis failed", 
                details = ex.Message,
                stackTrace = ex.StackTrace 
            });
        }
    }

    /// <summary>
    /// Triggers failure simulation for a device (marks as DOWN and propagates impact).
    /// This creates a new failure scenario.
    /// </summary>
    [HttpPost("simulate-failure/{deviceId:int}")]
    public async Task<IActionResult> SimulateFailure(int deviceId)
    {
        try
        {
            // Verify device exists
            var device = await _deviceService.GetByIdAsync(deviceId);
            if (device == null)
            {
                return NotFound($"Device with ID {deviceId} not found.");
            }

            // Trigger failure analysis
            await _impactAnalysisService.AnalyzeFailureAsync(deviceId);
            
            // Return the impact analysis result
            var result = await _impactAnalysisService.AnalyzeDeviceImpactAsync(deviceId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { 
                error = "Failure simulation failed", 
                details = ex.Message,
                stackTrace = ex.StackTrace 
            });
        }
    }

    /// <summary>
    /// Clears failure simulation for a device (marks as UP and clears impact).
    /// This recovers a device from failure.
    /// </summary>
    [HttpPost("clear-failure/{deviceId:int}")]
    public async Task<IActionResult> ClearFailure(int deviceId)
    {
        try
        {
            // Verify device exists
            var device = await _deviceService.GetByIdAsync(deviceId);
            if (device == null)
            {
                return NotFound($"Device with ID {deviceId} not found.");
            }

            // Clear impact
            await _impactAnalysisService.ClearImpactAsync(deviceId);
            
            // Return the updated impact analysis result
            var result = await _impactAnalysisService.AnalyzeDeviceImpactAsync(deviceId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { 
                error = "Failure clear operation failed", 
                details = ex.Message,
                stackTrace = ex.StackTrace 
            });
        }
    }

    /// <summary>
    /// Legacy endpoint for backward compatibility.
    /// Marks a device as DOWN and performs impact analysis.
    /// </summary>
    [HttpPost("analyze/{deviceId:int}")]
    public async Task<IActionResult> LegacyAnalyze(int deviceId)
    {
        return await SimulateFailure(deviceId);
    }

    /// <summary>
    /// Legacy endpoint for backward compatibility.
    /// Clears the impact by marking a device as UP.
    /// </summary>
    [HttpPost("clear/{deviceId:int}")]
    public async Task<IActionResult> LegacyClear(int deviceId)
    {
        return await ClearFailure(deviceId);
    }

    /// <summary>
    /// Legacy endpoint for backward compatibility.
    /// Retrieves the latest impact analysis result for a device.
    /// </summary>
    [HttpGet("result/{deviceId:int}")]
    public async Task<IActionResult> LegacyGetResult(int deviceId)
    {
        return await AnalyzeDeviceImpact(deviceId);
    }

    /// <summary>
    /// Gets summary statistics for impact analysis across all devices.
    /// </summary>
    [HttpGet("summary")]
    public async Task<IActionResult> GetImpactSummary()
    {
        try
        {
            var allDevices = await _deviceService.GetAllForDashboardAsync();
            
            var summary = new
            {
                TotalDevices = allDevices.Count(),
                DevicesByStatus = allDevices
                    .GroupBy(d => d.Status)
                    .ToDictionary(g => g.Key, g => g.Count()),
                ActiveRootCauses = allDevices.Count(d => d.Status == DeviceStatus.DOWN),
                AffectedDevices = allDevices.Count(d => d.Status == DeviceStatus.UNREACHABLE || d.Status == DeviceStatus.IMPACTED),
                HealthyDevices = allDevices.Count(d => d.Status == DeviceStatus.UP)
            };

            return Ok(summary);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { 
                error = "Failed to get impact summary", 
                details = ex.Message 
            });
        }
    }
}