CREATE TYPE "public"."member_branch" AS ENUM('tech', 'non_tech', 'mentor', 'volunteer');--> statement-breakpoint
CREATE TYPE "public"."performance_branch" AS ENUM('tech', 'non_tech');--> statement-breakpoint
CREATE TYPE "public"."performance_category" AS ENUM('innovation', 'design', 'cad', 'code', 'mechanical', 'testing', 'outreach', 'sponsorship', 'pr_media', 'events', 'collaboration', 'accessibility');--> statement-breakpoint
CREATE TYPE "public"."sponsor_tier" AS ENUM('platinum', 'gold', 'silver', 'partner', 'in_kind');--> statement-breakpoint
CREATE TABLE "award" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"season_id" uuid NOT NULL,
	"name_ro" text NOT NULL,
	"name_en" text,
	"event_name" text NOT NULL,
	"event_date" date NOT NULL,
	"placement" text,
	"notes_ro" text,
	"notes_en" text,
	"is_featured" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "home_slide" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"image" jsonb NOT NULL,
	"caption_ro" text,
	"caption_en" text,
	"link_path" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "home_slide_link_path_unprefixed" CHECK ("home_slide"."link_path" is null or ("home_slide"."link_path" ~ '^/' and "home_slide"."link_path" !~ '^/(ro|en)(/|$)'))
);
--> statement-breakpoint
CREATE TABLE "news_post" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title_ro" text NOT NULL,
	"title_en" text,
	"excerpt_ro" text NOT NULL,
	"excerpt_en" text,
	"body_ro" text NOT NULL,
	"body_en" text,
	"cover_image" jsonb,
	"gallery" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"published_at" timestamp with time zone,
	"author_member_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "news_post_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "performance_entry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"branch" "performance_branch" NOT NULL,
	"category" "performance_category" NOT NULL,
	"title_ro" text NOT NULL,
	"title_en" text,
	"summary_ro" text NOT NULL,
	"summary_en" text,
	"body_ro" text NOT NULL,
	"body_en" text,
	"cover_image" jsonb,
	"gallery" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"date" date NOT NULL,
	"season_id" uuid,
	"metrics" jsonb,
	"is_featured" boolean DEFAULT false NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "performance_entry_slug_unique" UNIQUE("slug"),
	CONSTRAINT "performance_entry_branch_category" CHECK (("performance_entry"."branch" = 'tech' and "performance_entry"."category" in ('innovation', 'design', 'cad', 'code', 'mechanical', 'testing'))
       or ("performance_entry"."branch" = 'non_tech' and "performance_entry"."category" in ('outreach', 'sponsorship', 'pr_media', 'events', 'collaboration', 'accessibility')))
);
--> statement-breakpoint
CREATE TABLE "qr_code" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"label" text NOT NULL,
	"target_path" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"printed_on" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "qr_code_code_unique" UNIQUE("code"),
	CONSTRAINT "qr_code_target_path_unprefixed" CHECK ("qr_code"."target_path" ~ '^/' and "qr_code"."target_path" !~ '^/(ro|en)(/|$)')
);
--> statement-breakpoint
CREATE TABLE "qr_scan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"qr_code_id" uuid NOT NULL,
	"scanned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"country" char(2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "qr_scan_country_iso" CHECK ("qr_scan"."country" is null or "qr_scan"."country" ~ '^[A-Z]{2}$')
);
--> statement-breakpoint
CREATE TABLE "season" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"game_name" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"description_ro" text NOT NULL,
	"description_en" text,
	"cover_image" jsonb,
	"gallery" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"portfolio_url" text,
	"is_current" boolean DEFAULT false NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "season_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "sponsor" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"logo" jsonb NOT NULL,
	"logo_dark" jsonb,
	"description_ro" text,
	"description_en" text,
	"website_url" text,
	"tier" "sponsor_tier",
	"active_seasons" text[] DEFAULT '{}' NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_info" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"origin_story_ro" text NOT NULL,
	"origin_story_en" text,
	"gallery" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"founded_date" date NOT NULL,
	"school_name" text NOT NULL,
	"city" text NOT NULL,
	"country" char(2) NOT NULL,
	"contact_email" text NOT NULL,
	"phone" text,
	"social_links" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"map_embed_lat" double precision,
	"map_embed_lng" double precision,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "team_info_singleton" CHECK ("team_info"."id" = 1),
	CONSTRAINT "team_info_country_iso" CHECK ("team_info"."country" ~ '^[A-Z]{2}$')
);
--> statement-breakpoint
CREATE TABLE "team_member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"role_ro" text NOT NULL,
	"role_en" text,
	"branch" "member_branch" NOT NULL,
	"description_ro" text,
	"description_en" text,
	"image" jsonb,
	"instagram_url" text,
	"octet_index" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"photo_consent" boolean DEFAULT false NOT NULL,
	"full_name_public" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "team_member_slug_unique" UNIQUE("slug"),
	CONSTRAINT "team_member_octet_index_range" CHECK ("team_member"."octet_index" >= 0 and "team_member"."octet_index" <= 255)
);
--> statement-breakpoint
ALTER TABLE "award" ADD CONSTRAINT "award_season_id_season_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."season"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_post" ADD CONSTRAINT "news_post_author_member_id_team_member_id_fk" FOREIGN KEY ("author_member_id") REFERENCES "public"."team_member"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_entry" ADD CONSTRAINT "performance_entry_season_id_season_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."season"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qr_scan" ADD CONSTRAINT "qr_scan_qr_code_id_qr_code_id_fk" FOREIGN KEY ("qr_code_id") REFERENCES "public"."qr_code"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "award_season_idx" ON "award" USING btree ("season_id");--> statement-breakpoint
CREATE INDEX "award_featured_idx" ON "award" USING btree ("is_featured","event_date");--> statement-breakpoint
CREATE INDEX "home_slide_active_order_idx" ON "home_slide" USING btree ("is_active","display_order");--> statement-breakpoint
CREATE INDEX "news_post_published_idx" ON "news_post" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "news_post_author_idx" ON "news_post" USING btree ("author_member_id");--> statement-breakpoint
CREATE INDEX "performance_entry_branch_idx" ON "performance_entry" USING btree ("branch","display_order");--> statement-breakpoint
CREATE INDEX "performance_entry_season_idx" ON "performance_entry" USING btree ("season_id");--> statement-breakpoint
CREATE INDEX "performance_entry_featured_idx" ON "performance_entry" USING btree ("is_featured","date");--> statement-breakpoint
CREATE INDEX "qr_scan_code_time_idx" ON "qr_scan" USING btree ("qr_code_id","scanned_at");--> statement-breakpoint
CREATE INDEX "qr_scan_time_idx" ON "qr_scan" USING btree ("scanned_at");--> statement-breakpoint
CREATE INDEX "qr_scan_country_idx" ON "qr_scan" USING btree ("country");--> statement-breakpoint
CREATE INDEX "season_display_order_idx" ON "season" USING btree ("display_order");--> statement-breakpoint
CREATE UNIQUE INDEX "season_single_current_idx" ON "season" USING btree ("is_current") WHERE "season"."is_current";--> statement-breakpoint
CREATE INDEX "sponsor_tier_order_idx" ON "sponsor" USING btree ("tier","display_order");--> statement-breakpoint
CREATE INDEX "team_member_active_order_idx" ON "team_member" USING btree ("is_active","display_order");--> statement-breakpoint
CREATE INDEX "team_member_branch_idx" ON "team_member" USING btree ("branch");