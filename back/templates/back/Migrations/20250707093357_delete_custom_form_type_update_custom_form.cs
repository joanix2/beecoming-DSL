using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace opteeam_api.Migrations
{
    /// <inheritdoc />
    public partial class delete_custom_form_type_update_custom_form : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MissionTypes_CustomForm_DetailsFormId",
                table: "MissionTypes");

            migrationBuilder.DropForeignKey(
                name: "FK_MissionTypes_CustomForm_OperatorFormId",
                table: "MissionTypes");

            migrationBuilder.DropTable(
                name: "CustomFormTypes");

            migrationBuilder.DropIndex(
                name: "IX_MissionTypes_DetailsFormId",
                table: "MissionTypes");

            migrationBuilder.DropIndex(
                name: "IX_MissionTypes_OperatorFormId",
                table: "MissionTypes");

            migrationBuilder.DropColumn(
                name: "DetailsFormId",
                table: "MissionTypes");

            migrationBuilder.DropColumn(
                name: "OperatorFormId",
                table: "MissionTypes");

            migrationBuilder.AddColumn<string>(
                name: "Color",
                table: "CustomForm",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Icon",
                table: "CustomForm",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "MissionTypeId",
                table: "CustomForm",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Name",
                table: "CustomForm",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_CustomForm_MissionTypeId",
                table: "CustomForm",
                column: "MissionTypeId");

            migrationBuilder.AddForeignKey(
                name: "FK_CustomForm_MissionTypes_MissionTypeId",
                table: "CustomForm",
                column: "MissionTypeId",
                principalTable: "MissionTypes",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CustomForm_MissionTypes_MissionTypeId",
                table: "CustomForm");

            migrationBuilder.DropIndex(
                name: "IX_CustomForm_MissionTypeId",
                table: "CustomForm");

            migrationBuilder.DropColumn(
                name: "Color",
                table: "CustomForm");

            migrationBuilder.DropColumn(
                name: "Icon",
                table: "CustomForm");

            migrationBuilder.DropColumn(
                name: "MissionTypeId",
                table: "CustomForm");

            migrationBuilder.DropColumn(
                name: "Name",
                table: "CustomForm");

            migrationBuilder.AddColumn<Guid>(
                name: "DetailsFormId",
                table: "MissionTypes",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "OperatorFormId",
                table: "MissionTypes",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CustomFormTypes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CustomFormId = table.Column<Guid>(type: "uuid", nullable: false),
                    ArchivedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Color = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Icon = table.Column<string>(type: "text", nullable: true),
                    Name = table.Column<string>(type: "text", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CustomFormTypes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CustomFormTypes_CustomForm_CustomFormId",
                        column: x => x.CustomFormId,
                        principalTable: "CustomForm",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MissionTypes_DetailsFormId",
                table: "MissionTypes",
                column: "DetailsFormId");

            migrationBuilder.CreateIndex(
                name: "IX_MissionTypes_OperatorFormId",
                table: "MissionTypes",
                column: "OperatorFormId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomFormTypes_CustomFormId",
                table: "CustomFormTypes",
                column: "CustomFormId");

            migrationBuilder.AddForeignKey(
                name: "FK_MissionTypes_CustomForm_DetailsFormId",
                table: "MissionTypes",
                column: "DetailsFormId",
                principalTable: "CustomForm",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_MissionTypes_CustomForm_OperatorFormId",
                table: "MissionTypes",
                column: "OperatorFormId",
                principalTable: "CustomForm",
                principalColumn: "Id");
        }
    }
}
