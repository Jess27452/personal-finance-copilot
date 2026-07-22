CREATE TABLE `users` (
	`email` text PRIMARY KEY NOT NULL,
	`display_name` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_email` text NOT NULL,
	`date` text NOT NULL,
	`description` text NOT NULL,
	`amount` real NOT NULL,
	`category` text NOT NULL,
	`confidence` real NOT NULL,
	`method` text NOT NULL,
	`source` text DEFAULT 'csv' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_email`) REFERENCES `users`(`email`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `transactions_owner_date_idx` ON `transactions` (`user_email`,`date`);
