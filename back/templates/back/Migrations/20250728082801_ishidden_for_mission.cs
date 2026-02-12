using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace opteeam_api.Migrations
{
    /// <inheritdoc />
    public partial class ishidden_for_mission : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsHidden",
                table: "Missions",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsHidden",
                table: "Missions");
        }
    }
}
