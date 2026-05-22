using System.ComponentModel.DataAnnotations;

namespace INMS.Application.DTOs;

public record AssignVendorDto(
    [Required]
    int DeviceId,
    
    [Required]
    int VendorId,
    
    [MaxLength(500)]
    string? Notes
);

public record UpdateAssignmentDto(
    bool IsActive,
    
    [MaxLength(500)]
    string? Notes
);

public record DeviceVendorDto(
    int DeviceVendorId,
    int DeviceId,
    string DeviceName,
    int VendorId,
    string VendorName,
    string VendorBrand,
    DateTime AssignedDate,
    bool IsActive,
    int? AssignedBy,
    string? AssignedByName,
    string? Notes
);