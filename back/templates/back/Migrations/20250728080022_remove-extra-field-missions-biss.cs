using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace opteeam_api.Migrations
{
    /// <inheritdoc />
    public partial class removeextrafieldmissionsbiss : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Missions_AspNetUsers_ApplicationUserId",
                table: "Missions");

            migrationBuilder.DropForeignKey(
                name: "FK_Missions_AspNetUsers_TeamLeaderId",
                table: "Missions");

            migrationBuilder.DropIndex(
                name: "IX_Missions_ApplicationUserId",
                table: "Missions");

            migrationBuilder.DropColumn(
                name: "ApplicationUserId",
                table: "Missions");

            migrationBuilder.AddForeignKey(
                name: "FK_Missions_AspNetUsers_TeamLeaderId",
                table: "Missions",
                column: "TeamLeaderId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Missions_AspNetUsers_TeamLeaderId",
                table: "Missions");

            migrationBuilder.AddColumn<Guid>(
                name: "ApplicationUserId",
                table: "Missions",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Missions_ApplicationUserId",
                table: "Missions",
                column: "ApplicationUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Missions_AspNetUsers_ApplicationUserId",
                table: "Missions",
                column: "ApplicationUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Missions_AspNetUsers_TeamLeaderId",
                table: "Missions",
                column: "TeamLeaderId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
