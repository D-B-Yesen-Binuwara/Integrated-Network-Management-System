using System.ComponentModel.DataAnnotations;
using INMS.Domain.Enums;

namespace INMS.Application.DTOs;

public record CreateVendorDto(
    [Required]
    [MaxLength(100)]
    string Name,
    
    [Required]
    [MaxLength(50)]
    string Brand,
    
    [Required]
    DeviceType DeviceType,
    
    [MaxLength(255)]
    string? Description
);

public record UpdateVendorDto(
    [Required]
    [MaxLength(100)]
    string Name,
    
    [Required]
    [MaxLength(50)]
    string Brand,
    
    [Required]
    DeviceType DeviceType,
    
    [MaxLength(255)]
    string? Description,
    
    bool IsActive
);

public record VendorDto(
    int VendorId,
    string Name,
    string Brand,
    DeviceType DeviceType,
    string? Description,
    bool IsActive,
    DateTime CreatedAt
);