using INMS.Application.DTOs;

namespace INMS.Application.Interfaces;

public interface IDeviceVendorService
{
    // Assignment operations
    Task<DeviceVendorDto> AssignVendorAsync(AssignVendorDto dto, int assignedBy);
    Task<bool> UnassignVendorAsync(int deviceId, int vendorId);
    Task<DeviceVendorDto?> UpdateAssignmentAsync(int deviceVendorId, UpdateAssignmentDto dto);

    // Query operations
    Task<IEnumerable<DeviceVendorDto>> GetDeviceVendorsAsync(int deviceId);
    Task<IEnumerable<DeviceVendorDto>> GetVendorDevicesAsync(int vendorId);
    Task<IEnumerable<DeviceVendorDto>> GetAllAssignmentsAsync();
}