using Microsoft.EntityFrameworkCore;
using INMS.Domain.Entities;
using INMS.Domain.Interfaces;
using INMS.Infrastructure.Persistence;

namespace INMS.Infrastructure.Repositories;

public class DeviceVendorRepository : IDeviceVendorRepository
{
    private readonly AppDbContext _context;

    public DeviceVendorRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<DeviceVendor?> GetByIdAsync(int id)
    {
        return await _context.DeviceVendors
            .Include(dv => dv.Device)
            .Include(dv => dv.Vendor)
            .Include(dv => dv.AssignedByUser)
            .FirstOrDefaultAsync(dv => dv.DeviceVendorId == id);
    }

    public async Task<List<DeviceVendor>> GetAllAsync()
    {
        return await _context.DeviceVendors
            .Include(dv => dv.Device)
            .Include(dv => dv.Vendor)
            .Include(dv => dv.AssignedByUser)
            .ToListAsync();
    }

    public async Task<List<DeviceVendor>> GetByDeviceIdAsync(int deviceId)
    {
        return await _context.DeviceVendors
            .Include(dv => dv.Vendor)
            .Include(dv => dv.AssignedByUser)
            .Where(dv => dv.DeviceId == deviceId)
            .ToListAsync();
    }

    public async Task<List<DeviceVendor>> GetActiveByDeviceIdAsync(int deviceId)
    {
        return await _context.DeviceVendors
            .Include(dv => dv.Vendor)
            .Include(dv => dv.AssignedByUser)
            .Where(dv => dv.DeviceId == deviceId && dv.IsActive)
            .ToListAsync();
    }

    public async Task<List<DeviceVendor>> GetByVendorIdAsync(int vendorId)
    {
        return await _context.DeviceVendors
            .Include(dv => dv.Device)
            .Include(dv => dv.AssignedByUser)
            .Where(dv => dv.VendorId == vendorId)
            .ToListAsync();
    }

    public async Task<List<DeviceVendor>> GetActiveByVendorIdAsync(int vendorId)
    {
        return await _context.DeviceVendors
            .Include(dv => dv.Device)
            .Include(dv => dv.AssignedByUser)
            .Where(dv => dv.VendorId == vendorId && dv.IsActive)
            .ToListAsync();
    }

    public async Task<int> GetActiveDeviceCountAsync(int vendorId)
    {
        return await _context.DeviceVendors
            .CountAsync(dv => dv.VendorId == vendorId && dv.IsActive);
    }

    public async Task<int> GetTotalDeviceCountAsync(int vendorId)
    {
        return await _context.DeviceVendors
            .CountAsync(dv => dv.VendorId == vendorId);
    }

    public async Task<DateTime?> GetLastAssignmentDateAsync(int vendorId)
    {
        return await _context.DeviceVendors
            .Where(dv => dv.VendorId == vendorId)
            .OrderByDescending(dv => dv.AssignedDate)
            .Select(dv => dv.AssignedDate)
            .FirstOrDefaultAsync();
    }

    public async Task<List<DeviceVendor>> GetRecentAssignmentsAsync(int vendorId, int count = 5)
    {
        return await _context.DeviceVendors
            .Include(dv => dv.Device)
            .Include(dv => dv.AssignedByUser)
            .Where(dv => dv.VendorId == vendorId && dv.IsActive)
            .OrderByDescending(dv => dv.AssignedDate)
            .Take(count)
            .ToListAsync();
    }

    public async Task AddAsync(DeviceVendor deviceVendor)
    {
        await _context.DeviceVendors.AddAsync(deviceVendor);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(DeviceVendor deviceVendor)
    {
        _context.DeviceVendors.Update(deviceVendor);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(DeviceVendor deviceVendor)
    {
        _context.DeviceVendors.Remove(deviceVendor);
        await _context.SaveChangesAsync();
    }
}