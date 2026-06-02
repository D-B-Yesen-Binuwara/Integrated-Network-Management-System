using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace INMS.Domain.Entities
{
    public class NetworkNode
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Type { get; set; } = string.Empty; // SLBN, CEAN, MSAN

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "Active"; // Active, Down, Maintenance
    }
}