namespace INMS.Application.DTOs;

public record VendorStatsDto(
    int VendorId,
    string VendorName,
    string Brand,
    int ActiveDeviceCount,
    int TotalDeviceCount,
    DateTime? LastAssignmentDate
);

public record VendorDeviceStatsDto(
    int VendorId,
    string VendorName,
    int ActiveDeviceCount,
    IEnumerable<DeviceAssignmentSummaryDto> RecentAssignments
);

public record DeviceAssignmentSummaryDto(
    int DeviceId,
    string DeviceName,
    DateTime AssignedDate,
    string? AssignedByName
);