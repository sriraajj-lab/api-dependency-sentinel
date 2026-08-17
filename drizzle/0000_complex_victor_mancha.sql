CREATE TABLE `repositories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`githubRepositoryId` varchar(64),
	`owner` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`defaultBranch` varchar(255) NOT NULL DEFAULT 'main',
	`installationId` varchar(64),
	`connectionStatus` enum('demo','connected','attention','disconnected') NOT NULL DEFAULT 'demo',
	`lastScannedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `repositories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `riskFindings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`repositoryId` int NOT NULL,
	`externalId` varchar(128) NOT NULL,
	`provider` varchar(64) NOT NULL,
	`findingType` enum('deprecation','schema_change','sdk_release','behavior_change') NOT NULL,
	`severity` enum('critical','high','medium','low') NOT NULL,
	`status` enum('needs_review','triaged','ignored','resolved') NOT NULL DEFAULT 'needs_review',
	`title` varchar(500) NOT NULL,
	`sourceUrl` text NOT NULL,
	`sourceSummary` text NOT NULL,
	`codeReferencesJson` text NOT NULL,
	`ownerHint` varchar(255),
	`riskScore` int NOT NULL,
	`confidence` int NOT NULL,
	`deadlineAt` timestamp,
	`detectedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `riskFindings_id` PRIMARY KEY(`id`),
	CONSTRAINT `riskFindings_externalId_unique` UNIQUE(`externalId`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
ALTER TABLE `repositories` ADD CONSTRAINT `repositories_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `riskFindings` ADD CONSTRAINT `riskFindings_repositoryId_repositories_id_fk` FOREIGN KEY (`repositoryId`) REFERENCES `repositories`(`id`) ON DELETE cascade ON UPDATE no action;