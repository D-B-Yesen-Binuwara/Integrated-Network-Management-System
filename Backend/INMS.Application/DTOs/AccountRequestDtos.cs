namespace INMS.Application.DTOs;

public record CreateAccountRequestDto(
    string FullName,
    string Email,
    string ServiceId,
    int RoleId,
    int RegionId,
    int? ProvinceId,
    int? LEAId
);

public record UpdateAccountRequestStatusDto(string Status);

public record AccountRequestResponseDto(
    int RequestId,
    string FullName,
    string Email,
    string ServiceId,
    int RoleId,
    string? RoleName,
    int RegionId,
    string? RegionName,
    int? ProvinceId,
    string? ProvinceName,
    int? LEAId,
    string? LEAName,
    DateTime RequestedAt,
    string Status
);
