using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BleidAppTraining.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddExerciseAliases : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1
                        FROM information_schema.columns
                        WHERE table_schema = 'public'
                          AND table_name = 'exercises'
                          AND column_name = 'aliases'
                    ) THEN
                        ALTER TABLE public.exercises ADD COLUMN aliases text[] NOT NULL DEFAULT '{}';
                    END IF;
                END $$;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1
                        FROM information_schema.columns
                        WHERE table_schema = 'public'
                          AND table_name = 'exercises'
                          AND column_name = 'aliases'
                    ) THEN
                        ALTER TABLE public.exercises DROP COLUMN aliases;
                    END IF;
                END $$;
            ");
        }
    }
}
