using INMS.Application.DTOs;

namespace INMS.Application.Interfaces;

public interface IAccountRequestService
{
    Task Submit(CreateAccountRequestDto dto);
    Task<List<AccountRequestResponseDto>> GetAll();
    Task<bool> Approve(int requestId);
    Task<bool> Reject(int requestId);
}
