import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('\n=== DELETING RESEARCH PAPERS ===\n');

    // First, get count before deletion
    const draftCount = await prisma.researchPaperDraft.count();
    const authorCount = await prisma.researchPaperAuthor.count();
    const sectionCount = await prisma.researchPaperSection.count();

    console.log('Before deletion:');
    console.log(`  ResearchPaperDraft: ${draftCount}`);
    console.log(`  ResearchPaperAuthor: ${authorCount}`);
    console.log(`  ResearchPaperSection: ${sectionCount}\n`);

    // Delete in order (cascade should handle it, but explicit is safer)
    const deletedSections = await prisma.researchPaperSection.deleteMany({});
    console.log(`✓ Deleted ${deletedSections.count} sections`);

    const deletedAuthors = await prisma.researchPaperAuthor.deleteMany({});
    console.log(`✓ Deleted ${deletedAuthors.count} authors`);

    const deletedDrafts = await prisma.researchPaperDraft.deleteMany({});
    console.log(`✓ Deleted ${deletedDrafts.count} drafts\n`);

    // Verify deletion
    const finalDraftCount = await prisma.researchPaperDraft.count();
    const finalAuthorCount = await prisma.researchPaperAuthor.count();
    const finalSectionCount = await prisma.researchPaperSection.count();

    console.log('After deletion:');
    console.log(`  ResearchPaperDraft: ${finalDraftCount}`);
    console.log(`  ResearchPaperAuthor: ${finalAuthorCount}`);
    console.log(`  ResearchPaperSection: ${finalSectionCount}\n`);

    if (finalDraftCount === 0 && finalAuthorCount === 0 && finalSectionCount === 0) {
      console.log('✅ All research papers deleted successfully!\n');
    } else {
      console.log('⚠️ Some records remain. Check database.\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
