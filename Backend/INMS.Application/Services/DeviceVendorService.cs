using INMS.Application.DTOs;
using INMS.Application.Interfaces;
using INMS.Domain.Entities;
using INMS.Domain.Interfaces;

namespace INMS.Application.Services;

public class DeviceVendorService : IDeviceVendorService
{
    private readonly IDeviceVendorRepository _deviceVendorRepository;
    private readonly IDeviceRepository _deviceRepository;
    private readonly IVendorRepository _vendorRepository;

    public DeviceVendorService(
        IDeviceVendorRepository deviceVendorRepository,
        IDeviceRepository deviceRepository,
        IVendorRepository vendorRepository)
    {
        _deviceVendorRepository = deviceVendorRepository;
        _deviceRepository = deviceRepository;
        _vendorRepository = vendorRepository;
    }

    public async Task<DeviceVendorDto> AssignVendorAsync(AssignVendorDto dto, int assignedBy)
    {
        // Validate assignment is possible
        if (!await IsValidAssignmentAsync(dto.DeviceId, dto.VendorId))
        {
            throw new InvalidOperationException("Cannot assign vendor: DeviceType mismatch or already assigned");
        }

        var assignment = new DeviceVendor
        {
            DeviceId = dto.DeviceId,
            VendorId = dto.VendorId,
            AssignedBy = assignedBy,
            AssignedDate = DateTime.UtcNow,
            Notes = dto.Notes,
            IsActive = true
        };

        await _deviceVendorRepository.AddAsync(assignment);
        
        // Reload with navigation properties
        var created = await _deviceVendorRepository.GetByIdAsync(assignment.DeviceVendorId);
        return MapToDto(created!);
    }

    public async Task<bool> UnassignVendorAsync(int deviceId, int vendorId)
    {
        // Find active assignment
        var assignments = await _deviceVendorRepository.GetActiveByDeviceIdAsync(deviceId);
        var assignment = assignments.FirstOrDefault(dv => dv.VendorId == vendorId);
        
        if (assignment == null) return false;

        assignment.IsActive = false;
        await _deviceVendorRepository.UpdateAsync(assignment);
        return true;
    }

    public async Task<DeviceVendorDto?> UpdateAssignmentAsync(int deviceVendorId, UpdateAssignmentDto dto)
    {
        var assignment = await _deviceVendorRepository.GetByIdAsync(deviceVendorId);
        if (assignment == null) return null;

        assignment.IsActive = dto.IsActive;
        assignment.Notes = dto.Notes;

        await _deviceVendorRepository.UpdateAsync(assignment);
        return MapToDto(assignment);
    }

    public async Task<IEnumerable<DeviceVendorDto>> GetDeviceVendorsAsync(int deviceId)
    {
        var assignments = await _deviceVendorRepository.GetActiveByDeviceIdAsync(deviceId);
        return assignments.Select(MapToDto);
    }

    public async Task<IEnumerable<DeviceVendorDto>> GetVendorDevicesAsync(int vendorId)
    {
        var assignments = await _deviceVendorRepository.GetActiveByVendorIdAsync(vendorId);
        return assignments.Select(MapToDto);
    }

    public async Task<IEnumerable<DeviceVendorDto>> GetAllAssignmentsAsync()
    {
        var assignments = await _deviceVendorRepository.GetAllAsync();
        return assignments.Select(MapToDto);
    }

    // Private validation method - checks assignment validity
    private async Task<bool> IsValidAssignmentAsync(int deviceId, int vendorId)
    {
        // Check if already assigned
        var existingAssignment = await _deviceVendorRepository.GetActiveByDeviceIdAsync(deviceId);
        if (existingAssignment.Any(dv => dv.VendorId == vendorId))
            return false;

        // Check DeviceType compatibility
        var device = await _deviceRepository.GetByIdAsync(deviceId);
        var vendor = await _vendorRepository.GetByIdAsync(vendorId);

        if (device == null || vendor == null)
            return false;

        // Simple enum comparison
        return device.DeviceType == vendor.DeviceType;
    }

    private static DeviceVendorDto MapToDto(DeviceVendor assignment)
    {
        return new DeviceVendorDto(
            assignment.DeviceVendorId,
            assignment.DeviceId,
            assignment.Device?.DeviceName ?? "",
            assignment.VendorId,
            assignment.Vendor?.Name ?? "",
            assignment.Vendor?.Brand ?? "",
            assignment.AssignedDate,
            assignment.IsActive,
            assignment.AssignedBy,
            assignment.AssignedByUser?.FullName,
            assignment.Notes
        );
    }
}