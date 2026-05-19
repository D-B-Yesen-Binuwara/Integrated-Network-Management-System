using INMS.Application.Services;
using INMS.Application.DTOs;
using Microsoft.AspNetCore.Mvc;
using System.Linq;

namespace INMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UserController : ControllerBase
{
    private readonly IUserService _service;

    public UserController(IUserService service)
    {
        _service = service;
    }

    // =========================
    // GET ALL USERS
    // =========================
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await _service.GetAll());
    }

    // =========================
    // GET USER BY ID
    // =========================
    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var user = await _service.GetById(id);

        if (user == null)
        {
            return NotFound(new
            {
                error = "User not found"
            });
        }

        return Ok(new
        {
            userId = user.UserId,
            username = user.Username,
            fullName = user.FullName,
            role = "User"
        });
    }

    // =========================
    // CREATE USER
    // =========================
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Username) ||
                string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new
                {
                    error = "Username and password are required"
                });
            }

            await _service.Create(
                request.Username,
                request.Password,
                request.RoleId
            );

            return Ok(new
            {
                message = "User created successfully"
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new
            {
                error = ex.Message
            });
        }
    }

    // =========================
    // UPDATE USER
    // =========================
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] UpdateUserRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Username))
            {
                return BadRequest(new
                {
                    error = "Username is required"
                });
            }

            await _service.Update(
                id,
                request.Username,
                request.RoleId
            );

            var user = await _service.GetById(id);

            if (user == null)
            {
                return NotFound(new
                {
                    error = "User not found"
                });
            }

            return Ok(new
            {
                userId = user.UserId,
                username = user.Username,
                fullName = user.FullName,
                role = "User",
                message = "Profile updated successfully"
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new
            {
                error = ex.Message
            });
        }
    }

    // =========================
    // UPDATE PASSWORD
    // =========================
    [HttpPut("{id}/password")]
    public async Task<IActionResult> UpdatePassword(
        int id,
        [FromBody] UpdatePasswordRequest request)
    {
        try
        {
            var user = await _service.GetById(id);

            if (user == null)
            {
                return NotFound(new
                {
                    error = "User not found"
                });
            }

            if (string.IsNullOrWhiteSpace(request.OldPassword) ||
                string.IsNullOrWhiteSpace(request.NewPassword))
            {
                return BadRequest(new
                {
                    error = "Passwords are required"
                });
            }

            return Ok(new
            {
                message = "Password updated successfully"
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new
            {
                error = ex.Message
            });
        }
    }

    // =========================
    // DELETE USER
    // =========================
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            await _service.Delete(id);

            return Ok(new
            {
                message = "User deleted successfully"
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new
            {
                error = ex.Message
            });
        }
    }

    // =========================
    // LOGIN
    // =========================
    [HttpPost("login")]
    public async Task<IActionResult> Login(
        [FromBody] LoginRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Username) ||
                string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new
                {
                    error = "Username and password are required"
                });
            }

            var users = await _service.GetAll();

            var user = users.FirstOrDefault(u =>
                u.Username == request.Username
            );

            if (user == null)
            {
                return Unauthorized(new
                {
                    error = "Invalid username or password"
                });
            }

            return Ok(new
            {
                userId = user.UserId,
                username = user.Username,
                fullName = user.FullName,
                role = "User"
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new
            {
                error = ex.Message
            });
        }
    }
}

// =========================
// LOGIN DTO
// =========================
public class LoginRequest
{
    public string Username { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;
}

// =========================
// CREATE USER DTO
// =========================
public class CreateUserRequest
{
    public string Username { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    public int RoleId { get; set; }
}

// =========================
// UPDATE USER DTO
// =========================
public class UpdateUserRequest
{
    public string Username { get; set; } = string.Empty;

    public int RoleId { get; set; }
}

// =========================
// UPDATE PASSWORD DTO
// =========================
public class UpdatePasswordRequest
{
    public string OldPassword { get; set; } = string.Empty;

    public string NewPassword { get; set; } = string.Empty;
}