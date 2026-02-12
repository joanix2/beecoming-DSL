using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace opteeam_api.Migrations
{
    /// <inheritdoc />
    public partial class seed_mission_document_type : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MissionDocuments_MissionDocumentType_TypeId",
                table: "MissionDocuments");

            migrationBuilder.DropPrimaryKey(
                name: "PK_MissionDocumentType",
                table: "MissionDocumentType");

            migrationBuilder.RenameTable(
                name: "MissionDocumentType",
                newName: "MissionDocumentTypes");

            migrationBuilder.AddPrimaryKey(
                name: "PK_MissionDocumentTypes",
                table: "MissionDocumentTypes",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_MissionDocuments_MissionDocumentTypes_TypeId",
                table: "MissionDocuments",
                column: "TypeId",
                principalTable: "MissionDocumentTypes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MissionDocuments_MissionDocumentTypes_TypeId",
                table: "MissionDocuments");

            migrationBuilder.DropPrimaryKey(
                name: "PK_MissionDocumentTypes",
                table: "MissionDocumentTypes");

            migrationBuilder.RenameTable(
                name: "MissionDocumentTypes",
                newName: "MissionDocumentType");

            migrationBuilder.AddPrimaryKey(
                name: "PK_MissionDocumentType",
                table: "MissionDocumentType",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_MissionDocuments_MissionDocumentType_TypeId",
                table: "MissionDocuments",
                column: "TypeId",
                principalTable: "MissionDocumentType",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
