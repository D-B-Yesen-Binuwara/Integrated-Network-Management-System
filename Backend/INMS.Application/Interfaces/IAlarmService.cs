using INMS.Domain.Entities;

namespace INMS.Application.Interfaces;

public interface IAlarmService
{
    Task<Alarm> GetByIdAsync(int id);
    Task<List<Alarm>> GetAllAsync();
    Task<List<Alarm>> GetActiveAsync();
    Task<List<Alarm>> GetByDeviceIdAsync(int deviceId);
    Task<Alarm> CreateAsync(Alarm alarm);
    Task<Alarm> UpdateAsync(int id, Alarm alarm);
    Task<bool> DeleteAsync(int id);
}
