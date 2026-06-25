using INMS.Domain.Entities;

namespace INMS.Domain.Interfaces
{
    public interface IUserRepository
    {
        Task<List<User>> GetAll();
        Task<User?> GetById(int id);

        /// <summary>
        /// Look up a single user by email address (case-insensitive).
        /// Returns null if not found.
        /// </summary>
        Task<User?> GetByEmail(string email);

        Task Create(User user);
        Task Update(User user);
        Task Delete(int id);
    }
}