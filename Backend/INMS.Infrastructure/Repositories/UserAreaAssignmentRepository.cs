using INMS.Domain.Entities;
using INMS.Domain.Interfaces;
using INMS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace INMS.Infrastructure.Repositories;

public class UserAreaAssignmentRepository : IUserAreaAssignmentRepository
{
    private readonly AppDbContext _context;

    public UserAreaAssignmentRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<UserAreaAssignment>> GetAllByUserId(int userId)
    {
        return await _context.UserAreaAssignments
            .Where(x => x.UserId == userId)
            .ToListAsync();
    }

    public async Task<UserAreaAssignment?> GetByUserId(int userId)
    {
        return await _context.UserAreaAssignments
            .FirstOrDefaultAsync(x => x.UserId == userId);
    }

    public async Task Create(UserAreaAssignment assignment)
    {
        _context.UserAreaAssignments.Add(assignment);
        await _context.SaveChangesAsync();
    }
}
