using Microsoft.AspNetCore.Mvc;
using INMS.Application.Interfaces;
using INMS.Domain.Entities;

namespace INMS.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AlarmController : ControllerBase
{
    private readonly IAlarmService _alarmService;

    public AlarmController(IAlarmService alarmService)
    {
        _alarmService = alarmService;
    }

    // Fetch all alarms
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var alarms = await _alarmService.GetAllAsync();
        return Ok(alarms);
    }

    // Fetch active alarms
    [HttpGet("active")]
    public async Task<IActionResult> GetActive()
    {
        var alarms = await _alarmService.GetActiveAsync();
        return Ok(alarms);
    }

    // Fetch a single alarm by ID
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var alarm = await _alarmService.GetByIdAsync(id);
        if (alarm == null) return NotFound();
        return Ok(alarm);
    }

    // Fetch all alarms raised against a specific device
    [HttpGet("device/{deviceId}")]
    public async Task<IActionResult> GetByDeviceId(int deviceId)
    {
        var alarms = await _alarmService.GetByDeviceIdAsync(deviceId);
        return Ok(alarms);
    }

    // Create a new alarm
    [HttpPost]
    public async Task<IActionResult> Create(Alarm alarm)
    {
        var created = await _alarmService.CreateAsync(alarm);
        return CreatedAtAction(nameof(GetById), new { id = created.AlarmId }, created);
    }

    // Update an existing alarm by ID
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, Alarm alarm)
    {
        var updated = await _alarmService.UpdateAsync(id, alarm);
        if (updated == null) return NotFound();
        return Ok(updated);
    }

    // Delete an alarm by ID
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _alarmService.DeleteAsync(id);
        if (!deleted) return NotFound();
        return NoContent();
    }
}
