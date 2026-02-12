using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace opteeam_api.Migrations
{
    /// <inheritdoc />
    public partial class update_mission_for_custom_form_responses : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CustomFormResponse_CustomForm_CustomFormId",
                table: "CustomFormResponse");

            migrationBuilder.DropForeignKey(
                name: "FK_CustomFormResponse_Missions_MissionId",
                table: "CustomFormResponse");

            migrationBuilder.DropPrimaryKey(
                name: "PK_CustomFormResponse",
                table: "CustomFormResponse");

            migrationBuilder.RenameTable(
                name: "CustomFormResponse",
                newName: "CustomFormResponses");

            migrationBuilder.RenameIndex(
                name: "IX_CustomFormResponse_MissionId",
                table: "CustomFormResponses",
                newName: "IX_CustomFormResponses_MissionId");

            migrationBuilder.RenameIndex(
                name: "IX_CustomFormResponse_CustomFormId",
                table: "CustomFormResponses",
                newName: "IX_CustomFormResponses_CustomFormId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_CustomFormResponses",
                table: "CustomFormResponses",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_CustomFormResponses_CustomForm_CustomFormId",
                table: "CustomFormResponses",
                column: "CustomFormId",
                principalTable: "CustomForm",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_CustomFormResponses_Missions_MissionId",
                table: "CustomFormResponses",
                column: "MissionId",
                principalTable: "Missions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CustomFormResponses_CustomForm_CustomFormId",
                table: "CustomFormResponses");

            migrationBuilder.DropForeignKey(
                name: "FK_CustomFormResponses_Missions_MissionId",
                table: "CustomFormResponses");

            migrationBuilder.DropPrimaryKey(
                name: "PK_CustomFormResponses",
                table: "CustomFormResponses");

            migrationBuilder.RenameTable(
                name: "CustomFormResponses",
                newName: "CustomFormResponse");

            migrationBuilder.RenameIndex(
                name: "IX_CustomFormResponses_MissionId",
                table: "CustomFormResponse",
                newName: "IX_CustomFormResponse_MissionId");

            migrationBuilder.RenameIndex(
                name: "IX_CustomFormResponses_CustomFormId",
                table: "CustomFormResponse",
                newName: "IX_CustomFormResponse_CustomFormId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_CustomFormResponse",
                table: "CustomFormResponse",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_CustomFormResponse_CustomForm_CustomFormId",
                table: "CustomFormResponse",
                column: "CustomFormId",
                principalTable: "CustomForm",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_CustomFormResponse_Missions_MissionId",
                table: "CustomFormResponse",
                column: "MissionId",
                principalTable: "Missions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
