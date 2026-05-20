using Microsoft.AspNetCore.Mvc;
using INMS.Application.Interfaces;
using INMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace INMS.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Consumes("application/json")]
    public class DeviceLinkController : ControllerBase
    {
        private readonly IDeviceLinkService _service;
        private readonly INMS.Infrastructure.Persistence.AppDbContext _context;

        public DeviceLinkController(IDeviceLinkService service, INMS.Infrastructure.Persistence.AppDbContext context)
        {
            _service = service;
            _context = context;
        }

        private int? GetCallerUserIdFromHeader()
        {
            var idHeader = HttpContext.Request.Headers["X-User-Id"].FirstOrDefault();
            if (string.IsNullOrEmpty(idHeader) || !int.TryParse(idHeader, out var userId))
            {
                return null;
            }

            return userId;
        }

        // Create a parent-child link between two devices
        // Enforces: platform admins may only create links whose PARENT device is in their layer.
        [HttpPost]
        public async Task<IActionResult> CreateLink(CreateLinkRequest request)
        {
            var callerId = GetCallerUserIdFromHeader();

            // If caller is a platform admin, ensure the parent belongs to their layer
            if (callerId.HasValue)
            {
                var user = await _context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.UserId == callerId.Value);
                if (user != null && user.Role != null && user.Role.IsPlatformAdmin)
                {
                    var parent = await _context.Devices.FindAsync(request.ParentDeviceId);
                    if (parent == null) return BadRequest("Parent device not found");

                    var roleName = user.Role.RoleName?.ToLower() ?? string.Empty;
                    var allowed = roleName.Contains("msan") ? parent.DeviceType == INMS.Domain.Enums.DeviceType.MSAN
                               : roleName.Contains("cean") ? parent.DeviceType == INMS.Domain.Enums.DeviceType.CEAN
                               : roleName.Contains("slbn") ? parent.DeviceType == INMS.Domain.Enums.DeviceType.SLBN
                               : false;

                    if (!allowed) return StatusCode(403, "Platform admin can only create links from devices in their layer");
                }
            }

            try
            {
                var link = await _service.CreateLinkAsync(request.ParentDeviceId, request.ChildDeviceId);
                return Ok(link);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (System.Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // Fetch all device links
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            return Ok(await _service.GetAllLinksAsync());
        }

        // Delete a device link by ID
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _service.DeleteLinkAsync(id);
            return Ok("Deleted");
        }
    }

    public class CreateLinkRequest
    {
        public int ParentDeviceId { get; set; }
        public int ChildDeviceId { get; set; }
    }
}
