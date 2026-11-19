CREATE TABLE "login_attempts" (
	"key" varchar(320) PRIMARY KEY NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"last_failed_at" timestamp DEFAULT now() NOT NULL,
	"locked_until" timestamp
);
