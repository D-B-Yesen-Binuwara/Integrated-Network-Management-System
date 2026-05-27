using INMS.Application.DTOs;
using INMS.Domain.Enums;

namespace INMS.Application.Interfaces
{
    public interface IVendorService
    {
        Task<IEnumerable<VendorDto>> GetAllAsync();
        Task<VendorDto?> GetByIdAsync(int id);
        Task<VendorDto> CreateAsync(CreateVendorDto dto);
        Task<VendorDto?> UpdateAsync(int id, UpdateVendorDto dto);
        Task<bool> DeleteAsync(int id);
        Task<IEnumerable<VendorDto>> GetByDeviceTypeAsync(DeviceType deviceType);
        Task<IEnumerable<VendorDto>> GetByBrandAsync(string brand);
    }
}
