ALTER TABLE `papers`
  ADD COLUMN `source_file_path` VARCHAR(500) NULL,
  ADD COLUMN `source_file_name` VARCHAR(255) NULL,
  ADD COLUMN `source_file_size` INTEGER NULL;
