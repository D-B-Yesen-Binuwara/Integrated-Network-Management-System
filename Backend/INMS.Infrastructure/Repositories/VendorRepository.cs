using Microsoft.EntityFrameworkCore;
using INMS.Domain.Entities;
using INMS.Domain.Interfaces;
using INMS.Infrastructure.Persistence;
using INMS.Domain.Enums;

namespace INMS.Infrastructure.Repositories;

public class VendorRepository : IVendorRepository
{
    private readonly AppDbContext _context;

    public VendorRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Vendor?> GetByIdAsync(int id)
    {
        return await _context.Vendors
            .FirstOrDefaultAsync(v => v.VendorId == id);
    }

    public async Task<List<Vendor>> GetAllAsync()
    {
        return await _context.Vendors.ToListAsync();
    }

    public async Task<List<Vendor>> GetByDeviceTypeAsync(DeviceType deviceType)
    {
        return await _context.Vendors
            .Where(v => v.DeviceType == deviceType)
            .ToListAsync();
    }

    public async Task<List<Vendor>> GetByBrandAsync(string brand)
    {
        return await _context.Vendors
            .Where(v => v.Brand == brand)
            .ToListAsync();
    }

    public async Task AddAsync(Vendor vendor)
    {
        await _context.Vendors.AddAsync(vendor);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(Vendor vendor)
    {
        _context.Vendors.Update(vendor);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(Vendor vendor)
    {
        _context.Vendors.Remove(vendor);
        await _context.SaveChangesAsync();
    }

    public async Task<bool> ExistsAsync(string name, string brand, DeviceType deviceType, int? excludeId = null)
    {
        var query = _context.Vendors
            .Where(v => v.Name == name && v.Brand == brand && v.DeviceType == deviceType);
        
        if (excludeId.HasValue)
            query = query.Where(v => v.VendorId != excludeId.Value);
            
        return await query.AnyAsync();
    }
}