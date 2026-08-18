CREATE TABLE `pipelineFindings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`repositoryId` int NOT NULL,
	`externalId` varchar(128) NOT NULL,
	`findingNodeId` varchar(26) NOT NULL,
	`changeNodeId` varchar(26) NOT NULL,
	`repositoryRevisionNodeId` varchar(26) NOT NULL,
	`provider` varchar(64) NOT NULL,
	`severity` enum('critical','high','medium','low') NOT NULL,
	`status` enum('needs_review','triaged','ignored','resolved') NOT NULL DEFAULT 'needs_review',
	`title` varchar(500) NOT NULL,
	`summary` text NOT NULL,
	`sourceUrl` text NOT NULL,
	`evidencePacketJson` text NOT NULL,
	`riskScore` int NOT NULL,
	`confidence` int NOT NULL,
	`matcherVersion` varchar(64) NOT NULL,
	`detectedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pipelineFindings_id` PRIMARY KEY(`id`),
	CONSTRAINT `pipelineFindings_externalId_unique` UNIQUE(`externalId`)
);
--> statement-breakpoint
CREATE TABLE `provenanceEdges` (
	`id` varchar(26) NOT NULL,
	`scopeKey` varchar(96) NOT NULL,
	`fromNodeId` varchar(26) NOT NULL,
	`toNodeId` varchar(26) NOT NULL,
	`relationType` varchar(64) NOT NULL,
	`derivationMethod` varchar(32) NOT NULL,
	`derivationVersion` varchar(64) NOT NULL,
	`confidenceBasisPoints` int,
	`evidenceLocatorJson` text NOT NULL,
	`analysisRunId` varchar(26),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `provenanceEdges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `provenanceNodes` (
	`id` varchar(26) NOT NULL,
	`scopeKey` varchar(96) NOT NULL,
	`nodeKind` varchar(48) NOT NULL,
	`logicalKey` varchar(512) NOT NULL,
	`revisionKey` varchar(512) NOT NULL,
	`contentSha256` varchar(64),
	`payloadJson` text NOT NULL,
	`sourceUrl` text,
	`observedAt` timestamp NOT NULL,
	`effectiveAt` timestamp,
	`parserVersion` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `provenanceNodes_id` PRIMARY KEY(`id`),
	CONSTRAINT `provenance_node_revision_idx` UNIQUE(`scopeKey`,`nodeKind`,`logicalKey`,`revisionKey`)
);
--> statement-breakpoint
ALTER TABLE `pipelineFindings` ADD CONSTRAINT `pipelineFindings_repositoryId_repositories_id_fk` FOREIGN KEY (`repositoryId`) REFERENCES `repositories`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `pipeline_finding_repository_idx` ON `pipelineFindings` (`repositoryId`,`riskScore`);--> statement-breakpoint
CREATE INDEX `provenance_edge_from_idx` ON `provenanceEdges` (`fromNodeId`,`relationType`);--> statement-breakpoint
CREATE INDEX `provenance_edge_to_idx` ON `provenanceEdges` (`toNodeId`,`relationType`);--> statement-breakpoint
CREATE INDEX `provenance_node_kind_idx` ON `provenanceNodes` (`scopeKey`,`nodeKind`);