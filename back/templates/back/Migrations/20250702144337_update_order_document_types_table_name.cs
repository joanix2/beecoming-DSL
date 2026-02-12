using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace opteeam_api.Migrations
{
    /// <inheritdoc />
    public partial class update_order_document_types_table_name : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OrderDocuments_OrderDocumentType_TypeId",
                table: "OrderDocuments");

            migrationBuilder.DropPrimaryKey(
                name: "PK_OrderDocumentType",
                table: "OrderDocumentType");

            migrationBuilder.RenameTable(
                name: "OrderDocumentType",
                newName: "OrderDocumentTypes");

            migrationBuilder.AddPrimaryKey(
                name: "PK_OrderDocumentTypes",
                table: "OrderDocumentTypes",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_OrderDocuments_OrderDocumentTypes_TypeId",
                table: "OrderDocuments",
                column: "TypeId",
                principalTable: "OrderDocumentTypes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OrderDocuments_OrderDocumentTypes_TypeId",
                table: "OrderDocuments");

            migrationBuilder.DropPrimaryKey(
                name: "PK_OrderDocumentTypes",
                table: "OrderDocumentTypes");

            migrationBuilder.RenameTable(
                name: "OrderDocumentTypes",
                newName: "OrderDocumentType");

            migrationBuilder.AddPrimaryKey(
                name: "PK_OrderDocumentType",
                table: "OrderDocumentType",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_OrderDocuments_OrderDocumentType_TypeId",
                table: "OrderDocuments",
                column: "TypeId",
                principalTable: "OrderDocumentType",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
