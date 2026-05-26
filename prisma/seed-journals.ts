import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const journals = [
  {
    name: 'International Journal of Academic Research in Commerce and Management',
    abbreviation: 'IJARCM',
    website: 'https://ijarcm.com',
    issnPrint: '2455-0116',
    issnOnline: '2395-6410',
    origin: 'Indian',
    doiAllotted: true,
    isDefault: true,
  },
  {
    name: 'American Journal of Advanced Medical and Surgical Sciences',
    abbreviation: 'AJOAMS',
    website: 'https://ajoams.com',
    issnPrint: null,
    issnOnline: '3070-6017',
    origin: 'American',
    doiAllotted: true,
    isDefault: false,
  },
  {
    name: 'American Journal of Multidisciplinary AI and Technology',
    abbreviation: 'AJOMAIT',
    website: 'https://ajomait.com',
    issnPrint: null,
    issnOnline: '3069-5511',
    origin: 'American',
    doiAllotted: true,
    isDefault: false,
  },
  {
    name: 'INSIGHTONIX – Global Insights',
    abbreviation: 'INSIGHTONIX',
    website: 'https://insightonix.com',
    issnPrint: '3051-2336',
    issnOnline: '3051-2344',
    origin: 'Netherland',
    doiAllotted: true,
    isDefault: false,
  },
  {
    name: 'European Journal of Agricultural Sciences',
    abbreviation: 'EJOAS',
    website: 'https://ejoas.com',
    issnPrint: '3051-0082',
    issnOnline: '3051-0090',
    origin: 'Netherland',
    doiAllotted: true,
    isDefault: false,
  },
  {
    name: 'World Journal of Interdisciplinary Innovation Sciences',
    abbreviation: 'WJIIS',
    website: 'https://wjiis.com',
    issnPrint: null,
    issnOnline: '3108-2211',
    origin: 'Indian',
    doiAllotted: true,
    isDefault: false,
  },
  {
    name: 'International Journal of Pedagogy and Learning',
    abbreviation: 'IJIPAL',
    website: 'https://ijipal.com',
    issnPrint: null,
    issnOnline: '3108-2564',
    origin: 'Indian',
    doiAllotted: true,
    isDefault: false,
  },
  {
    name: 'International Journal of Legal Studies and Contemporary Law',
    abbreviation: 'IJLSCL',
    website: 'https://ijlscl.com',
    issnPrint: '3117-5198',
    issnOnline: '3117-5201',
    origin: 'Netherland',
    doiAllotted: true,
    isDefault: false,
  },
  {
    name: 'Global Journal of Computing and Artificial Intelligence',
    abbreviation: 'GJOCAI',
    website: 'https://gjocai.com',
    issnPrint: null,
    issnOnline: '3139-1095',
    origin: 'Indian',
    doiAllotted: false,
    isDefault: false,
  },
  {
    name: 'European Journal of Aerospace, Aviation and Maritime Spectrum Studies',
    abbreviation: 'EJAAMSS',
    website: 'http://ejaamss.com',
    issnPrint: null,
    issnOnline: '3142-9327',
    origin: 'American',
    doiAllotted: false,
    isDefault: false,
  },
  {
    name: 'European Journal of Food, Fashion and Allied Bio-Life Sciences',
    abbreviation: 'EJFFABLS',
    website: 'http://ejffabls.com',
    issnPrint: null,
    issnOnline: '3142-9513',
    origin: 'American',
    doiAllotted: false,
    isDefault: false,
  },
  {
    name: 'European Journal of Law, Interdisciplinary Legal Ethics and Jurisprudence Governance Practices',
    abbreviation: 'EJLIJEGP',
    website: null,
    issnPrint: null,
    issnOnline: '3143-0287',
    origin: 'American',
    doiAllotted: false,
    isDefault: false,
  },
  {
    name: 'European Journal of Integrative Medicinal and Allied Paramedical Spectrum Studies',
    abbreviation: 'EJIMAP',
    website: null,
    issnPrint: null,
    issnOnline: '3143-035X',
    origin: 'American',
    doiAllotted: false,
    isDefault: false,
  },
  {
    name: 'European Journal of Ayurvedic, Unani and Interdisciplinary Pharmaceuticals & Allopathic Review',
    abbreviation: 'EJAUIPAR',
    website: null,
    issnPrint: null,
    issnOnline: '3143-0503',
    origin: 'American',
    doiAllotted: false,
    isDefault: false,
  },
];

async function main() {
  console.log('Seeding journals...');
  for (const journal of journals) {
    await prisma.journal.upsert({
      where: { abbreviation: journal.abbreviation },
      update: journal,
      create: journal,
    });
    console.log(`✓ ${journal.abbreviation}`);
  }
  console.log('Done seeding journals.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
