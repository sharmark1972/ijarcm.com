export interface ResearchPaperPdfSection {
  heading: string;
  content: string;
}

export interface ResearchPaperPdfAuthor {
  name: string;
  affiliation?: string;
  email?: string;
}

export interface ResearchPaperPdfData {
  journal: {
    name: string;
    shortName: string;
    issnPrint: string;
    issnOnline: string;
    website: string;
    logoUrl: string;
  };
  issue: {
    volume: string;
    issue: string;
    month: string;
    year: string;
  };
  paper: {
    title: string;
    shortTitle: string;
    type: string;
    category: string;
    doi?: string;
    receivedDate: string;
    acceptedDate: string;
    publishedDate: string;
    authors: ResearchPaperPdfAuthor[];
    abstract: string;
    keywords: string[];
    sections: ResearchPaperPdfSection[];
  };
}

export const sampleResearchPaperPdfData: ResearchPaperPdfData = {
  journal: {
    name: 'International Journal of Academic Research in Commerce & Management',
    shortName: 'IJARCM',
    issnPrint: '2455-0116',
    issnOnline: '2395-6410',
    website: 'www.ijarcm.com',
    logoUrl: '/ijarcm_logo.png',
  },
  issue: {
    volume: '12',
    issue: '2',
    month: 'May',
    year: '2026',
  },
  paper: {
    title: 'Vedic Maths in Promoting a Global Perspective on Mathematical Thinking',
    shortTitle: 'Vedic Maths and Global Mathematical Thinking',
    type: 'Review Paper',
    category: 'Education',
    doi: '10.32628/IJARCM.2026.1202.001',
    receivedDate: '12 March 2026',
    acceptedDate: '28 April 2026',
    publishedDate: 'May 2026',
    authors: [
      {
        name: 'Richa Krishna Sharma',
        affiliation: 'Department of Education, Academic Research Scholar',
        email: 'author@example.com',
      },
      {
        name: 'Dr. Anil Kumar',
        affiliation: 'Professor, Department of Mathematics Education',
      },
    ],
    abstract:
      'This paper examines the role of Vedic Mathematics in developing flexible, culturally informed, and globally relevant mathematical thinking. It highlights how traditional computational methods can support confidence, mental calculation, alternative reasoning, and interdisciplinary learning in contemporary education.',
    keywords: [
      'Vedic Mathematics',
      'Mathematical Thinking',
      'Global Perspective',
      'Education',
      'Cognitive Development',
    ],
    sections: [
      {
        heading: '1. Introduction',
        content:
          'Mathematics has long served as a universal language for reasoning, measurement, and problem solving. The inclusion of Vedic Mathematics in academic discussion introduces learners to alternative methods of calculation and encourages them to view mathematical knowledge through a wider cultural and historical lens.',
      },
      {
        heading: '2. Historical Background',
        content:
          'Vedic Mathematics is associated with a set of sutras that present concise approaches to arithmetic and algebraic operations. These methods have been discussed in relation to speed, pattern recognition, and mental flexibility. Their educational value lies not only in calculation but also in the confidence they can develop among learners.',
      },
      {
        heading: '3. Key Vedic Sutras and Applications',
        content:
          'Selected sutras provide compact techniques for multiplication, division, factorization, and equation solving. When introduced carefully, these techniques can complement standard mathematical instruction and help students compare multiple solution paths for the same problem.',
      },
      {
        heading: '4. Global Perspective on Mathematical Thinking',
        content:
          'A global perspective in mathematics education requires openness to knowledge systems across cultures. Vedic Mathematics can support this objective by placing Indian mathematical traditions in conversation with modern pedagogy and international approaches to problem solving.',
      },
      {
        heading: '5. Discussion',
        content:
          'The review suggests that Vedic Mathematics can be used as a supplementary instructional approach rather than a replacement for formal mathematics curricula. Its value is strongest when teachers connect techniques to conceptual understanding, reasoning, and reflective comparison.',
      },
      {
        heading: '6. Conclusion',
        content:
          'Vedic Mathematics has potential to enrich mathematical learning by promoting speed, flexibility, cultural awareness, and confidence. Its thoughtful integration can help learners appreciate mathematics as both a technical discipline and a shared global intellectual tradition.',
      },
      {
        heading: 'References',
        content:
          'Tirthaji, B. K. (1965). Vedic Mathematics. Motilal Banarsidass.\nSharma, R. (2022). Alternative approaches in mathematics education. Journal of Educational Methods, 8(2), 44-51.\nKumar, A. (2024). Cultural knowledge systems and mathematical reasoning. Academic Review of Education, 11(1), 18-29.',
      },
    ],
  },
};
