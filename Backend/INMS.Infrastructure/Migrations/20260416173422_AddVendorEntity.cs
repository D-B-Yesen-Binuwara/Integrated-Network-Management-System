using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace INMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddVendorEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Device_User_AssignedUserId",
                table: "Device");

            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "User",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ServiceId",
                table: "User",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "VendorId",
                table: "Device",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "AccountRequest",
                columns: table => new
                {
                    RequestId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FullName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    ServiceId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    RoleId = table.Column<int>(type: "int", nullable: false),
                    RegionId = table.Column<int>(type: "int", nullable: false),
                    ProvinceId = table.Column<int>(type: "int", nullable: true),
                    LEAId = table.Column<int>(type: "int", nullable: true),
                    RequestedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AccountRequest", x => x.RequestId);
                    table.ForeignKey(
                        name: "FK_AccountRequest_LEA_LEAId",
                        column: x => x.LEAId,
                        principalTable: "LEA",
                        principalColumn: "LEAId");
                    table.ForeignKey(
                        name: "FK_AccountRequest_Province_ProvinceId",
                        column: x => x.ProvinceId,
                        principalTable: "Province",
                        principalColumn: "ProvinceId");
                    table.ForeignKey(
                        name: "FK_AccountRequest_Region_RegionId",
                        column: x => x.RegionId,
                        principalTable: "Region",
                        principalColumn: "RegionId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AccountRequest_Role_RoleId",
                        column: x => x.RoleId,
                        principalTable: "Role",
                        principalColumn: "RoleId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Vendors",
                columns: table => new
                {
                    VendorId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Brand = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    DeviceType = table.Column<int>(type: "int", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Vendors", x => x.VendorId);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Device_VendorId",
                table: "Device",
                column: "VendorId");

            migrationBuilder.CreateIndex(
                name: "IX_AccountRequest_LEAId",
                table: "AccountRequest",
                column: "LEAId");

            migrationBuilder.CreateIndex(
                name: "IX_AccountRequest_ProvinceId",
                table: "AccountRequest",
                column: "ProvinceId");

            migrationBuilder.CreateIndex(
                name: "IX_AccountRequest_RegionId",
                table: "AccountRequest",
                column: "RegionId");

            migrationBuilder.CreateIndex(
                name: "IX_AccountRequest_RoleId",
                table: "AccountRequest",
                column: "RoleId");

            migrationBuilder.AddForeignKey(
                name: "FK_Device_User_AssignedUserId",
                table: "Device",
                column: "AssignedUserId",
                principalTable: "User",
                principalColumn: "UserId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Device_Vendors_VendorId",
                table: "Device",
                column: "VendorId",
                principalTable: "Vendors",
                principalColumn: "VendorId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Device_User_AssignedUserId",
                table: "Device");

            migrationBuilder.DropForeignKey(
                name: "FK_Device_Vendors_VendorId",
                table: "Device");

            migrationBuilder.DropTable(
                name: "AccountRequest");

            migrationBuilder.DropTable(
                name: "Vendors");

            migrationBuilder.DropIndex(
                name: "IX_Device_VendorId",
                table: "Device");

            migrationBuilder.DropColumn(
                name: "Email",
                table: "User");

            migrationBuilder.DropColumn(
                name: "ServiceId",
                table: "User");

            migrationBuilder.DropColumn(
                name: "VendorId",
                table: "Device");

            migrationBuilder.AddForeignKey(
                name: "FK_Device_User_AssignedUserId",
                table: "Device",
                column: "AssignedUserId",
                principalTable: "User",
                principalColumn: "UserId");
        }
    }
}
