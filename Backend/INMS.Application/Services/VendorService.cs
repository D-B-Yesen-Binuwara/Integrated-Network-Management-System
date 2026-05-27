using INMS.Application.DTOs;
using INMS.Application.Interfaces;
using INMS.Domain.Entities;
using INMS.Domain.Enums;
using INMS.Domain.Interfaces;

namespace INMS.Application.Services;

public class VendorService : IVendorService
{
    private readonly IVendorRepository _vendorRepository;

    public VendorService(IVendorRepository vendorRepository)
    {
        _vendorRepository = vendorRepository;
    }

    public async Task<IEnumerable<VendorDto>> GetAllAsync()
    {
        var vendors = await _vendorRepository.GetAllAsync();
        return vendors.Select(MapToDto);
    }

    public async Task<VendorDto?> GetByIdAsync(int id)
    {
        var vendor = await _vendorRepository.GetByIdAsync(id);
        return vendor != null ? MapToDto(vendor) : null;
    }

    public async Task<VendorDto> CreateAsync(CreateVendorDto dto)
    {
        // Check for duplicates
        if (await _vendorRepository.ExistsAsync(dto.Name, dto.Brand, dto.DeviceType))
        {
            throw new InvalidOperationException($"Vendor with name '{dto.Name}', brand '{dto.Brand}', and device type '{dto.DeviceType}' already exists.");
        }

        var vendor = new Vendor
        {
            Name = dto.Name,
            Brand = dto.Brand,
            DeviceType = dto.DeviceType,
            Description = dto.Description,
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        await _vendorRepository.AddAsync(vendor);
        return MapToDto(vendor);
    }

    public async Task<VendorDto?> UpdateAsync(int id, UpdateVendorDto dto)
    {
        var vendor = await _vendorRepository.GetByIdAsync(id);
        if (vendor == null) return null;

        // Check for duplicates (excluding current vendor)
        if (await _vendorRepository.ExistsAsync(dto.Name, dto.Brand, dto.DeviceType, id))
        {
            throw new InvalidOperationException($"Vendor with name '{dto.Name}', brand '{dto.Brand}', and device type '{dto.DeviceType}' already exists.");
        }

        vendor.Name = dto.Name;
        vendor.Brand = dto.Brand;
        vendor.DeviceType = dto.DeviceType;
        vendor.Description = dto.Description;
        vendor.IsActive = dto.IsActive;

        await _vendorRepository.UpdateAsync(vendor);
        return MapToDto(vendor);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var vendor = await _vendorRepository.GetByIdAsync(id);
        if (vendor == null) return false;

        await _vendorRepository.DeleteAsync(vendor);
        return true;
    }

    public async Task<IEnumerable<VendorDto>> GetByDeviceTypeAsync(DeviceType deviceType)
    {
        var vendors = await _vendorRepository.GetByDeviceTypeAsync(deviceType);
        return vendors.Select(MapToDto);
    }

    public async Task<IEnumerable<VendorDto>> GetByBrandAsync(string brand)
    {
        var vendors = await _vendorRepository.GetByBrandAsync(brand);
        return vendors.Select(MapToDto);
    }

    private static VendorDto MapToDto(Vendor vendor)
    {
        return new VendorDto(
            vendor.VendorId,
            vendor.Name,
            vendor.Brand,
            vendor.DeviceType,
            vendor.Description,
            vendor.IsActive,
            vendor.CreatedAt
        );
    }
}