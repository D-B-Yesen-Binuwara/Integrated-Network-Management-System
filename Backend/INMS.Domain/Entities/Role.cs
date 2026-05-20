using System.ComponentModel.DataAnnotations;

namespace INMS.Domain.Entities
{
    public class Role
    {
        [Key]
        public int RoleId { get; set; }

        [Required]
        [MaxLength(50)]
        public string RoleName { get; set; } = string.Empty;

        [MaxLength(255)]
        public string? Description { get; set; }

        // Indicates whether this role is a platform admin (MSAN/CEAN/SLBN)
        public bool IsPlatformAdmin { get; set; } = false;
    }
}
