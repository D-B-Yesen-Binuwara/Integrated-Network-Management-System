using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using INMS.Infrastructure.Persistence;
using INMS.Domain.Interfaces;
using INMS.Infrastructure.Repositories;
using INMS.Application.Services;
using INMS.Application.Interfaces;
using INMS.API.BackgroundServices;
using Microsoft.OpenApi.Models;

// Load .env file into environment variables
var envPath = Path.Combine(Directory.GetCurrentDirectory(), ".env");
if (File.Exists(envPath))
    foreach (var line in File.ReadAllLines(envPath)
        .Where(l => !string.IsNullOrWhiteSpace(l) && !l.StartsWith('#') && l.Contains('=')))
    {
        var parts = line.Split('=', 2);
        var key = parts[0].Trim().Replace(":", "__");
        Environment.SetEnvironmentVariable(key, parts[1].Trim());
    }

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"), sqlOptions =>
    {
        sqlOptions.CommandTimeout(60);
        sqlOptions.EnableRetryOnFailure(3, TimeSpan.FromSeconds(5), null);
    })
    .EnableSensitiveDataLogging(builder.Environment.IsDevelopment())
    .EnableDetailedErrors(builder.Environment.IsDevelopment()));

builder.Services.AddScoped<IDeviceRepository, DeviceRepository>();
builder.Services.AddScoped<IDeviceService, DeviceService>();
builder.Services.AddScoped<IDeviceLinkRepository, DeviceLinkRepository>();
builder.Services.AddScoped<IDeviceLinkService, DeviceLinkService>();
builder.Services.AddScoped<IRegionRepository, RegionRepository>();
builder.Services.AddScoped<IRegionService, RegionService>();
builder.Services.AddScoped<IProvinceRepository, ProvinceRepository>();
builder.Services.AddScoped<IProvinceService, ProvinceService>();
builder.Services.AddScoped<ILEARepository, LEARepository>();
builder.Services.AddScoped<ILEAService, LEAService>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IAccountRequestRepository, AccountRequestRepository>();
builder.Services.AddScoped<IAccountRequestService, AccountRequestService>();
builder.Services.AddScoped<IRoleRepository, RoleRepository>();
builder.Services.AddScoped<IRoleService, RoleService>();
builder.Services.AddScoped<IUserAreaAssignmentRepository, UserAreaAssignmentRepository>();
builder.Services.AddScoped<UserAreaAssignmentService>();
builder.Services.AddScoped<IImpactAnalysisService, EnhancedImpactAnalysisService>();

builder.Services.AddScoped<IAlarmRepository, AlarmRepository>();
builder.Services.AddScoped<IAlarmService, AlarmService>();

builder.Services.AddScoped<IHeartbeatRepository, HeartbeatRepository>();
builder.Services.AddScoped<IHeartbeatService, HeartbeatService>();

builder.Services.AddScoped<ISimulationEventRepository, SimulationEventRepository>();
builder.Services.AddScoped<ISimulationEventService, SimulationEventService>();

builder.Services.AddHttpClient();
builder.Services.AddScoped<IChatService, ChatService>();

// DeviceVendor Services
builder.Services.AddScoped<IDeviceVendorRepository, DeviceVendorRepository>();
builder.Services.AddScoped<IDeviceVendorService, DeviceVendorService>();

// Vendor Services
builder.Services.AddScoped<IVendorRepository, VendorRepository>();
builder.Services.AddScoped<IVendorService, VendorService>();

// Vendor Statistics Services
builder.Services.AddScoped<IVendorStatsService, VendorStatsService>();

// Background Services
builder.Services.AddHostedService<HeartbeatSchedulerService>();
builder.Services.AddHostedService<HeartbeatFailureDetectionService>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes("ThisIsMySuperSecretKey12345ThisIsMySuperSecretKey12345"))
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });

    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter JWT Token"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Create the database and schema automatically for first-time container startup.
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    dbContext.Database.EnsureCreated();
    await EnsureCompatibilitySchemaAsync(dbContext);
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.UseHttpsRedirection();
app.MapControllers();

app.Run();

static Task EnsureCompatibilitySchemaAsync(AppDbContext dbContext)
{
    const string sql = """
        IF COL_LENGTH('dbo.[User]', 'ServiceId') IS NULL
        BEGIN
            ALTER TABLE dbo.[User] ADD ServiceId NVARCHAR(50) NULL;
        END;

        IF COL_LENGTH('dbo.[User]', 'Email') IS NULL
        BEGIN
            ALTER TABLE dbo.[User] ADD Email NVARCHAR(150) NULL;
        END;

        IF COL_LENGTH('dbo.[Role]', 'Description') IS NULL
        BEGIN
            ALTER TABLE dbo.[Role] ADD Description NVARCHAR(255) NULL;
        END;

        IF COL_LENGTH('dbo.[Region]', 'Description') IS NULL
        BEGIN
            ALTER TABLE dbo.[Region] ADD Description NVARCHAR(255) NULL;
        END;
        """;

    return dbContext.Database.ExecuteSqlRawAsync(sql);
}
