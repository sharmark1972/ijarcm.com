-- Add the missing section layout flag used by research paper drafts
ALTER TABLE `research_paper_sections`
  ADD COLUMN `is_full_width` BOOLEAN NOT NULL DEFAULT true AFTER `section_order`;
