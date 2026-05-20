using INMS.Application.Services;
using INMS.Application.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace INMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UserController : ControllerBase
{
    private readonly IUserService _service;
    private readonly INMS.Infrastructure.Persistence.AppDbContext _context;

    public UserController(IUserService service, INMS.Infrastructure.Persistence.AppDbContext context)
    {
        _service = service;
        _context = context;
    }

    // Fetch all users
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await _service.GetAll());
    }

    // Fetch a single user by ID
    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        return Ok(await _service.GetById(id));
    }

    // Create a new user from DTO (FirstName, LastName, RoleId, ServiceId, Areas)
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserDto dto)
    {
        // If creating a platform admin, only a super Admin may perform this action
        if (dto.RoleId > 0)
        {
            var role = await _context.Roles.FindAsync(dto.RoleId);
            if (role != null && role.IsPlatformAdmin)
            {
                // Expect X-User-Id header for the actor
                if (!Request.Headers.TryGetValue("X-User-Id", out var vals) || !int.TryParse(vals.FirstOrDefault(), out var actorId))
                    return Forbid("Creating a platform admin requires super admin authorization");

                var actor = await _context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.UserId == actorId);
                if (actor == null || actor.Role == null || actor.Role.RoleName != "Admin")
                    return Forbid("Only super admin may create platform admin accounts");
            }
        }

        await _service.CreateFromDto(dto);
        return Ok(new { message = "User created successfully" });
    }

    // Delete a user by ID
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _service.Delete(id);
        return Ok();
    }
}
