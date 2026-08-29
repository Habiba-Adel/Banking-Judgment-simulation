CREATE TYPE "public"."pressure_expectation" AS ENUM('Low', 'Medium', 'High');--> statement-breakpoint
CREATE TYPE "public"."pressure_level" AS ENUM('Low', 'Moderate', 'Medium-High', 'High');--> statement-breakpoint
CREATE TYPE "public"."pressure_time" AS ENUM('Low', 'Medium', 'High');--> statement-breakpoint
ALTER TABLE "decisions" ADD COLUMN "pressure_level" "pressure_level" DEFAULT 'Low' NOT NULL;--> statement-breakpoint
ALTER TABLE "decisions" ADD COLUMN "pressure_time" "pressure_time" DEFAULT 'Low' NOT NULL;--> statement-breakpoint
ALTER TABLE "decisions" ADD COLUMN "pressure_expectation" "pressure_expectation" DEFAULT 'Low' NOT NULL;