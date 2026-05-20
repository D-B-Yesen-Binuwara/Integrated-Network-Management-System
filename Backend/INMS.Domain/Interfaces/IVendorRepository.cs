using INMS.Domain.Entities;
using INMS.Domain.Enums;

namespace INMS.Domain.Interfaces;

public interface IVendorRepository
{
    Task<Vendor?> GetByIdAsync(int id);
    Task<List<Vendor>> GetAllAsync();
    Task<List<Vendor>> GetByDeviceTypeAsync(DeviceType deviceType);
    Task<List<Vendor>> GetByBrandAsync(string brand);
    Task<bool> ExistsAsync(string name, string brand, DeviceType deviceType, int? excludeId = null);
    Task AddAsync(Vendor vendor);
    Task UpdateAsync(Vendor vendor);
    Task DeleteAsync(Vendor vendor);
}