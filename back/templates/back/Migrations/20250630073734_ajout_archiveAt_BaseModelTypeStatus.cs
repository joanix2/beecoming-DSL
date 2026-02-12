using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace opteeam_api.Migrations
{
    /// <inheritdoc />
    public partial class ajout_archiveAt_BaseModelTypeStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ArchivedAt",
                table: "UserDocumentTypes",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ArchivedAt",
                table: "OrderTypes",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ArchivedAt",
                table: "OrderStatuses",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ArchivedAt",
                table: "OrderDocumentType",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ArchivedAt",
                table: "MissionTypes",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ArchivedAt",
                table: "MissionStatuses",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ArchivedAt",
                table: "MissionPhotoTypes",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ArchivedAt",
                table: "MissionDocumentTypes",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ArchivedAt",
                table: "AbsenceTypes",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ArchivedAt",
                table: "UserDocumentTypes");

            migrationBuilder.DropColumn(
                name: "ArchivedAt",
                table: "OrderTypes");

            migrationBuilder.DropColumn(
                name: "ArchivedAt",
                table: "OrderStatuses");

            migrationBuilder.DropColumn(
                name: "ArchivedAt",
                table: "OrderDocumentType");

            migrationBuilder.DropColumn(
                name: "ArchivedAt",
                table: "MissionTypes");

            migrationBuilder.DropColumn(
                name: "ArchivedAt",
                table: "MissionStatuses");

            migrationBuilder.DropColumn(
                name: "ArchivedAt",
                table: "MissionPhotoTypes");

            migrationBuilder.DropColumn(
                name: "ArchivedAt",
                table: "MissionDocumentTypes");

            migrationBuilder.DropColumn(
                name: "ArchivedAt",
                table: "AbsenceTypes");
        }
    }
}
