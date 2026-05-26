CREATE TABLE IF NOT EXISTS `journals` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(500) NOT NULL,
  `abbreviation` VARCHAR(50) NOT NULL,
  `website` VARCHAR(500) NULL,
  `issn_print` VARCHAR(50) NULL,
  `issn_online` VARCHAR(50) NULL,
  `origin` VARCHAR(100) NULL,
  `doi_allotted` BOOLEAN NOT NULL DEFAULT false,
  `is_default` BOOLEAN NOT NULL DEFAULT false,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY `journals_abbreviation_key` (`abbreviation`),
  INDEX `journals_is_active_idx` (`is_active`),
  INDEX `journals_is_default_idx` (`is_default`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
