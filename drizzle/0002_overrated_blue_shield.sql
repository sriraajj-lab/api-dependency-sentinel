CREATE TABLE `providerPollRuns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`provider` varchar(64) NOT NULL,
	`priorCommitSha` varchar(128),
	`nextCommitSha` varchar(128),
	`etag` varchar(512),
	`contentSha256` varchar(64),
	`outcome` enum('unchanged','changed','failed') NOT NULL,
	`changeCount` int NOT NULL DEFAULT 0,
	`errorSummary` varchar(1000),
	`executedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `providerPollRuns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `providerPollStates` (
	`provider` varchar(64) NOT NULL,
	`sourceUrl` text NOT NULL,
	`scheduleCronTaskUid` varchar(65),
	`etag` varchar(512),
	`commitSha` varchar(128),
	`contentSha256` varchar(64),
	`lastAttemptAt` timestamp,
	`lastSuccessAt` timestamp,
	`lastStatus` enum('idle','unchanged','changed','failed') NOT NULL DEFAULT 'idle',
	`lastError` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `providerPollStates_provider` PRIMARY KEY(`provider`)
);
--> statement-breakpoint
CREATE TABLE `repositoryScanRuns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`repositoryId` int NOT NULL,
	`commitSha` varchar(128) NOT NULL,
	`status` enum('succeeded','failed') NOT NULL,
	`fileCount` int NOT NULL DEFAULT 0,
	`dependencyCount` int NOT NULL DEFAULT 0,
	`codeEvidenceCount` int NOT NULL DEFAULT 0,
	`errorSummary` varchar(1000),
	`scannedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `repositoryScanRuns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `repositoryScanRuns` ADD CONSTRAINT `repositoryScanRuns_repositoryId_repositories_id_fk` FOREIGN KEY (`repositoryId`) REFERENCES `repositories`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `provider_poll_run_provider_idx` ON `providerPollRuns` (`provider`,`executedAt`);--> statement-breakpoint
CREATE INDEX `repository_scan_repository_idx` ON `repositoryScanRuns` (`repositoryId`,`scannedAt`);