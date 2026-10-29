using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BleidAppTraining.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddUniqueIndexToBodyWeightEntries : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_body_weight_entries_user_id_date",
                table: "body_weight_entries");

            migrationBuilder.CreateIndex(
                name: "ix_body_weight_entries_user_id_date",
                table: "body_weight_entries",
                columns: new[] { "user_id", "date" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_body_weight_entries_user_id_date",
                table: "body_weight_entries");

            migrationBuilder.CreateIndex(
                name: "ix_body_weight_entries_user_id_date",
                table: "body_weight_entries",
                columns: new[] { "user_id", "date" });
        }
    }
}
