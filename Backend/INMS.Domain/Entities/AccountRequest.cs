using System.ComponentModel.DataAnnotations;

namespace INMS.Domain.Entities;

public class AccountRequest
{
    [Key]
    public int RequestId { get; set; }

    [Required, MaxLength(150)]
    public string FullName { get; set; } = string.Empty;

    [Required, MaxLength(150)]
    public string Email { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    public string ServiceId { get; set; } = string.Empty;

    [Required]
    public int RoleId { get; set; }
    public Role? Role { get; set; }

    [Required]
    public int RegionId { get; set; }
    public Region? Region { get; set; }

    public int? ProvinceId { get; set; }
    public Province? Province { get; set; }

    public int? LEAId { get; set; }
    public LEA? LEA { get; set; }

    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;

    [MaxLength(20)]
    public string Status { get; set; } = "PENDING"; // PENDING | APPROVED | REJECTED
}
