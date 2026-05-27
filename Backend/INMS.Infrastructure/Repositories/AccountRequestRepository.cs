using INMS.Domain.Entities;
using INMS.Domain.Interfaces;
using INMS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace INMS.Infrastructure.Repositories;

public class AccountRequestRepository : IAccountRequestRepository
{
    private readonly AppDbContext _context;

    public AccountRequestRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task Create(AccountRequest request)
    {
        _context.AccountRequests.Add(request);
        await _context.SaveChangesAsync();
    }

    public async Task<List<AccountRequest>> GetAll()
    {
        return await _context.AccountRequests
            .Include(r => r.Role)
            .Include(r => r.Region)
            .Include(r => r.Province)
            .Include(r => r.LEA)
            .OrderByDescending(r => r.RequestedAt)
            .ToListAsync();
    }

    public async Task<AccountRequest?> GetById(int id)
    {
        return await _context.AccountRequests.FindAsync(id);
    }

    public async Task UpdateStatus(AccountRequest request)
    {
        _context.AccountRequests.Update(request);
        await _context.SaveChangesAsync();
    }
}
