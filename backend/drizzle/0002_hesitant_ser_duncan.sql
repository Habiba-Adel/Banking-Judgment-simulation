CREATE TABLE "step_characters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"decision_id" uuid NOT NULL,
	"character_id" uuid NOT NULL,
	"message" text NOT NULL,
	"order_index" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "characters" DROP CONSTRAINT "characters_decision_id_decisions_id_fk";
--> statement-breakpoint
ALTER TABLE "step_characters" ADD CONSTRAINT "step_characters_decision_id_decisions_id_fk" FOREIGN KEY ("decision_id") REFERENCES "public"."decisions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "step_characters" ADD CONSTRAINT "step_characters_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "characters" DROP COLUMN "decision_id";--> statement-breakpoint
ALTER TABLE "characters" DROP COLUMN "message";--> statement-breakpoint
ALTER TABLE "characters" DROP COLUMN "order_index";