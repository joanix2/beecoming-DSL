using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace opteeam_api.Migrations
{
    /// <inheritdoc />
    public partial class remove_1X1_relation_mission_teamleader : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Missions_AspNetUsers_TeamLeaderId",
                table: "Missions");

            migrationBuilder.DropIndex(
                name: "IX_Missions_TeamLeaderId",
                table: "Missions");

            migrationBuilder.DropColumn(
                name: "TeamLeaderId",
                table: "Missions");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "TeamLeaderId",
                table: "Missions",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Missions_TeamLeaderId",
                table: "Missions",
                column: "TeamLeaderId");

            migrationBuilder.AddForeignKey(
                name: "FK_Missions_AspNetUsers_TeamLeaderId",
                table: "Missions",
                column: "TeamLeaderId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");
        }
    }
}
