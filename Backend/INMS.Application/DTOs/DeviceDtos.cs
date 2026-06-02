using System.ComponentModel.DataAnnotations;
using INMS.Domain.Enums;

namespace INMS.Application.DTOs;

public record CreateDeviceDto(
	string DeviceName,
	DeviceType DeviceType,
	string? IP,
	PriorityLevel PriorityLevel,
	int LEAId,
	[Range(-90, 90, ErrorMessage = "Latitude must be between -90 and 90")]
	decimal Latitude,
	[Range(-180, 180, ErrorMessage = "Longitude must be between -180 and 180")]
	decimal Longitude
);

public record UpdateDeviceDto(
	string DeviceName,
	DeviceType DeviceType,
	string? IP,
	string Status,
	PriorityLevel PriorityLevel,
	int LEAId,
	[Range(-90, 90, ErrorMessage = "Latitude must be between -90 and 90")]
	decimal Latitude,
	[Range(-180, 180, ErrorMessage = "Longitude must be between -180 and 180")]
	decimal Longitude
);

public record DeviceMapDto(
	int DeviceId,
	string DeviceName,
	string DeviceType,
	decimal Latitude,
	decimal Longitude,
	string Status,
	int IsImpacted
);

public record DeviceListDto(
	int DeviceId,
	string DeviceName,
	DeviceType DeviceType,
	string IP,
	DeviceStatus Status,
	PriorityLevel PriorityLevel,
	int LEAId,
	string? LEAName,
	string? ProvinceName,
	string? RegionName,
	decimal Latitude,
	decimal Longitude,
	int? AssignedUserId,
	string? AssignedUserFullName,
	string? AssignedUserServiceId,
	bool IsSimulatedDown
);

public record DeviceQueryParams(
	int Page = 1,
	int PageSize = 20,
	DeviceStatus? Status = null,
	int? LEAId = null,
	int? AssignedUserId = null,
	string? SortBy = null,
	string? Order = "asc"
);

public record PagedResult<T>(
	IEnumerable<T> Data,
	int TotalCount,
	int Page,
	int PageSize
);

public record AlarmQueryParams(
	bool? IsActive = null,
	DateTime? DateFrom = null,
	DateTime? DateTo = null,
	int? DeviceId = null,
	string? SortBy = null,
	string? Order = "desc"
);

public record AlarmListDto(
	int AlarmId,
	int DeviceId,
	string AlarmType,
	DateTime RaisedTime,
	DateTime? ClearedTime,
	bool IsActive
);
