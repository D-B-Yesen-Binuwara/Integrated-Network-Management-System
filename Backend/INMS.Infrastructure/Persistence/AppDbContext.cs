using Microsoft.EntityFrameworkCore;
using INMS.Domain.Entities;

namespace INMS.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options) { }

    public DbSet<Device> Devices { get; set; }
    public DbSet<DeviceLink> DeviceLinks { get; set; }
    public DbSet<DeviceVendor> DeviceVendors { get; set; }
    public DbSet<Region> Regions { get; set; }
    public DbSet<Province> Provinces { get; set; }
    public DbSet<LEA> LEAs { get; set; }
    public DbSet<Alarm> Alarms { get; set; }
    public DbSet<RootCause> RootCauses { get; set; }
    public DbSet<ImpactedDevice> ImpactedDevices { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<Role> Roles { get; set; }
    public DbSet<UserAreaAssignment> UserAreaAssignments { get; set; }
    public DbSet<Heartbeat> Heartbeats { get; set; }
    public DbSet<SimulationEvent> SimulationEvents { get; set; }
    public DbSet<AccountRequest> AccountRequests { get; set; }
    public DbSet<Vendor> Vendors { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Device>().ToTable("Device");
        modelBuilder.Entity<DeviceVendor>().ToTable("DeviceVendor");
        modelBuilder.Entity<Region>().ToTable("Region");
        modelBuilder.Entity<Province>().ToTable("Province");
        modelBuilder.Entity<LEA>().ToTable("LEA");
        modelBuilder.Entity<Alarm>().ToTable("Alarm");
        modelBuilder.Entity<DeviceLink>().ToTable("DeviceLink");
        modelBuilder.Entity<RootCause>().ToTable("RootCause");
        modelBuilder.Entity<ImpactedDevice>().ToTable("ImpactedDevice");
        modelBuilder.Entity<User>().ToTable("User");
        modelBuilder.Entity<Role>().ToTable("Role");
        modelBuilder.Entity<UserAreaAssignment>().ToTable("UserAreaAssignment");

        modelBuilder.Entity<Device>()
            .Property(d => d.PriorityLevel)
            .HasConversion<string>();

        modelBuilder.Entity<Device>()
            .Property(d => d.DeviceType)
            .HasConversion<string>();

        modelBuilder.Entity<Device>()
            .Property(d => d.Status)
            .HasConversion<string>();

        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Device>()
            .HasOne(d => d.AssignedUser)
            .WithMany()
            .HasForeignKey(d => d.AssignedUserId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<DeviceLink>()
            .HasOne(dl => dl.ParentDevice)
            .WithMany()
            .HasForeignKey(dl => dl.ParentDeviceId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<DeviceLink>()
            .HasOne(dl => dl.ChildDevice)
            .WithMany()
            .HasForeignKey(dl => dl.ChildDeviceId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Role>()
            .Property(r => r.RoleName)
            .HasColumnName("Name");
            
        modelBuilder.Entity<Vendor>().ToTable("Vendor");
        modelBuilder.Entity<Heartbeat>().ToTable("Heartbeat");
        modelBuilder.Entity<SimulationEvent>().ToTable("SimulationEvent");
        modelBuilder.Entity<AccountRequest>().ToTable("AccountRequest");

        // Vendor configuration
        modelBuilder.Entity<Vendor>()
            .Property(v => v.DeviceType)
            .HasConversion<string>();

        // DeviceVendor relationships
        modelBuilder.Entity<DeviceVendor>()
            .HasOne(dv => dv.Device)
            .WithMany(d => d.DeviceVendors)
            .HasForeignKey(dv => dv.DeviceId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<DeviceVendor>()
            .HasOne(dv => dv.Vendor)
            .WithMany(v => v.DeviceVendors)
            .HasForeignKey(dv => dv.VendorId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<DeviceVendor>()
            .HasOne(dv => dv.AssignedByUser)
            .WithMany()
            .HasForeignKey(dv => dv.AssignedBy)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
