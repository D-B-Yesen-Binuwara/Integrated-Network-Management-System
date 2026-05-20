using Microsoft.EntityFrameworkCore;
using INMS.Domain.Entities;
using INMS.Domain.Interfaces;
using INMS.Infrastructure.Persistence;

namespace INMS.Infrastructure.Repositories;

public class DeviceRepository : IDeviceRepository
{
    private readonly AppDbContext _context;

    public DeviceRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Device?> GetByIdAsync(int id)
    {
        return await _context.Devices.Where(d => !d.IsDeleted).FirstOrDefaultAsync(d => d.DeviceId == id);
    }

    public async Task<List<Device>> GetAllAsync()
    {
        return await _context.Devices.Where(d => !d.IsDeleted).ToListAsync();
    }

    public async Task AddAsync(Device device)
    {
        await _context.Devices.AddAsync(device);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(Device device)
    {
        _context.Devices.Update(device);
        await _context.SaveChangesAsync();
    }

    public async Task<List<Device>> GetDevicesByLeaAsync(int leaId)
    {
        return await _context.Devices
            .Where(d => d.LEAId == leaId && !d.IsDeleted)
            .ToListAsync();
    }

    public async Task<List<Device>> GetDevicesByProvinceAsync(int provinceId)
    {
        return await _context.Devices
            .Join(_context.LEAs,
                d => d.LEAId,
                l => l.LEAId,
                (d, l) => new { Device = d, LEA = l })
            .Where(x => x.LEA.ProvinceId == provinceId && !x.Device.IsDeleted)
            .Select(x => x.Device)
            .ToListAsync();
    }

    public async Task<List<Device>> GetDevicesByRegionAsync(int regionId)
    {
        return await _context.Devices
            .Join(_context.LEAs,
                d => d.LEAId,
                l => l.LEAId,
                (d, l) => new { Device = d, LEA = l })
            .Join(_context.Provinces,
                x => x.LEA.ProvinceId,
                p => p.ProvinceId,
                (x, p) => new { x.Device, Province = p })
            .Where(x => x.Province.RegionId == regionId && !x.Device.IsDeleted)
            .Select(x => x.Device)
            .ToListAsync();
    }

    public async Task<List<Device>> GetDevicesByDeviceTypeAsync(INMS.Domain.Enums.DeviceType deviceType)
    {
        return await _context.Devices
            .Where(d => d.DeviceType == deviceType && !d.IsDeleted)
            .ToListAsync();
    }
}
