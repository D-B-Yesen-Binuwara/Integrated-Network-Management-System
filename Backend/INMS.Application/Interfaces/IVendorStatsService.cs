using INMS.Application.DTOs;

namespace INMS.Application.Interfaces;

public interface IVendorStatsService
{
    // Basic vendor statistics
    Task<VendorStatsDto?> GetVendorStatsAsync(int vendorId);
    
    // Detailed vendor statistics with recent assignments
    Task<VendorDeviceStatsDto?> GetVendorDeviceStatsAsync(int vendorId);
    
    // All vendors with their device counts
    Task<IEnumerable<VendorStatsDto>> GetAllVendorStatsAsync();
}