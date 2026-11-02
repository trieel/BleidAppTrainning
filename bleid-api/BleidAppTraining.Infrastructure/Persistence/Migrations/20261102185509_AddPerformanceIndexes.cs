using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BleidAppTraining.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPerformanceIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_workout_sets_exercise_id",
                table: "workout_sets");

            migrationBuilder.CreateIndex(
                name: "ix_workout_sets_exercise_id_completed",
                table: "workout_sets",
                columns: new[] { "exercise_id", "completed" });

            migrationBuilder.CreateIndex(
                name: "ix_workout_sessions_user_id_finished_at",
                table: "workout_sessions",
                columns: new[] { "user_id", "finished_at" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_workout_sets_exercise_id_completed",
                table: "workout_sets");

            migrationBuilder.DropIndex(
                name: "ix_workout_sessions_user_id_finished_at",
                table: "workout_sessions");

            migrationBuilder.CreateIndex(
                name: "ix_workout_sets_exercise_id",
                table: "workout_sets",
                column: "exercise_id");
        }
    }
}
