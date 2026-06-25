using Microsoft.AspNetCore.Mvc;
using INMS.Application.DTOs;
using INMS.Application.Interfaces;
using INMS.Domain.Enums;

namespace INMS.API.Controllers
{
    [Route("api/device")]
    [ApiController]
    public class DeviceController : ControllerBase
    {
        private readonly IDeviceService _deviceService;

        public DeviceController(IDeviceService deviceService)
        {
            _deviceService = deviceService;
        }

        // Fetch all devices
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var devices = await _deviceService.GetAllForDashboardAsync();
            return Ok(devices);
        }

        // Fetch devices visible to a specific user based on their area assignment
        [HttpGet("visible/{userId}")]
        public async Task<IActionResult> GetVisible(int userId)
        {
            var devices = await _deviceService.GetVisibleDevicesAsync(userId);
            return Ok(devices);
        }

        // Fetch all devices with map coordinates and impact state
        [HttpGet("map")]
        public async Task<IActionResult> GetMapData() => Ok(await _deviceService.GetDevicesForMapAsync());

        // Fetch paged devices with optional filtering and sorting
        [HttpGet("paged")]
        public async Task<IActionResult> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 20,
            [FromQuery] DeviceStatus? status = null, [FromQuery] int? leaId = null,
            [FromQuery] int? assignedUserId = null, [FromQuery] string? sortBy = null, [FromQuery] string? order = "asc")
        {
            var queryParams = new DeviceQueryParams(page, pageSize, status, leaId, assignedUserId, sortBy, order);
            var result = await _deviceService.GetPagedDevicesAsync(queryParams);
            return Ok(result);
        }

        // Fetch a single device by ID
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var device = await _deviceService.GetByIdAsync(id);
            if (device == null) return NotFound();
            return Ok(device);
        }

        // Create a new device
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateDeviceDto dto)
        {
            var created = await _deviceService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = created.DeviceId }, created);
        }

        // Update an existing device by ID
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateDeviceDto dto)
        {
            var updated = await _deviceService.UpdateAsync(id, dto);
            if (updated == null) return NotFound();
            return Ok(updated);
        }

        // Delete a device by ID
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var deleted = await _deviceService.DeleteAsync(id);
            if (!deleted) return NotFound();
            return NoContent();
        }

        // Assign a device to a user
        [HttpPatch("{id:int}/assign")]
        public async Task<IActionResult> AssignDevice(int id, [FromBody] AssignDeviceRequest request)
        {
            await _deviceService.AssignDeviceAsync(id, request.UserId);
            return Ok("Device assigned successfully");
        }

        // Simulate a device failure and trigger downstream impact propagation
        [HttpPost("{id}/simulate-failure")]
        public async Task<IActionResult> SimulateFailure(int id)
        {
            var updated = await _deviceService.SetSimulationStateAsync(id, true);
            if (updated == null) return NotFound();

            return Ok(new { message = "Device failure simulation started", deviceId = id });
        }

        // Recover a simulated device failure and restore its status
        [HttpPost("{id}/recover")]
        public async Task<IActionResult> Recover(int id)
        {
            var updated = await _deviceService.SetSimulationStateAsync(id, false);
            if (updated == null) return NotFound();

            return Ok(new { message = "Device recovery simulation started", deviceId = id });
        }

        public class AssignDeviceRequest
        {
            public int UserId { get; set; }
        }

        // Update only the status field of a device
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusRequest request)
        {
            var updated = await _deviceService.UpdateStatusAsync(id, request.Status);
            if (updated == null) return NotFound();
            return Ok(updated);
        }
    }

    public class UpdateStatusRequest
    {
        public DeviceStatus Status { get; set; }
    }
}
