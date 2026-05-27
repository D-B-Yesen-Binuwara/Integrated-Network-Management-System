namespace INMS.Application.DTOs;

public record CreateUserDto(
    string FirstName,
    string LastName,
    int RoleId,
    string? ServiceId = null,
    string? Email = null,
    int? RegionId = null,
    int? ProvinceId = null,
    int? LEAId = null
);

public record UpdateUserDto(string Username, string FullName, int RoleId, string? ServiceId = null, string? Email = null);

public record UserResponseDto(int UserId, string Username, string FullName, int RoleId, string? RoleName, string? ServiceId, string? Email, string? Region, string? Province, string? LEA);
