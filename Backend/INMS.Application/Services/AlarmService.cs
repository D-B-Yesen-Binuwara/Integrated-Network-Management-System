using INMS.Domain.Entities;
using INMS.Domain.Interfaces;
using INMS.Application.Interfaces;

namespace INMS.Application.Services;

public class AlarmService : IAlarmService
{
    private readonly IAlarmRepository _repository;

    public AlarmService(IAlarmRepository repository)
    {
        _repository = repository;
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

    public async Task<List<Alarm>> GetActiveAsync()
    {
        var all = await _repository.GetAllAsync();
        return all.Where(a => a.IsActive).ToList();
    }
}
