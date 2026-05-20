using Microsoft.AspNetCore.Mvc;
using INMS.Application.Interfaces;
using INMS.Application.DTOs;

namespace INMS.API.Controllers;

[Route("api/device-vendor")]
[ApiController]
public class DeviceVendorController : ControllerBase
{
    private readonly IDeviceVendorService _deviceVendorService;

    public DeviceVendorController(IDeviceVendorService deviceVendorService)
    {
        _deviceVendorService = deviceVendorService;
    }

    // POST /api/device-vendor/assign
    [HttpPost("assign")]
    public async Task<IActionResult> AssignVendor([FromBody] AssignVendorDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            // TODO: Get actual user ID from JWT token or session
            var assignedBy = 1; // Placeholder - replace with actual user ID
            
            var result = await _deviceVendorService.AssignVendorAsync(dto, assignedBy);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // DELETE /api/device-vendor/unassign/{deviceId}/{vendorId}
    [HttpDelete("unassign/{deviceId:int}/{vendorId:int}")]
    public async Task<IActionResult> UnassignVendor(int deviceId, int vendorId)
    {
        var result = await _deviceVendorService.UnassignVendorAsync(deviceId, vendorId);
        if (!result) return NotFound();
        return NoContent();
    }

    // PUT /api/device-vendor/{id}
    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateAssignment(int id, [FromBody] UpdateAssignmentDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _deviceVendorService.UpdateAssignmentAsync(id, dto);
        if (result == null) return NotFound();
        return Ok(result);
    }

    // GET /api/device-vendor/device/{deviceId}
    [HttpGet("device/{deviceId:int}")]
    public async Task<IActionResult> GetDeviceVendors(int deviceId)
    {
        var vendors = await _deviceVendorService.GetDeviceVendorsAsync(deviceId);
        return Ok(vendors);
    }

    // GET /api/device-vendor/vendor/{vendorId}
    [HttpGet("vendor/{vendorId:int}")]
    public async Task<IActionResult> GetVendorDevices(int vendorId)
    {
        var devices = await _deviceVendorService.GetVendorDevicesAsync(vendorId);
        return Ok(devices);
    }

    // GET /api/device-vendor
    [HttpGet]
    public async Task<IActionResult> GetAllAssignments()
    {
        var assignments = await _deviceVendorService.GetAllAssignmentsAsync();
        return Ok(assignments);
    }
}