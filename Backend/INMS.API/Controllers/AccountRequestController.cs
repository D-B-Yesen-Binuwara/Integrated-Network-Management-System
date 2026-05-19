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

    // SUBMIT ACCOUNT REQUEST
    [HttpPost]
    public async Task<IActionResult> Submit(
        [FromBody] CreateAccountRequestDto dto)
    {
        try
        {
            await _service.Submit(dto);

            return Ok(new
            {
                success = true,
                message = "Account request submitted successfully"
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new
            {
                success = false,
                message = ex.Message
            });
        }
    }

    // GET ALL ACCOUNT REQUESTS
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            var requests = await _service.GetAll();

            return Ok(requests);
        }
        catch (Exception ex)
        {
            return BadRequest(new
            {
                success = false,
                message = ex.Message
            });
        }
    }

    // UPDATE REQUEST STATUS
    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(
        int id,
        [FromBody] UpdateAccountRequestStatusDto dto)
    {
        try
        {
            bool result = dto.Status.ToUpper() switch
            {
                "APPROVED" => await _service.Approve(id),
                "REJECTED" => await _service.Reject(id),
                _ => false
            };

            if (!result)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Invalid request or already processed"
                });
            }

            return Ok(new
            {
                success = true,
                message = $"Request {dto.Status} successfully"
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new
            {
                success = false,
                message = ex.Message
            });
        }
    }
}