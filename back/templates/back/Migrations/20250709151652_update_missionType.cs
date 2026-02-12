using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace opteeam_api.Migrations
{
    /// <inheritdoc />
    public partial class update_missionType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "OrderTypeId",
                table: "MissionTypes",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_MissionTypes_OrderTypeId",
                table: "MissionTypes",
                column: "OrderTypeId");

            migrationBuilder.AddForeignKey(
                name: "FK_MissionTypes_OrderTypes_OrderTypeId",
                table: "MissionTypes",
                column: "OrderTypeId",
                principalTable: "OrderTypes",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MissionTypes_OrderTypes_OrderTypeId",
                table: "MissionTypes");

            migrationBuilder.DropIndex(
                name: "IX_MissionTypes_OrderTypeId",
                table: "MissionTypes");

            migrationBuilder.DropColumn(
                name: "OrderTypeId",
                table: "MissionTypes");
        }
    }
}
