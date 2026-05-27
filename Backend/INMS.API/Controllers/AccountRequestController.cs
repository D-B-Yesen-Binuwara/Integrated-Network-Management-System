using INMS.Application.DTOs;
using INMS.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace INMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AccountRequestController : ControllerBase
{
    private readonly IAccountRequestService _service;

    public AccountRequestController(IAccountRequestService service)
    {
        _service = service;
    }

    [HttpPost]
    public async Task<IActionResult> Submit([FromBody] CreateAccountRequestDto dto)
    {
        await _service.Submit(dto);
        return Ok();
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await _service.GetAll());
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateAccountRequestStatusDto dto)
    {
        var result = dto.Status switch
        {
            "APPROVED" => await _service.Approve(id),
            "REJECTED" => await _service.Reject(id),
            _ => false
        };

        if (!result) return BadRequest("Request not found, already processed, or invalid status.");
        return Ok();
    }
}
