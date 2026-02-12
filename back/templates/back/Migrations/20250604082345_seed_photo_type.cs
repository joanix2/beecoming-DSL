using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace opteeam_api.Migrations
{
    /// <inheritdoc />
    public partial class seed_photo_type : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MissionPhotos_MissionPhotoType_TypeId",
                table: "MissionPhotos");

            migrationBuilder.DropPrimaryKey(
                name: "PK_MissionPhotoType",
                table: "MissionPhotoType");

            migrationBuilder.RenameTable(
                name: "MissionPhotoType",
                newName: "MissionPhotoTypes");

            migrationBuilder.AddPrimaryKey(
                name: "PK_MissionPhotoTypes",
                table: "MissionPhotoTypes",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_MissionPhotos_MissionPhotoTypes_TypeId",
                table: "MissionPhotos",
                column: "TypeId",
                principalTable: "MissionPhotoTypes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MissionPhotos_MissionPhotoTypes_TypeId",
                table: "MissionPhotos");

            migrationBuilder.DropPrimaryKey(
                name: "PK_MissionPhotoTypes",
                table: "MissionPhotoTypes");

            migrationBuilder.RenameTable(
                name: "MissionPhotoTypes",
                newName: "MissionPhotoType");

            migrationBuilder.AddPrimaryKey(
                name: "PK_MissionPhotoType",
                table: "MissionPhotoType",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_MissionPhotos_MissionPhotoType_TypeId",
                table: "MissionPhotos",
                column: "TypeId",
                principalTable: "MissionPhotoType",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
