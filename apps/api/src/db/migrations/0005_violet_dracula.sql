CREATE TABLE "message_reactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"emoji" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "message_mentions" DROP CONSTRAINT "message_mentions_user_id_users_id_fk";
--> statement-breakpoint
DROP INDEX "message_mention_message_user_idx";--> statement-breakpoint
DROP INDEX "message_mention_user_created_at_idx";--> statement-breakpoint
ALTER TABLE "message_attachments" ADD COLUMN "size" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "message_mentions" ADD COLUMN "mentioned_user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "message_reaction_message_user_idx" ON "message_reactions" USING btree ("message_id","user_id");--> statement-breakpoint
CREATE INDEX "message_reaction_message_id_idx" ON "message_reactions" USING btree ("message_id");--> statement-breakpoint
ALTER TABLE "message_mentions" ADD CONSTRAINT "message_mentions_mentioned_user_id_users_id_fk" FOREIGN KEY ("mentioned_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "message_attachment_message_id_idx" ON "message_attachments" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "message_user_created_at_idx" ON "messages" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "message_created_at_id_idx" ON "messages" USING btree ("created_at","id");--> statement-breakpoint
CREATE UNIQUE INDEX "message_mention_message_user_idx" ON "message_mentions" USING btree ("message_id","mentioned_user_id");--> statement-breakpoint
CREATE INDEX "message_mention_user_created_at_idx" ON "message_mentions" USING btree ("mentioned_user_id","created_at");--> statement-breakpoint
ALTER TABLE "message_attachments" DROP COLUMN "file_size";--> statement-breakpoint
ALTER TABLE "message_mentions" DROP COLUMN "user_id";