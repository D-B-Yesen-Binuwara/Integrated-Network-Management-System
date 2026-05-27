using INMS.Domain.Entities;

namespace INMS.Application.Interfaces;

public interface ISimulationEventService
{
    Task<SimulationEvent> LogEventAsync(int deviceId, string eventType);
    Task<SimulationEvent> LogAlarmEventAsync(int deviceId, string eventType, int alarmId, DateTime eventTime);
    Task<List<SimulationEvent>> GetDeviceEventsAsync(int deviceId);
    Task<List<SimulationEvent>> GetAllEventsAsync();
}
