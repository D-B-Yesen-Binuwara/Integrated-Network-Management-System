using Microsoft.AspNetCore.Mvc;
using INMS.Application.DTOs;
using INMS.Application.Interfaces;
using INMS.Domain.Enums;
using System.Linq;

namespace INMS.API.Controllers
{
    [Route("api/device")]
    [ApiController]
    [Consumes("application/json")]
    public class DeviceController : ControllerBase
    {
        private readonly IDeviceService _deviceService;
        private readonly INMS.Domain.Interfaces.IUserRepository _userRepository;

        public DeviceController(IDeviceService deviceService, INMS.Domain.Interfaces.IUserRepository userRepository)
        {
            _deviceService = deviceService;
            _userRepository = userRepository;
        }

        // Caller id helper

        private int? GetCallerUserIdFromHeader()
        {
            var idHeader = HttpContext.Request.Headers["X-User-Id"].FirstOrDefault();
            if (string.IsNullOrEmpty(idHeader) || !int.TryParse(idHeader, out var userId))
                return null;
            return userId;
        }

        // Fetch all devices
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var callerId = GetCallerUserIdFromHeader();
            var devices = await _deviceService.GetAllForDashboardAsync(callerId);
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
        public async Task<IActionResult> GetMapData()
        {
            var callerId = GetCallerUserIdFromHeader();
            return Ok(await _deviceService.GetDevicesForMapAsync(callerId));
        }

        // Fetch a single device by ID
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var callerId = GetCallerUserIdFromHeader();
            try
            {
                var device = await _deviceService.GetByIdAsync(id, callerId);
                if (device == null) return NotFound();
                return Ok(device);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        // Create a new device
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateDeviceDto dto)
        {
            var callerId = GetCallerUserIdFromHeader();
            try
            {
                var created = await _deviceService.CreateAsync(dto, callerId);
                return CreatedAtAction(nameof(GetById), new { id = created.DeviceId }, created);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        // Update an existing device by ID
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateDeviceDto dto)
        {
            var callerId = GetCallerUserIdFromHeader();
            try
            {
                var updated = await _deviceService.UpdateAsync(id, dto, callerId);
                if (updated == null) return NotFound();
                return Ok(updated);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        // Delete a device by ID
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var callerId = GetCallerUserIdFromHeader();
            try
            {
                var deleted = await _deviceService.DeleteAsync(id, callerId);
                if (!deleted) return NotFound();
                return NoContent();
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        // Assign a device to a user
        [HttpPatch("{id:int}/assign")]
        public async Task<IActionResult> AssignDevice(int id, [FromBody] AssignDeviceRequest request)
        {
            var callerId = GetCallerUserIdFromHeader();
            try
            {
                await _deviceService.AssignDeviceAsync(id, request.UserId, callerId);
                return Ok("Device assigned successfully");
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        // Simulate a device failure and trigger downstream impact propagation
        [HttpPost("{id}/simulate-failure")]
        public async Task<IActionResult> SimulateFailure(int id)
        {
            var callerId = GetCallerUserIdFromHeader();
            try
            {
                var updated = await _deviceService.SetSimulationStateAsync(id, true, callerId);
                if (updated == null) return NotFound();
                return Ok(new { message = "Device failure simulation started", deviceId = id });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        // Recover a simulated device failure and restore its status
        [HttpPost("{id}/recover")]
        public async Task<IActionResult> Recover(int id)
        {
            var callerId = GetCallerUserIdFromHeader();
            try
            {
                var updated = await _deviceService.SetSimulationStateAsync(id, false, callerId);
                if (updated == null) return NotFound();
                return Ok(new { message = "Device recovery simulation started", deviceId = id });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        public class AssignDeviceRequest
        {
            public int UserId { get; set; }
        }

        // Update only the status field of a device
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusRequest request)
        {
            var callerId = GetCallerUserIdFromHeader();
            try
            {
                var updated = await _deviceService.UpdateStatusAsync(id, request.Status, callerId);
                if (updated == null) return NotFound();
                return Ok(updated);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }
    }

    public class UpdateStatusRequest
    {
        public DeviceStatus Status { get; set; }
    }
}
