using INMS.Application.DTOs;
using INMS.Domain.Entities;
using INMS.Domain.Enums;

namespace INMS.Application.Interfaces
{
    // Service for managing device lifecycle, retrieval, and basic state updates.
    // Impact-related operations are delegated to IImpactAnalysisService.
    // Responsibility: Device CRUD operations and basic status management (SRP)
    public interface IDeviceService
    {
        // Retrieves all devices in the system.
        Task<IEnumerable<Device>> GetAllAsync();

        // Retrieves all devices with dashboard-specific information (joins with LEA, Province, Region, User).
        Task<IEnumerable<DeviceListDto>> GetAllForDashboardAsync();

        // Retrieves all devices with map visualization data (coordinates and impact status).
        Task<IEnumerable<DeviceMapDto>> GetDevicesForMapAsync();

        // Retrieves a single device by ID.
        Task<Device?> GetByIdAsync(int id);

        // Creates a new device.
        Task<Device> CreateAsync(CreateDeviceDto dto);

        // Updates an existing device's properties.
        Task<Device?> UpdateAsync(int id, UpdateDeviceDto dto);

        // Deletes a device and all associated records (links, alarms, heartbeats, etc.).
        Task<bool> DeleteAsync(int id);

        // Assigns a device to a user.
        Task AssignDeviceAsync(int deviceId, int userId);

        // Retrieves devices visible to a user based on their area assignment.
        Task<List<Device>> GetVisibleDevicesAsync(int userId);

        // Updates a device's status (delegating impact analysis to IImpactAnalysisService).
        Task<Device?> UpdateStatusAsync(int id, DeviceStatus status);

        // Sets the simulation state for a device (forces DOWN for testing).
        Task<Device?> SetSimulationStateAsync(int id, bool isSimulatedDown);
    }
}
