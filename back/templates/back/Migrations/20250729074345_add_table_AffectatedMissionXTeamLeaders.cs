using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace opteeam_api.Migrations
{
    /// <inheritdoc />
    public partial class add_table_AffectatedMissionXTeamLeaders : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AffectationMissionXTeamLeaders",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MissionId = table.Column<Guid>(type: "uuid", nullable: false),
                    TeamLeaderId = table.Column<Guid>(type: "uuid", nullable: false),
                    AssignatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AffectationMissionXTeamLeaders", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AffectationMissionXTeamLeaders_AspNetUsers_TeamLeaderId",
                        column: x => x.TeamLeaderId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AffectationMissionXTeamLeaders_Missions_MissionId",
                        column: x => x.MissionId,
                        principalTable: "Missions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AffectationMissionXTeamLeaders_MissionId",
                table: "AffectationMissionXTeamLeaders",
                column: "MissionId");

            migrationBuilder.CreateIndex(
                name: "IX_AffectationMissionXTeamLeaders_TeamLeaderId",
                table: "AffectationMissionXTeamLeaders",
                column: "TeamLeaderId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AffectationMissionXTeamLeaders");
        }
    }
}
