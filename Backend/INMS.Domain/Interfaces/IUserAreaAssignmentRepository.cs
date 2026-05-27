using INMS.Domain.Entities;

namespace INMS.Domain.Interfaces
{
    public interface IUserAreaAssignmentRepository
    {
        Task<List<UserAreaAssignment>> GetAllByUserId(int userId);
        Task<UserAreaAssignment?> GetByUserId(int userId);
        Task Create(UserAreaAssignment assignment);
    }
}
