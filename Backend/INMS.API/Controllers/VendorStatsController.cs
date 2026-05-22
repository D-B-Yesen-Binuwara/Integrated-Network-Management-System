using Microsoft.AspNetCore.Mvc;
using INMS.Application.Interfaces;

namespace INMS.API.Controllers;

[Route("api/vendor-stats")]
[ApiController]
public class VendorStatsController : ControllerBase
{
    private readonly IVendorStatsService _vendorStatsService;

    public VendorStatsController(IVendorStatsService vendorStatsService)
    {
        _vendorStatsService = vendorStatsService;
    }

    // GET /api/vendor-stats/{id}
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetVendorStats(int id)
    {
        var stats = await _vendorStatsService.GetVendorStatsAsync(id);
        if (stats == null) return NotFound();
        return Ok(stats);
    }

    // GET /api/vendor-stats/{id}/detailed
    [HttpGet("{id:int}/detailed")]
    public async Task<IActionResult> GetVendorDeviceStats(int id)
    {
        var stats = await _vendorStatsService.GetVendorDeviceStatsAsync(id);
        if (stats == null) return NotFound();
        return Ok(stats);
    }

    // GET /api/vendor-stats
    [HttpGet]
    public async Task<IActionResult> GetAllVendorStats()
    {
        var stats = await _vendorStatsService.GetAllVendorStatsAsync();
        return Ok(stats);
    }
}