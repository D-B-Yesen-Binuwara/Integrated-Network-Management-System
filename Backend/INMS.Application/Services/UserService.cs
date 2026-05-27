using INMS.Domain.Entities;
using INMS.Domain.Interfaces;
using INMS.Application.DTOs;
using System.Security.Cryptography;
using System.Text;

namespace INMS.Application.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _repository;
    private readonly UserAreaAssignmentService _areaAssignmentService;
    private readonly IUserAreaAssignmentRepository _areaAssignmentRepository;
    private readonly IRegionRepository _regionRepository;
    private readonly IProvinceRepository _provinceRepository;
    private readonly ILEARepository _leaRepository;

    public UserService(
        IUserRepository repository,
        UserAreaAssignmentService areaAssignmentService,
        IUserAreaAssignmentRepository areaAssignmentRepository,
        IRegionRepository regionRepository,
        IProvinceRepository provinceRepository,
        ILEARepository leaRepository)
    {
        _repository = repository;
        _areaAssignmentService = areaAssignmentService;
        _areaAssignmentRepository = areaAssignmentRepository;
        _regionRepository = regionRepository;
        _provinceRepository = provinceRepository;
        _leaRepository = leaRepository;
    }

    public async Task<List<UserResponseDto>> GetAll()
    {
        var users = await _repository.GetAll();
        var regions = (await _regionRepository.GetAllAsync()).ToDictionary(r => r.RegionId, r => r.Name);
        var provinces = (await _provinceRepository.GetAllAsync()).ToDictionary(p => p.ProvinceId, p => p.Name);
        var leas = (await _leaRepository.GetAllAsync()).ToDictionary(l => l.LEAId, l => l.Name);

        var result = new List<UserResponseDto>();
        foreach (var user in users)
        {
            var assignments = await _areaAssignmentRepository.GetAllByUserId(user.UserId);
            var regionId = assignments.FirstOrDefault(a => a.AreaType == "Region")?.AreaId;
            var provinceId = assignments.FirstOrDefault(a => a.AreaType == "Province")?.AreaId;
            var leaId = assignments.FirstOrDefault(a => a.AreaType == "LEA")?.AreaId;

            result.Add(new UserResponseDto(
                user.UserId,
                user.Username,
                user.FullName,
                user.RoleId,
                user.Role?.RoleName,
                user.ServiceId,
                user.Email,
                regionId.HasValue && regions.TryGetValue(regionId.Value, out var rName) ? rName : null,
                provinceId.HasValue && provinces.TryGetValue(provinceId.Value, out var pName) ? pName : null,
                leaId.HasValue && leas.TryGetValue(leaId.Value, out var lName) ? lName : null
            ));
        }
        return result;
    }

    public async Task<User> GetById(int id)
    {
        return (await _repository.GetById(id))!;
    }

    public async Task Create(string username, string password, int roleId)
    {
        var user = new User
        {
            Username = username,
            PasswordHash = HashPassword(password),
            RoleId = roleId
        };

        await _repository.Create(user);
    }

    /// <summary>
    /// Create a new user from DTO with name combination, username generation, and area assignment.
    /// </summary>
    public async Task CreateFromDto(CreateUserDto dto)
    {
        // Combine first name and last name into FullName
        var fullName = $"{dto.FirstName} {dto.LastName}".Trim();

        // Generate unique username from first.last format
        var generatedUsername = GenerateUniqueUsername(dto.FirstName, dto.LastName);

        // Create user with generated username and a default hashed password
        var user = new User
        {
            Username = generatedUsername,
            PasswordHash = HashPassword("DefaultPassword123!"), // Default password - should be changed by user
            FullName = fullName,
            RoleId = dto.RoleId,
            ServiceId = dto.ServiceId,
            Email = dto.Email
        };

        await _repository.Create(user);

        // Assign areas if provided
        if (dto.RegionId.HasValue)
        {
            await _areaAssignmentService.AssignArea(user.UserId, "Region", dto.RegionId.Value);
        }

        if (dto.ProvinceId.HasValue)
        {
            await _areaAssignmentService.AssignArea(user.UserId, "Province", dto.ProvinceId.Value);
        }

        if (dto.LEAId.HasValue)
        {
            await _areaAssignmentService.AssignArea(user.UserId, "LEA", dto.LEAId.Value);
        }
    }

    public async Task Update(int id, string username, int roleId)
    {
        var user = await _repository.GetById(id);

        user!.Username = username;
        user.RoleId = roleId;

        await _repository.Update(user);
    }

    public async Task Delete(int id)
    {
        await _repository.Delete(id);
    }

    /// <summary>
    /// Generate a unique username in format: firstname.lastname
    /// If username exists, append a number (e.g., firstname.lastname1)
    /// </summary>
    private async Task<string> GenerateUniqueUsernameAsync(string firstName, string lastName)
    {
        var baseName = $"{firstName}.{lastName}".ToLower().Replace(" ", "");
        var username = baseName;
        int counter = 1;

        // Check if username exists, keep incrementing until unique
        while (await UsernameExistsAsync(username))
        {
            username = $"{baseName}{counter}";
            counter++;
        }

        return username;
    }

    /// <summary>
    /// Synchronous username generation (used when repository doesn't support async lookup efficiently)
    /// </summary>
    private string GenerateUniqueUsername(string firstName, string lastName)
    {
        var baseName = $"{firstName}.{lastName}".ToLower().Replace(" ", "");
        var username = baseName;
        int counter = 1;

        // Check if username exists, keep incrementing until unique
        while (UsernameExists(username))
        {
            username = $"{baseName}{counter}";
            counter++;
        }

        return username;
    }

    /// <summary>
    /// Check if a username already exists (synchronous version)
    /// </summary>
    private bool UsernameExists(string username)
    {
        var allUsers = _repository.GetAll().Result;
        return allUsers.Any(u => u.Username.ToLower() == username.ToLower());
    }

    private async Task<bool> UsernameExistsAsync(string username)
    {
        var allUsers = await _repository.GetAll();
        return allUsers.Any(u => u.Username.ToLower() == username.ToLower());
    }

    private string HashPassword(string password)
    {
        using SHA256 sha = SHA256.Create();
        var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(bytes);
    }
}