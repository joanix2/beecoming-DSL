using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace opteeam_api.Migrations
{
    /// <inheritdoc />
    public partial class nullable_teamleaderId_affectation_Missions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AffectationMissionXTeamLeaders_AspNetUsers_TeamLeaderId",
                table: "AffectationMissionXTeamLeaders");

            migrationBuilder.AlterColumn<Guid>(
                name: "TeamLeaderId",
                table: "AffectationMissionXTeamLeaders",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddForeignKey(
                name: "FK_AffectationMissionXTeamLeaders_AspNetUsers_TeamLeaderId",
                table: "AffectationMissionXTeamLeaders",
                column: "TeamLeaderId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AffectationMissionXTeamLeaders_AspNetUsers_TeamLeaderId",
                table: "AffectationMissionXTeamLeaders");

            migrationBuilder.AlterColumn<Guid>(
                name: "TeamLeaderId",
                table: "AffectationMissionXTeamLeaders",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_AffectationMissionXTeamLeaders_AspNetUsers_TeamLeaderId",
                table: "AffectationMissionXTeamLeaders",
                column: "TeamLeaderId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
