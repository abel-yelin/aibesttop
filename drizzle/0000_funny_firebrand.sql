CREATE TABLE IF NOT EXISTS "contents" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"url" text,
	"order" integer,
	"category" text,
	"preview_images" text[],
	"keywords" text,
	"description" text,
	"tags" text,
	"sections" jsonb,
	"language" text NOT NULL,
	"original_content_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
