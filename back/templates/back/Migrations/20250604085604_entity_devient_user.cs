using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace opteeam_api.Migrations
{
    /// <inheritdoc />
    public partial class entity_devient_user : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MissionDocuments_Missions_EntityId",
                table: "MissionDocuments");

            migrationBuilder.DropForeignKey(
                name: "FK_MissionPhotos_Missions_EntityId",
                table: "MissionPhotos");

            migrationBuilder.DropForeignKey(
                name: "FK_OrderDocuments_Orders_EntityId",
                table: "OrderDocuments");

            migrationBuilder.DropForeignKey(
                name: "FK_UserAbsences_AspNetUsers_EntityId",
                table: "UserAbsences");

            migrationBuilder.DropForeignKey(
                name: "FK_UserDocuments_AspNetUsers_EntityId",
                table: "UserDocuments");

            migrationBuilder.RenameColumn(
                name: "EntityId",
                table: "UserDocuments",
                newName: "UserId");

            migrationBuilder.RenameIndex(
                name: "IX_UserDocuments_EntityId",
                table: "UserDocuments",
                newName: "IX_UserDocuments_UserId");

            migrationBuilder.RenameColumn(
                name: "EntityId",
                table: "UserAbsences",
                newName: "UserId");

            migrationBuilder.RenameIndex(
                name: "IX_UserAbsences_EntityId",
                table: "UserAbsences",
                newName: "IX_UserAbsences_UserId");

            migrationBuilder.RenameColumn(
                name: "EntityId",
                table: "OrderDocuments",
                newName: "OrderId");

            migrationBuilder.RenameIndex(
                name: "IX_OrderDocuments_EntityId",
                table: "OrderDocuments",
                newName: "IX_OrderDocuments_OrderId");

            migrationBuilder.RenameColumn(
                name: "EntityId",
                table: "MissionPhotos",
                newName: "MissionId");

            migrationBuilder.RenameIndex(
                name: "IX_MissionPhotos_EntityId",
                table: "MissionPhotos",
                newName: "IX_MissionPhotos_MissionId");

            migrationBuilder.RenameColumn(
                name: "EntityId",
                table: "MissionDocuments",
                newName: "MissionId");

            migrationBuilder.RenameIndex(
                name: "IX_MissionDocuments_EntityId",
                table: "MissionDocuments",
                newName: "IX_MissionDocuments_MissionId");

            migrationBuilder.AddForeignKey(
                name: "FK_MissionDocuments_Missions_MissionId",
                table: "MissionDocuments",
                column: "MissionId",
                principalTable: "Missions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_MissionPhotos_Missions_MissionId",
                table: "MissionPhotos",
                column: "MissionId",
                principalTable: "Missions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_OrderDocuments_Orders_OrderId",
                table: "OrderDocuments",
                column: "OrderId",
                principalTable: "Orders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_UserAbsences_AspNetUsers_UserId",
                table: "UserAbsences",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_UserDocuments_AspNetUsers_UserId",
                table: "UserDocuments",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MissionDocuments_Missions_MissionId",
                table: "MissionDocuments");

            migrationBuilder.DropForeignKey(
                name: "FK_MissionPhotos_Missions_MissionId",
                table: "MissionPhotos");

            migrationBuilder.DropForeignKey(
                name: "FK_OrderDocuments_Orders_OrderId",
                table: "OrderDocuments");

            migrationBuilder.DropForeignKey(
                name: "FK_UserAbsences_AspNetUsers_UserId",
                table: "UserAbsences");

            migrationBuilder.DropForeignKey(
                name: "FK_UserDocuments_AspNetUsers_UserId",
                table: "UserDocuments");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "UserDocuments",
                newName: "EntityId");

            migrationBuilder.RenameIndex(
                name: "IX_UserDocuments_UserId",
                table: "UserDocuments",
                newName: "IX_UserDocuments_EntityId");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "UserAbsences",
                newName: "EntityId");

            migrationBuilder.RenameIndex(
                name: "IX_UserAbsences_UserId",
                table: "UserAbsences",
                newName: "IX_UserAbsences_EntityId");

            migrationBuilder.RenameColumn(
                name: "OrderId",
                table: "OrderDocuments",
                newName: "EntityId");

            migrationBuilder.RenameIndex(
                name: "IX_OrderDocuments_OrderId",
                table: "OrderDocuments",
                newName: "IX_OrderDocuments_EntityId");

            migrationBuilder.RenameColumn(
                name: "MissionId",
                table: "MissionPhotos",
                newName: "EntityId");

            migrationBuilder.RenameIndex(
                name: "IX_MissionPhotos_MissionId",
                table: "MissionPhotos",
                newName: "IX_MissionPhotos_EntityId");

            migrationBuilder.RenameColumn(
                name: "MissionId",
                table: "MissionDocuments",
                newName: "EntityId");

            migrationBuilder.RenameIndex(
                name: "IX_MissionDocuments_MissionId",
                table: "MissionDocuments",
                newName: "IX_MissionDocuments_EntityId");

            migrationBuilder.AddForeignKey(
                name: "FK_MissionDocuments_Missions_EntityId",
                table: "MissionDocuments",
                column: "EntityId",
                principalTable: "Missions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_MissionPhotos_Missions_EntityId",
                table: "MissionPhotos",
                column: "EntityId",
                principalTable: "Missions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_OrderDocuments_Orders_EntityId",
                table: "OrderDocuments",
                column: "EntityId",
                principalTable: "Orders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_UserAbsences_AspNetUsers_EntityId",
                table: "UserAbsences",
                column: "EntityId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_UserDocuments_AspNetUsers_EntityId",
                table: "UserDocuments",
                column: "EntityId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
