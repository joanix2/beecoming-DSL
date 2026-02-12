using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace opteeam_api.Migrations
{
    /// <inheritdoc />
    public partial class teamLeader_teamleader : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AffectationTeamleaderXOperators_AspNetUsers_TeamLeaderId",
                table: "AffectationTeamleaderXOperators");

            migrationBuilder.RenameColumn(
                name: "TeamLeaderId",
                table: "AffectationTeamleaderXOperators",
                newName: "TeamleaderId");

            migrationBuilder.RenameIndex(
                name: "IX_AffectationTeamleaderXOperators_TeamLeaderId",
                table: "AffectationTeamleaderXOperators",
                newName: "IX_AffectationTeamleaderXOperators_TeamleaderId");

            migrationBuilder.AddForeignKey(
                name: "FK_AffectationTeamleaderXOperators_AspNetUsers_TeamleaderId",
                table: "AffectationTeamleaderXOperators",
                column: "TeamleaderId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AffectationTeamleaderXOperators_AspNetUsers_TeamleaderId",
                table: "AffectationTeamleaderXOperators");

            migrationBuilder.RenameColumn(
                name: "TeamleaderId",
                table: "AffectationTeamleaderXOperators",
                newName: "TeamLeaderId");

            migrationBuilder.RenameIndex(
                name: "IX_AffectationTeamleaderXOperators_TeamleaderId",
                table: "AffectationTeamleaderXOperators",
                newName: "IX_AffectationTeamleaderXOperators_TeamLeaderId");

            migrationBuilder.AddForeignKey(
                name: "FK_AffectationTeamleaderXOperators_AspNetUsers_TeamLeaderId",
                table: "AffectationTeamleaderXOperators",
                column: "TeamLeaderId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
