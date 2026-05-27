using System.ComponentModel.DataAnnotations;

namespace INMS.Domain.Entities;

public class User
{
    [Key]
    public int UserId { get; set; }

    [Required]
    [MaxLength(100)]
    public string Username { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    [MaxLength(150)]
    public string FullName { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? ServiceId { get; set; }

    [MaxLength(150)]
    public string? Email { get; set; }

    public int RoleId { get; set; }
    public Role? Role { get; set; }
}
