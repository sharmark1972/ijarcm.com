ALTER TABLE `certificates` ADD COLUMN `journal_id` VARCHAR(191) NULL;
ALTER TABLE `certificates` ADD INDEX `certificates_journal_id_idx` (`journal_id`);
