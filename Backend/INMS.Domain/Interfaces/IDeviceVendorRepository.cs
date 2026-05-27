using INMS.Domain.Entities;

namespace INMS.Domain.Interfaces;

public interface IDeviceVendorRepository
{
    // Basic CRUD operations
    Task<DeviceVendor?> GetByIdAsync(int id);
    Task<List<DeviceVendor>> GetAllAsync();
    Task AddAsync(DeviceVendor deviceVendor);
    Task UpdateAsync(DeviceVendor deviceVendor);
    Task DeleteAsync(DeviceVendor deviceVendor);

    // Device-specific queries
    Task<List<DeviceVendor>> GetByDeviceIdAsync(int deviceId);
    Task<List<DeviceVendor>> GetActiveByDeviceIdAsync(int deviceId);

    // Vendor-specific queries
    Task<List<DeviceVendor>> GetByVendorIdAsync(int vendorId);
    Task<List<DeviceVendor>> GetActiveByVendorIdAsync(int vendorId);

    // Statistics queries
    Task<int> GetActiveDeviceCountAsync(int vendorId);
    Task<int> GetTotalDeviceCountAsync(int vendorId);
    Task<DateTime?> GetLastAssignmentDateAsync(int vendorId);
    Task<List<DeviceVendor>> GetRecentAssignmentsAsync(int vendorId, int count = 5);
}