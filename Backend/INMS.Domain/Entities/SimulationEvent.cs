using System.ComponentModel.DataAnnotations;

namespace INMS.Domain.Entities;

public class SimulationEvent
{
    [Key]
    public int EventId { get; set; }
    public int DeviceId { get; set; }
    public string EventType { get; set; } = string.Empty;
    public DateTime EventTime { get; set; }
    public int? AlarmId { get; set; }
}
