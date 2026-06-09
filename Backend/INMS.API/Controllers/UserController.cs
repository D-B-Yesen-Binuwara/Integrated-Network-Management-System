using INMS.Application.Services;
using INMS.Application.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace INMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UserController : ControllerBase
{
    private readonly IUserService _service;

    public UserController(IUserService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await _service.GetAll());
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        return Ok(await _service.GetById(id));
    }

    // AllowAnonymous: called immediately after Microsoft login.
    // The user has a valid Microsoft token but no application JWT yet.
    [HttpGet("email/{email}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetByEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
            return BadRequest(new { message = "Email is required." });

        var user = await _service.GetByEmail(email);

        if (user == null)
            return NotFound(new { message = "User not found." });

        return Ok(user);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserDto dto)
    {
        await _service.CreateFromDto(dto);
        return Ok(new { message = "User created successfully." });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _service.Delete(id);
        return Ok();
    }
}