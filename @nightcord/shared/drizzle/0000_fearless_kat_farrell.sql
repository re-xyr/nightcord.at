CREATE TABLE `bannedIp6` (
	`id` integer PRIMARY KEY NOT NULL,
	`net` text NOT NULL,
	`reason` integer,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`reason`) REFERENCES `post`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `bannedIp` (
	`id` integer PRIMARY KEY NOT NULL,
	`ip` text NOT NULL,
	`reason` integer,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`reason`) REFERENCES `post`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `post` (
	`id` integer PRIMARY KEY NOT NULL,
	`content` text NOT NULL,
	`inferredLanguage` text NOT NULL,
	`createdAt` integer NOT NULL,
	`inferredToxicity` real NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`authorIp` text NOT NULL,
	`authorUserAgent` text NOT NULL,
	`authorCity` text NOT NULL,
	`authorRegion` text NOT NULL,
	`authorCountry` text NOT NULL
);
