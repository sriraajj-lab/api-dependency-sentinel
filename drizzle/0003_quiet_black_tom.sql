CREATE TABLE `githubConnectSessions` (
	`state` varchar(128) NOT NULL,
	`userId` int NOT NULL,
	`candidatesJson` text,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `githubConnectSessions_state` PRIMARY KEY(`state`)
);
--> statement-breakpoint
ALTER TABLE `githubConnectSessions` ADD CONSTRAINT `githubConnectSessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `github_connect_session_user_idx` ON `githubConnectSessions` (`userId`,`expiresAt`);