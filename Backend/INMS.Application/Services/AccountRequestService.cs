using INMS.Application.DTOs;
using INMS.Application.Interfaces;
using INMS.Domain.Entities;
using INMS.Domain.Interfaces;
using INMS.Infrastructure.Persistence;
using System.Security.Cryptography;
using System.Text;

namespace INMS.Application.Services;

public class AccountRequestService : IAccountRequestService
{
    private readonly IAccountRequestRepository _repository;
    private readonly AppDbContext _context;

    public AccountRequestService(IAccountRequestRepository repository, AppDbContext context)
    {
        _repository = repository;
        _context = context;
    }

    public async Task Submit(CreateAccountRequestDto dto)
    {
        var request = new AccountRequest
        {
            FullName = dto.FullName,
            Email = dto.Email,
            ServiceId = dto.ServiceId,
            RoleId = dto.RoleId,
            RegionId = dto.RegionId,
            ProvinceId = dto.ProvinceId,
            LEAId = dto.LEAId
        };

        await _repository.Create(request);
    }

    public async Task<List<AccountRequestResponseDto>> GetAll()
    {
        var requests = await _repository.GetAll();
        return requests.Select(r => new AccountRequestResponseDto(
            r.RequestId,
            r.FullName,
            r.Email,
            r.ServiceId,
            r.RoleId,
            r.Role?.RoleName,
            r.RegionId,
            r.Region?.Name,
            r.ProvinceId,
            r.Province?.Name,
            r.LEAId,
            r.LEA?.Name,
            r.RequestedAt,
            r.Status
        )).ToList();
    }

    public async Task<bool> Approve(int requestId)
    {
        var request = await _repository.GetById(requestId);
        if (request == null || request.Status != "PENDING") return false;

        if (_context.Users.Any(u => u.Email == request.Email))
            throw new Exception("User already exists");

        var user = new User
        {
            Username = request.Email,
            PasswordHash = HashPassword(request.ServiceId),
            FullName = request.FullName,
            Email = request.Email,
            ServiceId = request.ServiceId,
            RoleId = request.RoleId
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        request.Status = "APPROVED";
        await _repository.UpdateStatus(request);
        return true;
    }

    public async Task<bool> Reject(int requestId)
    {
        var request = await _repository.GetById(requestId);
        if (request == null || request.Status != "PENDING") return false;

        request.Status = "REJECTED";
        await _repository.UpdateStatus(request);
        return true;
    }

    private static string HashPassword(string password)
    {
        using var sha = SHA256.Create();
        return Convert.ToBase64String(sha.ComputeHash(Encoding.UTF8.GetBytes(password)));
    }
}
