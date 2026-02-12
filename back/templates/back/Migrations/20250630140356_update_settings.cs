using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace opteeam_api.Migrations
{
    /// <inheritdoc />
    public partial class update_settings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "SchedulingWeekEndVisible",
                table: "Settings",
                newName: "ShowWeekendsInPlanning");

            migrationBuilder.RenameColumn(
                name: "SchedulingFinishedMissionVisible",
                table: "Settings",
                newName: "GrayOutFinishedMissions");

            migrationBuilder.RenameColumn(
                name: "SchedulingDisplayMode",
                table: "Settings",
                newName: "Url");

            migrationBuilder.AddColumn<string>(
                name: "ApeCode",
                table: "Settings",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "BillingAddressId",
                table: "Settings",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<string>(
                name: "CompanyName",
                table: "Settings",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "DefaultPlanningMode",
                table: "Settings",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "Settings",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Fax",
                table: "Settings",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "LegalForm",
                table: "Settings",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Phone",
                table: "Settings",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SirenNumber",
                table: "Settings",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Settings_BillingAddressId",
                table: "Settings",
                column: "BillingAddressId");

            migrationBuilder.AddForeignKey(
                name: "FK_Settings_Addresses_BillingAddressId",
                table: "Settings",
                column: "BillingAddressId",
                principalTable: "Addresses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Settings_Addresses_BillingAddressId",
                table: "Settings");

            migrationBuilder.DropIndex(
                name: "IX_Settings_BillingAddressId",
                table: "Settings");

            migrationBuilder.DropColumn(
                name: "ApeCode",
                table: "Settings");

            migrationBuilder.DropColumn(
                name: "BillingAddressId",
                table: "Settings");

            migrationBuilder.DropColumn(
                name: "CompanyName",
                table: "Settings");

            migrationBuilder.DropColumn(
                name: "DefaultPlanningMode",
                table: "Settings");

            migrationBuilder.DropColumn(
                name: "Email",
                table: "Settings");

            migrationBuilder.DropColumn(
                name: "Fax",
                table: "Settings");

            migrationBuilder.DropColumn(
                name: "LegalForm",
                table: "Settings");

            migrationBuilder.DropColumn(
                name: "Phone",
                table: "Settings");

            migrationBuilder.DropColumn(
                name: "SirenNumber",
                table: "Settings");

            migrationBuilder.RenameColumn(
                name: "Url",
                table: "Settings",
                newName: "SchedulingDisplayMode");

            migrationBuilder.RenameColumn(
                name: "ShowWeekendsInPlanning",
                table: "Settings",
                newName: "SchedulingWeekEndVisible");

            migrationBuilder.RenameColumn(
                name: "GrayOutFinishedMissions",
                table: "Settings",
                newName: "SchedulingFinishedMissionVisible");
        }
    }
}
