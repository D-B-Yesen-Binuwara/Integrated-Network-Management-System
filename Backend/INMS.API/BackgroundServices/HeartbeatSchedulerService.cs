using INMS.Application.Interfaces;
using INMS.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace INMS.API.BackgroundServices;

public class HeartbeatSchedulerService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<HeartbeatSchedulerService> _logger;
    private const int HeartbeatIntervalSeconds = 30; // Reduced frequency

    public HeartbeatSchedulerService(
        IServiceProvider serviceProvider,
        ILogger<HeartbeatSchedulerService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Heartbeat Scheduler Service started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await PerformHeartbeatCheck();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during heartbeat check");
            }

            await Task.Delay(TimeSpan.FromSeconds(HeartbeatIntervalSeconds), stoppingToken);
        }
    }

    private async Task PerformHeartbeatCheck()
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<INMS.Infrastructure.Persistence.AppDbContext>();
        var heartbeatService = scope.ServiceProvider.GetRequiredService<IHeartbeatService>();

        // Get only active devices that aren't simulated down
        var activeDevices = await context.Devices
            .AsNoTracking()
            .Where(d => !d.IsSimulatedDown)
            .Select(d => d.DeviceId)
            .ToListAsync();
            
        int respondedCount = 0;

        foreach (var deviceId in activeDevices)
        {
            try
            {
                await heartbeatService.RecordHeartbeatAsync(deviceId, "UP");
                respondedCount++;
                _logger.LogDebug($"Heartbeat recorded for device {deviceId}");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, $"Failed to record heartbeat for device {deviceId}");
            }
        }

        _logger.LogInformation($"Heartbeat check completed: {respondedCount}/{activeDevices.Count} devices responded");
    }
}
