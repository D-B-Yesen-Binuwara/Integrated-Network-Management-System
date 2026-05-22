using INMS.Domain.Entities;
using INMS.Domain.Interfaces;
using INMS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace INMS.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly AppDbContext _context;

    public UserRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<User>> GetAll()
    {
        return await _context.Users.Include(u => u.Role).ToListAsync();
    }

    public async Task<User?> GetById(int id)
    {
        return await _context.Users.Include(u => u.Role)
            .FirstOrDefaultAsync(x => x.UserId == id);
    }

    public async Task Create(User user)
    {
        _context.Users.Add(user);
        await _context.SaveChangesAsync();
    }

    public async Task Update(User user)
    {
        _context.Users.Update(user);
        await _context.SaveChangesAsync();
    }

    public async Task Delete(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user != null)
        {
            var assignments = await _context.UserAreaAssignments
                .Where(a => a.UserId == id).ToListAsync();
            _context.UserAreaAssignments.RemoveRange(assignments);
            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
        }
    }
}
