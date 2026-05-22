using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using INMS.Domain.Enums;

namespace INMS.Domain.Entities
{
    public class Vendor
    {
        [Key]
        public int VendorId { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Brand { get; set; } = string.Empty;

        [Required]
        public DeviceType DeviceType { get; set; }

        [MaxLength(255)]
        public string? Description { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; }

        // Many-to-many relationship with devices
        public ICollection<DeviceVendor> DeviceVendors { get; set; } = new List<DeviceVendor>();
    }
}
