CREATE TABLE "admin_credentials" (
	"id" text PRIMARY KEY NOT NULL,
	"password_hash" text NOT NULL,
	"version" text NOT NULL
);

CREATE TABLE "tags" (
	"tag_id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_key" text NOT NULL,
	"description" text NOT NULL,
	"color" text NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);

CREATE TABLE "website_tags" (
	"website_id" text NOT NULL,
	"tag_id" text NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "website_tags_website_id_tag_id_pk" PRIMARY KEY("website_id","tag_id")
);

CREATE TABLE "websites" (
	"website_id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"search_text" text NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);

ALTER TABLE "website_tags" ADD CONSTRAINT "website_tags_website_id_websites_website_id_fk" FOREIGN KEY ("website_id") REFERENCES "public"."websites"("website_id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "website_tags" ADD CONSTRAINT "website_tags_tag_id_tags_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("tag_id") ON DELETE cascade ON UPDATE no action;
CREATE UNIQUE INDEX "tags_name_key_unique" ON "tags" USING btree ("name_key");
CREATE INDEX "website_tags_tag_idx" ON "website_tags" USING btree ("tag_id");
CREATE INDEX "websites_created_id_idx" ON "websites" USING btree ("created_at","website_id");