using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace INMS.Domain.Entities
{
    public class DeviceVendor
    {
        [Key]
        public int DeviceVendorId { get; set; }

        [Required]
        public int DeviceId { get; set; }
        public Device Device { get; set; } = null!;

        [Required]
        public int VendorId { get; set; }
        public Vendor Vendor { get; set; } = null!;

        public DateTime AssignedDate { get; set; } = DateTime.UtcNow;

        public bool IsActive { get; set; } = true;

        // User audit trail
        public int? AssignedBy { get; set; }
        public User? AssignedByUser { get; set; }

        [MaxLength(500)]
        public string? Notes { get; set; }
    }
}