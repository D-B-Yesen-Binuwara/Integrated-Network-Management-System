using INMS.Domain.Entities;
using INMS.Domain.Interfaces;
using INMS.Application.Interfaces;
using INMS.Application.DTOs;
using INMS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace INMS.Application.Services;

public class AlarmService : IAlarmService
{
    private readonly IAlarmRepository _repository;
    private readonly AppDbContext _context;

    public AlarmService(IAlarmRepository repository, AppDbContext context)
    {
        _repository = repository;
        _context = context;
    }

    public async Task<Alarm> GetByIdAsync(int id)
    {
        return await _repository.GetByIdAsync(id);
    }

    public async Task<List<Alarm>> GetAllAsync()
    {
        return await _repository.GetAllAsync();
    }

    public async Task<List<Alarm>> GetByDeviceIdAsync(int deviceId)
    {
        return await _repository.GetByDeviceIdAsync(deviceId);
    }

    public async Task<Alarm> CreateAsync(Alarm alarm)
    {
        alarm.RaisedTime = DateTime.UtcNow;
        alarm.IsActive = true;
        return await _repository.AddAsync(alarm);
    }

    public async Task<Alarm> UpdateAsync(int id, Alarm alarm)
    {
        var existing = await _repository.GetByIdAsync(id);
        if (existing == null) return null!;

        alarm.AlarmId = id;
        return await _repository.UpdateAsync(alarm);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        return await _repository.DeleteAsync(id);
    }

    public async Task<List<AlarmListDto>> GetFilteredAsync(AlarmQueryParams queryParams)
    {
        // Build the base query
        var query = _context.Alarms.AsNoTracking().AsQueryable();

        // Apply filters conditionally
        if (queryParams.IsActive.HasValue)
        {
            query = query.Where(a => a.IsActive == queryParams.IsActive.Value);
        }

        if (queryParams.DateFrom.HasValue)
        {
            query = query.Where(a => a.RaisedTime >= queryParams.DateFrom.Value);
        }

        if (queryParams.DateTo.HasValue)
        {
            query = query.Where(a => a.RaisedTime <= queryParams.DateTo.Value);
        }

        if (queryParams.DeviceId.HasValue)
        {
            query = query.Where(a => a.DeviceId == queryParams.DeviceId.Value);
        }

        // Apply sorting
        var order = queryParams.Order?.ToLower() ?? "desc";
        var sortBy = queryParams.SortBy?.ToLower() ?? "raisedtime";

        query = sortBy switch
        {
            "alarmtype" => order == "desc"
                ? query.OrderByDescending(a => a.AlarmType)
                : query.OrderBy(a => a.AlarmType),
            _ => order == "desc"
                ? query.OrderByDescending(a => a.RaisedTime)
                : query.OrderBy(a => a.RaisedTime)
        };

        // Project to DTO and execute query
        var result = await query
            .Select(a => new AlarmListDto(
                a.AlarmId,
                a.DeviceId,
                a.AlarmType,
                a.RaisedTime,
                a.ClearedTime,
                a.IsActive
            ))
            .ToListAsync();

        return result;
    }

    public async Task<List<Alarm>> GetActiveAsync()
    {
        var all = await _repository.GetAllAsync();
        return all.Where(a => a.IsActive).ToList();
    }
}
