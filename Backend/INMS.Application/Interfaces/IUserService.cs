using INMS.Domain.Entities;
using INMS.Application.DTOs;

namespace INMS.Application.Services;

public interface IUserService
{
    Task<List<UserResponseDto>> GetAll();
    Task<User> GetById(int id);
    Task Create(string username, string password, int roleId);
    Task CreateFromDto(CreateUserDto dto);
    Task Update(int id, string username, int roleId);
    Task Delete(int id);
}