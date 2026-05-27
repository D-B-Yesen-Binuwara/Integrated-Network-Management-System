using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using INMS.Domain.Enums;

namespace INMS.Domain.Entities
{
    public class Device
    {
        [Key]
        public int DeviceId { get; set; }

        [Required]
        [MaxLength(100)]
        public string DeviceName { get; set; } = string.Empty;

        [Required]
        public DeviceType DeviceType { get; set; }

        [Required]
        [MaxLength(50)]
        public string IP { get; set; } = string.Empty;

        [Required]
        public DeviceStatus Status { get; set; } = DeviceStatus.UP;

        [Required]
        public PriorityLevel PriorityLevel { get; set; } = PriorityLevel.Low;

        [Required]
        [Range(-90, 90, ErrorMessage = "Latitude must be between -90 and 90")]
        public decimal Latitude { get; set; }

        [Required]
        [Range(-180, 180, ErrorMessage = "Longitude must be between -180 and 180")]
        public decimal Longitude { get; set; }

        [ForeignKey("LEA")]
        public int LEAId { get; set; }

        // Navigation property to LEA
        public LEA? LEA { get; set; }

        // Remove direct vendor relationship - now many-to-many
        // public int? VendorId { get; set; }
        // public Vendor? Vendor { get; set; }

        public int? AssignedUserId { get; set; }
        public User? AssignedUser { get; set; }

        public bool IsSimulatedDown { get; set; } = false;

        // Many-to-many relationship with vendors
        public ICollection<DeviceVendor> DeviceVendors { get; set; } = new List<DeviceVendor>();
    }
}