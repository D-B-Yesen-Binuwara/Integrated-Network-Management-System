using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace INMS.Domain.Entities
{
    public class FailureEvent
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int NodeId { get; set; } // Foreign key to NetworkNode

        [ForeignKey("NodeId")]
        public NetworkNode? Node { get; set; }

        [Required]
        public DateTime Timestamp { get; set; }

        [Required]
        [MaxLength(20)]
        public string Severity { get; set; } = "Low"; // Low, Medium, High, Critical

        [MaxLength(500)]
        public string Description { get; set; } = string.Empty;
    }
}