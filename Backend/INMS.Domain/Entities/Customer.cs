using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace INMS.Domain.Entities
{
    public class Customer
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        public int MSANId { get; set; } // Foreign key to NetworkNode

        [ForeignKey("MSANId")]
        public NetworkNode? MSAN { get; set; }
    }
}