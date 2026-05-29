CREATE TABLE IF NOT EXISTS `research_paper_drafts` (
  `id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(700) NULL,
  `short_title` VARCHAR(300) NULL,
  `abstract` LONGTEXT NULL,
  `keywords` JSON NULL,
  `doi` VARCHAR(200) NULL,
  `source_file_path` VARCHAR(500) NULL,
  `source_file_name` VARCHAR(255) NULL,
  `source_file_size` INT NULL,
  `extracted_text` LONGTEXT NULL,
  `pdf_path` VARCHAR(500) NULL,
  `preview_pdf_path` VARCHAR(500) NULL,
  `status` ENUM('DRAFT', 'UPLOADED', 'EXTRACTED', 'EDITING', 'READY', 'PDF_GENERATED', 'PUBLISHED') NOT NULL DEFAULT 'DRAFT',
  `issue_id` VARCHAR(191) NULL,
  `created_by` VARCHAR(191) NOT NULL,
  `published_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `research_paper_drafts_status_idx` (`status`),
  INDEX `research_paper_drafts_issue_id_idx` (`issue_id`),
  INDEX `research_paper_drafts_created_by_idx` (`created_by`),
  INDEX `research_paper_drafts_published_at_idx` (`published_at`),
  CONSTRAINT `research_paper_drafts_issue_id_fkey` FOREIGN KEY (`issue_id`) REFERENCES `issues`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `research_paper_drafts_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `research_paper_authors` (
  `id` VARCHAR(191) NOT NULL,
  `draft_id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NULL,
  `affiliation` VARCHAR(500) NULL,
  `author_order` INT NOT NULL DEFAULT 0,
  `is_corresponding` BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (`id`),
  INDEX `research_paper_authors_draft_id_idx` (`draft_id`),
  INDEX `research_paper_authors_author_order_idx` (`author_order`),
  CONSTRAINT `research_paper_authors_draft_id_fkey` FOREIGN KEY (`draft_id`) REFERENCES `research_paper_drafts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `research_paper_sections` (
  `id` VARCHAR(191) NOT NULL,
  `draft_id` VARCHAR(191) NOT NULL,
  `heading` VARCHAR(500) NOT NULL,
  `content` LONGTEXT NOT NULL,
  `section_order` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  INDEX `research_paper_sections_draft_id_idx` (`draft_id`),
  INDEX `research_paper_sections_section_order_idx` (`section_order`),
  CONSTRAINT `research_paper_sections_draft_id_fkey` FOREIGN KEY (`draft_id`) REFERENCES `research_paper_drafts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
