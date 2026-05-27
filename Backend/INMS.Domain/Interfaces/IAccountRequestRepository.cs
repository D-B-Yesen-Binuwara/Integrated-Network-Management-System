using INMS.Domain.Entities;

namespace INMS.Domain.Interfaces;

public interface IAccountRequestRepository
{
    Task Create(AccountRequest request);
    Task<List<AccountRequest>> GetAll();
    Task<AccountRequest?> GetById(int id);
    Task UpdateStatus(AccountRequest request);
}
