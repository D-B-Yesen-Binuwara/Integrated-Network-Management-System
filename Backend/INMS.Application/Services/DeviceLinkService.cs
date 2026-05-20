using INMS.Application.Interfaces;
using INMS.Domain.Entities;
using INMS.Domain.Enums;
using INMS.Domain.Interfaces;
using INMS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace INMS.Application.Services
{
    public class DeviceLinkService : IDeviceLinkService
    {
        private readonly IDeviceLinkRepository _repository;
        private readonly AppDbContext _context;

        public DeviceLinkService(IDeviceLinkRepository repository, AppDbContext context)
        {
            _repository = repository;
            _context = context;
        }

        // Validates topology and cycle safety, then creates the device link.
        public async Task<DeviceLink> CreateLinkAsync(int parentId, int childId)
        {
            if (parentId == childId)
                throw new Exception("Parent and child cannot be same");

            var parent = await _context.Devices.FindAsync(parentId);
            var child = await _context.Devices.FindAsync(childId);

            if (parent == null || child == null)
                throw new Exception("Device not found");

            if (parent.IsDeleted || child.IsDeleted)
                throw new Exception("Cannot create link involving a deleted device");

            if (!IsValidTopology(parent.DeviceType, child.DeviceType))
                throw new Exception("Invalid topology: Parent-child relationship not allowed");

            if (await WouldCreateCycleAsync(parentId, childId))
                throw new Exception("Cycle detected: this link would create a circular dependency");

            var link = new DeviceLink
            {
                ParentDeviceId = parentId,
                ChildDeviceId = childId,
                LinkStatus = "UP"
            };

            return await _repository.AddAsync(link);
        }

        // Returns all device links.
        public async Task<List<DeviceLink>> GetAllLinksAsync()
        {
            return await _repository.GetAllAsync();
        }

        // Deletes a device link by id.
        public async Task DeleteLinkAsync(int id)
        {
            await _repository.DeleteAsync(id);
        }

        // Uses a recursive CTE to check if childId is already an ancestor of parentId.
        private async Task<bool> WouldCreateCycleAsync(int parentId, int childId)
        {
            var sql = @"WITH Ancestors AS (
                    SELECT ParentDeviceId AS AncestorId
                    FROM DeviceLink
                    WHERE ChildDeviceId = {0}
                    UNION ALL
                    SELECT dl.ParentDeviceId
                    FROM DeviceLink dl
                    INNER JOIN Ancestors a ON dl.ChildDeviceId = a.AncestorId
                )
                SELECT CAST(CASE WHEN EXISTS (SELECT 1 FROM Ancestors WHERE AncestorId = {1}) THEN 1 ELSE 0 END AS BIT)
                OPTION (MAXRECURSION 1000)";

            return await _context.Database.SqlQueryRaw<bool>(sql, parentId, childId).FirstAsync();
        }

        // Enforces allowed parent-child device type combinations.
        private bool IsValidTopology(DeviceType parentType, DeviceType childType)
        {
            // Topology policy (root → leaf):
            // SLBN -> CEAN
            // CEAN -> MSAN
            // MSAN -> none (leaf)
            return parentType switch
            {
                DeviceType.SLBN => childType == DeviceType.CEAN,
                DeviceType.CEAN => childType == DeviceType.MSAN,
                DeviceType.MSAN => false,
                _ => false
            };
        }
    }
}
