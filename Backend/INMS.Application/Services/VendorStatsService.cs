using INMS.Application.DTOs;
using INMS.Application.Interfaces;
using INMS.Domain.Interfaces;

namespace INMS.Application.Services;

public class VendorStatsService : IVendorStatsService
{
    private readonly IVendorRepository _vendorRepository;
    private readonly IDeviceVendorRepository _deviceVendorRepository;

    public VendorStatsService(
        IVendorRepository vendorRepository,
        IDeviceVendorRepository deviceVendorRepository)
    {
        _vendorRepository = vendorRepository;
        _deviceVendorRepository = deviceVendorRepository;
    }

    public async Task<VendorStatsDto?> GetVendorStatsAsync(int vendorId)
    {
        var vendor = await _vendorRepository.GetByIdAsync(vendorId);
        if (vendor == null) return null;

        // Get statistics in parallel for better performance
        var activeCountTask = _deviceVendorRepository.GetActiveDeviceCountAsync(vendorId);
        var totalCountTask = _deviceVendorRepository.GetTotalDeviceCountAsync(vendorId);
        var lastAssignmentTask = _deviceVendorRepository.GetLastAssignmentDateAsync(vendorId);

        await Task.WhenAll(activeCountTask, totalCountTask, lastAssignmentTask);

        return new VendorStatsDto(
            vendor.VendorId,
            vendor.Name,
            vendor.Brand,
            activeCountTask.Result,
            totalCountTask.Result,
            lastAssignmentTask.Result
        );
    }

    public async Task<VendorDeviceStatsDto?> GetVendorDeviceStatsAsync(int vendorId)
    {
        var vendor = await _vendorRepository.GetByIdAsync(vendorId);
        if (vendor == null) return null;

        // Get active device count and recent assignments
        var activeCountTask = _deviceVendorRepository.GetActiveDeviceCountAsync(vendorId);
        var recentAssignmentsTask = _deviceVendorRepository.GetRecentAssignmentsAsync(vendorId);

        await Task.WhenAll(activeCountTask, recentAssignmentsTask);

        var recentAssignmentDtos = recentAssignmentsTask.Result.Select(assignment =>
            new DeviceAssignmentSummaryDto(
                assignment.DeviceId,
                assignment.Device?.DeviceName ?? "",
                assignment.AssignedDate,
                assignment.AssignedByUser?.FullName
            ));

        return new VendorDeviceStatsDto(
            vendor.VendorId,
            vendor.Name,
            activeCountTask.Result,
            recentAssignmentDtos
        );
    }

    public async Task<IEnumerable<VendorStatsDto>> GetAllVendorStatsAsync()
    {
        var vendors = await _vendorRepository.GetAllAsync();
        var statsTasks = vendors.Select(async vendor =>
        {
            // Get statistics for each vendor
            var activeCount = await _deviceVendorRepository.GetActiveDeviceCountAsync(vendor.VendorId);
            var totalCount = await _deviceVendorRepository.GetTotalDeviceCountAsync(vendor.VendorId);
            var lastAssignment = await _deviceVendorRepository.GetLastAssignmentDateAsync(vendor.VendorId);

            return new VendorStatsDto(
                vendor.VendorId,
                vendor.Name,
                vendor.Brand,
                activeCount,
                totalCount,
                lastAssignment
            );
        });

        return await Task.WhenAll(statsTasks);
    }
}