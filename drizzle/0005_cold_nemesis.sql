CREATE TABLE `providerSourceSnapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`provider` varchar(64) NOT NULL,
	`sourceKind` varchar(64) NOT NULL,
	`sourceUrl` text NOT NULL,
	`sourceRef` varchar(128) NOT NULL,
	`contentSha256` varchar(64) NOT NULL,
	`contentType` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`retrievedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `providerSourceSnapshots_id` PRIMARY KEY(`id`),
	CONSTRAINT `provider_snapshot_revision_idx` UNIQUE(`provider`,`contentSha256`)
);
--> statement-breakpoint
CREATE INDEX `provider_snapshot_lookup_idx` ON `providerSourceSnapshots` (`provider`,`retrievedAt`);