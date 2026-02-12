using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace opteeam_api.Migrations
{
    /// <inheritdoc />
    public partial class update_custom_form_type : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "CustomFormId",
                table: "CustomFormTypes",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_CustomFormTypes_CustomFormId",
                table: "CustomFormTypes",
                column: "CustomFormId");

            migrationBuilder.AddForeignKey(
                name: "FK_CustomFormTypes_CustomForm_CustomFormId",
                table: "CustomFormTypes",
                column: "CustomFormId",
                principalTable: "CustomForm",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CustomFormTypes_CustomForm_CustomFormId",
                table: "CustomFormTypes");

            migrationBuilder.DropIndex(
                name: "IX_CustomFormTypes_CustomFormId",
                table: "CustomFormTypes");

            migrationBuilder.DropColumn(
                name: "CustomFormId",
                table: "CustomFormTypes");
        }
    }
}
