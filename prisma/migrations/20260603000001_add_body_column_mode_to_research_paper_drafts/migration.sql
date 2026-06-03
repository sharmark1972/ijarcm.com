ALTER TABLE `research_paper_drafts`
  ADD COLUMN `body_column_mode` VARCHAR(20) NOT NULL DEFAULT 'two-column' AFTER `extracted_text`;
