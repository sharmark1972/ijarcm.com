import {
  ResearchPaperDraft,
  ResearchPaperIssue,
  ResearchSection,
} from '@/types/research-paper-workflow';

export const mockIssues: ResearchPaperIssue[] = [
  {
    id: 'issue-2026-05',
    title: 'International Journal of Research Advances',
    volume: '11',
    issueNumber: '2',
    year: 2026,
    isPublished: true,
  },
  {
    id: 'issue-2026-06',
    title: 'Journal of Emerging Academic Studies',
    volume: '12',
    issueNumber: '1',
    year: 2026,
    isPublished: true,
  },
  {
    id: 'issue-2026-07',
    title: 'Advanced Interdisciplinary Review',
    volume: '12',
    issueNumber: '2',
    year: 2026,
    isPublished: true,
  },
];

const section = (
  id: string,
  heading: string,
  original: string,
  cleaned: string,
  notes: string[],
  status: ResearchSection['status'] = 'complete',
): ResearchSection => ({
  id,
  heading,
  original,
  cleaned,
  notes,
  status,
});

export type ResearchSampleKey = 'earthworm' | 'vedic' | 'omnichannel';

export const sampleDrafts: Record<ResearchSampleKey, ResearchPaperDraft> = {
  earthworm: {
    jobId: 'demo-earthworm-001',
    fileName: 'jaspreet agriculture journal 5 march published.docx',
    fileSize: 677349,
    detectedMode: 'implementation',
    confidence: 0.96,
    title: 'The Earthworm-Mediated Soil Process Transformation: An Ecological Implementation in Agriculture',
    abstract:
      'A field-based study exploring how earthworm activity improves soil structure, nutrient cycling, and organic matter stabilization in intensively cultivated agricultural land.',
    keywords: [
      'Earthworm-mediated soil processes',
      'Ecological implementation',
      'Vermiculture',
      'Soil ecosystem engineering',
      'Sustainable agriculture',
    ],
    authors: [
      { name: 'Jaspreet Kaur', corresponding: true },
      { name: 'Dr. Navpreet Kaur', email: '', corresponding: false },
    ],
    category: 'Agriculture',
    issueId: 'issue-2026-05',
    doi: '10.32628/demo.2026.001',
    similarityScore: 18,
    bodyColumnMode: 'two-column',
    sections: [
      section(
        'abstract',
        'Abstract',
        'Field observations suggest that earthworms can restore soil biological activity and improve physical resilience.',
        'Field observations suggest that earthworms can restore soil biological activity and improve physical resilience through biological soil management.',
        ['Reduce redundancy', 'Add citation support in final pass'],
      ),
      section(
        'introduction',
        '1. Introduction',
        'Soil degradation has accelerated because of intensive agriculture and heavy chemical dependence.',
        'Soil degradation has accelerated because of intensive agriculture, heavy chemical dependence, and declining biological activity.',
        ['Strengthen problem statement', 'Link to study objectives'],
      ),
      section(
        'literature-review',
        '2. Literature Review',
        'Earthworms are ecosystem engineers and improve porosity, aggregation, and carbon stabilization.',
        'Earthworms function as ecosystem engineers and contribute to porosity, aggregation, and carbon stabilization.',
        ['Add more citation anchors', 'Shorten repetitive phrasing'],
      ),
      section(
        'materials-methods',
        '3. Materials and Methods',
        'The study used 40 earthworms and periodic soil observations across treated and control plots.',
        'The study used 40 earthworms and periodic soil observations across treated and control plots under managed agricultural conditions.',
        ['Clarify sampling procedure', 'Keep field metrics consistent'],
      ),
      section(
        'results',
        '4. Results',
        'Earthworm activity improved soil aggregation and reduced compaction in treated plots.',
        'Earthworm activity improved soil aggregation and reduced compaction in treated plots.',
        ['Preserve numeric findings', 'Tighten reporting style'],
      ),
      section(
        'discussion',
        '5. Discussion',
        'Integrated vermiculture practices produced stronger soil health outcomes than isolated interventions.',
        'Integrated vermiculture practices produced stronger soil health outcomes than isolated interventions and support process-based soil management.',
        ['Connect results to literature', 'Add limitations note'],
      ),
      section(
        'conclusion',
        '6. Conclusion',
        'Earthworm-based interventions offer a low-cost and scalable path for sustainable agriculture.',
        'Earthworm-based interventions offer a low-cost and scalable path for sustainable agriculture.',
        ['Conclude with impact statement'],
      ),
      section(
        'references',
        'References',
        'Lavelle, P. (1997). Earthworm activities and soil structure...',
        'Lavelle, P. (1997). Earthworm activities and soil structure...',
        ['Normalize reference style', 'Check citation completeness'],
      ),
    ],
  },
  vedic: {
    jobId: 'demo-vedic-002',
    fileName: 'Vedic_Maths_in_Promoting_a_Global_Perspective_on_Mathematical_Thinking.docx',
    fileSize: 35655,
    detectedMode: 'review',
    confidence: 0.93,
    title: 'Vedic Maths in Promoting a Global Perspective on Mathematical Thinking',
    abstract:
      'A review paper showing how Vedic Mathematics supports flexible calculation, intercultural understanding, and modern mathematical thinking.',
    keywords: [
      'Vedic Mathematics',
      'Global mathematical thinking',
      'Cognitive development',
      'Mathematics education',
      'Cultural integration',
    ],
    authors: [
      { name: 'Richa Krishna Sharma', corresponding: true },
    ],
    category: 'Education',
    issueId: 'issue-2026-06',
    similarityScore: 12,
    bodyColumnMode: 'two-column',
    sections: [
      section(
        'abstract',
        'Abstract',
        'This review explores how Vedic Mathematics builds flexible and globally relevant mathematical reasoning.',
        'This review explores how Vedic Mathematics builds flexible and globally relevant mathematical reasoning.',
        ['Tighten abstract language'],
      ),
      section(
        'introduction',
        '1. Introduction',
        'Mathematics is a language that transcends all boundaries and can be taught from multiple cultural perspectives.',
        'Mathematics is a language that transcends all boundaries and can be taught from multiple cultural perspectives.',
        ['Improve opening hook'],
      ),
      section(
        'historical-background',
        '2. Historical Background',
        'The literature emphasizes historical foundations, pedagogical use, and computational relevance.',
        'The literature emphasizes historical foundations, pedagogical use, and computational relevance.',
        ['Expand sub-themes', 'Add citation normalization'],
      ),
      section(
        'key-sutras',
        '3. Key Vedic Sutras and Applications',
        'Vedic sutras provide compact mental methods for arithmetic and algebraic reasoning.',
        'Vedic sutras provide compact mental methods for arithmetic and algebraic reasoning.',
        ['Keep examples concise'],
      ),
      section(
        'global-perspective',
        '4. Global Perspective on Mathematical Thinking',
        'Vedic methods improve speed, confidence, and alternative problem-solving approaches.',
        'Vedic methods improve speed, confidence, and alternative problem-solving approaches.',
        ['Convert to analytical tone'],
      ),
      section(
        'discussion',
        '5. Discussion',
        'The review argues that Vedic Maths can bridge Eastern and Western approaches to learning.',
        'The review argues that Vedic Maths can bridge Eastern and Western approaches to learning.',
        ['Strengthen implications'],
      ),
      section(
        'conclusion',
        '6. Conclusion',
        'Vedic Mathematics can serve as a global intellectual connector.',
        'Vedic Mathematics can serve as a global intellectual connector.',
        ['End with concise synthesis'],
      ),
      section(
        'references',
        'References',
        'Selected studies on Vedic mathematics and mathematical education.',
        'Selected studies on Vedic mathematics and mathematical education.',
        ['Standardize citations'],
      ),
    ],
  },
  omnichannel: {
    jobId: 'demo-omnichannel-003',
    fileName: 'IJSRHSS25324.pdf',
    fileSize: 251602,
    detectedMode: 'implementation',
    confidence: 0.89,
    title: 'Omnichannel Marketing and Its Influence on Customer Satisfaction',
    abstract:
      'An applied paper examining how integrated customer journeys improve satisfaction, loyalty, and retention.',
    keywords: [
      'Omnichannel Marketing',
      'Customer Satisfaction',
      'Digital Media',
      'Communication Strategies',
      'Loyalty',
    ],
    authors: [
      { name: 'Mrs. Lucky', corresponding: true },
    ],
    category: 'Business',
    issueId: 'issue-2026-07',
    doi: '10.32628/demo.2026.002',
    similarityScore: 21,
    bodyColumnMode: 'two-column',
    sections: [
      section(
        'abstract',
        'Abstract',
        'The paper studies omnichannel customer satisfaction using survey data and report-based evidence.',
        'The paper studies omnichannel customer satisfaction using survey data and report-based evidence.',
        ['Condense repetitive wording'],
      ),
      section(
        'introduction',
        '1. Introduction',
        'Omnichannel marketing creates a seamless experience across digital and physical channels.',
        'Omnichannel marketing creates a seamless experience across digital and physical channels.',
        ['Strengthen bridge statement'],
      ),
      section(
        'literature-review',
        '2. Literature Review',
        'Existing studies show consistency, synchronization, and personalization improve satisfaction.',
        'Existing studies show consistency, synchronization, and personalization improve satisfaction.',
        ['Normalize study summaries'],
      ),
      section(
        'research-methodology',
        '3. Research Methodology',
        'The study combines secondary reports with a survey of 45 respondents.',
        'The study combines secondary reports with a survey of 45 respondents.',
        ['Clarify sample and instruments'],
      ),
      section(
        'data-analysis',
        '4. Data Analysis',
        'Findings show stronger retention and purchase intent when channels are integrated.',
        'Findings show stronger retention and purchase intent when channels are integrated.',
        ['Keep metrics readable'],
      ),
      section(
        'findings',
        '5. Findings',
        'Unified communication and real-time support enhance satisfaction across channels.',
        'Unified communication and real-time support enhance satisfaction across channels.',
        ['Explain business implications'],
      ),
      section(
        'managerial-implications',
        '6. Managerial Implications',
        'Brands should unify communication, support, and campaign data across channels.',
        'Brands should unify communication, support, and campaign data across channels.',
        ['Keep recommendation language formal'],
      ),
      section(
        'conclusion',
        '7. Conclusion',
        'Omnichannel strategy significantly improves customer satisfaction and loyalty.',
        'Omnichannel strategy significantly improves customer satisfaction and loyalty.',
        ['End with practical takeaway'],
      ),
      section(
        'references',
        'References',
        'Representative references on omnichannel strategy and satisfaction.',
        'Representative references on omnichannel strategy and satisfaction.',
        ['Style references in APA format'],
      ),
    ],
  },
};

export const sampleOrder = ['earthworm', 'vedic', 'omnichannel'] as const;

export function cloneSampleDraft(sampleKey: keyof typeof sampleDrafts): ResearchPaperDraft {
  return structuredClone(sampleDrafts[sampleKey]);
}
