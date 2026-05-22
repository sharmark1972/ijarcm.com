import { NextRequest, NextResponse } from 'next/server';

// Citation format types
type CitationFormat = 'apa' | 'mla' | 'chicago' | 'harvard' | 'vancouver';

interface CitationSource {
  type: 'book' | 'journal' | 'website' | 'newspaper' | 'magazine' | 'conference';
  authors?: Array<{first: string, last: string}>;
  title: string;
  year?: string;
  publisher?: string;
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  url?: string;
  doi?: string;
  accessed?: string;
  edition?: string;
  city?: string;
}

// Format authors for different citation styles
function formatAuthors(authors: Array<{first: string, last: string}>, format: CitationFormat, maxAuthors: number = 6): string {
  if (!authors || authors.length === 0) return '';
  
  const authorsToUse = authors.slice(0, maxAuthors);
  
  switch (format) {
    case 'apa':
      if (authorsToUse.length === 1) {
        return `${authorsToUse[0].last}, ${authorsToUse[0].first.charAt(0)}.`;
      } else if (authorsToUse.length === 2) {
        return `${authorsToUse[0].last}, ${authorsToUse[0].first.charAt(0)}., & ${authorsToUse[1].last}, ${authorsToUse[1].first.charAt(0)}.`;
      } else {
        return `${authorsToUse[0].last}, ${authorsToUse[0].first.charAt(0)}., et al.`;
      }
      
    case 'mla':
      if (authorsToUse.length === 1) {
        return `${authorsToUse[0].last}, ${authorsToUse[0].first}.`;
      } else if (authorsToUse.length === 2) {
        return `${authorsToUse[0].last}, ${authorsToUse[0].first}, and ${authorsToUse[1].last}, ${authorsToUse[1].first}.`;
      } else if (authorsToUse.length === 3) {
        return `${authorsToUse[0].last}, ${authorsToUse[0].first}, ${authorsToUse[1].last}, ${authorsToUse[1].first}, and ${authorsToUse[2].last}, ${authorsToUse[2].first}.`;
      } else {
        return `${authorsToUse[0].last}, ${authorsToUse[0].first}, et al.`;
      }
      
    case 'chicago':
      if (authorsToUse.length === 1) {
        return `${authorsToUse[0].last}, ${authorsToUse[0].first}.`;
      } else if (authorsToUse.length === 2) {
        return `${authorsToUse[0].last}, ${authorsToUse[0].first}, and ${authorsToUse[1].last}, ${authorsToUse[1].first}.`;
      } else if (authorsToUse.length === 3) {
        return `${authorsToUse[0].last}, ${authorsToUse[0].first}, ${authorsToUse[1].last}, ${authorsToUse[1].first}, and ${authorsToUse[2].last}, ${authorsToUse[2].first}.`;
      } else {
        return `${authorsToUse[0].last}, ${authorsToUse[0].first}, et al.`;
      }
      
    case 'harvard':
      if (authorsToUse.length === 1) {
        return `${authorsToUse[0].last}, ${authorsToUse[0].first.charAt(0)}.`;
      } else if (authorsToUse.length === 2) {
        return `${authorsToUse[0].last}, ${authorsToUse[0].first.charAt(0)}. and ${authorsToUse[1].last}, ${authorsToUse[1].first.charAt(0)}.`;
      } else if (authorsToUse.length === 3) {
        return `${authorsToUse[0].last}, ${authorsToUse[0].first.charAt(0)}., ${authorsToUse[1].last}, ${authorsToUse[1].first.charAt(0)}. and ${authorsToUse[2].last}, ${authorsToUse[2].first.charAt(0)}.`;
      } else {
        return `${authorsToUse[0].last}, ${authorsToUse[0].first.charAt(0)}. et al.`;
      }
      
    case 'vancouver':
      return authorsToUse.map(a => `${a.last} ${a.first.charAt(0)}`).join(', ');
      
    default:
      return authorsToUse.map(a => `${a.last}, ${a.first}`).join(', ');
  }
}

// Generate APA citation
function generateAPA(source: CitationSource): string {
  const authors = formatAuthors(source.authors || [], 'apa');
  
  switch (source.type) {
    case 'book':
      return `${authors} (${source.year}). <em>${source.title}</em> (${source.edition ? `${source.edition} ed.` : ''}). ${source.publisher}${source.city ? `, ${source.city}` : ''}.`;
      
    case 'journal':
      return `${authors} (${source.year}). ${source.title}. <em>${source.journal}</em>, <em>${source.volume}</em>${source.issue ? `(${source.issue})` : ''}, ${source.pages}.`;
      
    case 'website':
      return `${authors} (${source.year || 'n.d.'}). ${source.title}. Retrieved ${source.accessed || new Date().toLocaleDateString()}, from ${source.url}`;
      
    case 'newspaper':
      return `${authors} (${source.year}). ${source.title}. <em>${source.publisher}</em>, ${source.pages}.`;
      
    case 'magazine':
      return `${authors} (${source.year}). ${source.title}. <em>${source.publisher}</em>, ${source.volume}${source.issue ? `(${source.issue})` : ''}, ${source.pages}.`;
      
    case 'conference':
      return `${authors} (${source.year}). ${source.title}. In <em>Proceedings of ${source.publisher}</em> (pp. ${source.pages}).`;
      
    default:
      return `${authors} (${source.year}). ${source.title}.`;
  }
}

// Generate MLA citation
function generateMLA(source: CitationSource): string {
  const authors = formatAuthors(source.authors || [], 'mla');
  
  switch (source.type) {
    case 'book':
      return `${authors}. <em>${source.title}</em>. ${source.publisher}${source.year ? `, ${source.year}` : ''}.`;
      
    case 'journal':
      return `${authors}. "${source.title}." <em>${source.journal}</em>, vol. ${source.volume}, no. ${source.issue}, ${source.year}, pp. ${source.pages}.`;
      
    case 'website':
      return `${authors}. "${source.title}." <em>${source.publisher}</em>${source.year ? `, ${source.year}` : ''}, ${source.url}. Accessed ${source.accessed || new Date().toLocaleDateString()}.`;
      
    case 'newspaper':
      return `${authors}. "${source.title}." <em>${source.publisher}</em>, ${source.year}, ${source.pages}.`;
      
    case 'magazine':
      return `${authors}. "${source.title}." <em>${source.publisher}</em>, ${source.year}, pp. ${source.pages}.`;
      
    case 'conference':
      return `${authors}. "${source.title}." <em>${source.publisher}</em>, ${source.year}, pp. ${source.pages}.`;
      
    default:
      return `${authors}. "${source.title}."`;
  }
}

// Generate Chicago citation
function generateChicago(source: CitationSource): string {
  const authors = formatAuthors(source.authors || [], 'chicago');
  
  switch (source.type) {
    case 'book':
      return `${authors}. ${source.title}. ${source.city ? `${source.city}: ` : ''}${source.publisher}, ${source.year}.`;
      
    case 'journal':
      return `${authors}. "${source.title}." <em>${source.journal}</em> ${source.volume}, no. ${source.issue} (${source.year}): ${source.pages}.`;
      
    case 'website':
      return `${authors}. "${source.title}." ${source.publisher}. Accessed ${source.accessed || new Date().toLocaleDateString()}. ${source.url}.`;
      
    case 'newspaper':
      return `${authors}. "${source.title}." <em>${source.publisher}</em>, ${source.pages}.`;
      
    case 'magazine':
      return `${authors}. "${source.title}." <em>${source.publisher}</em>, ${source.pages}.`;
      
    case 'conference':
      return `${authors}. "${source.title}." Paper presented at ${source.publisher}, ${source.year}.`;
      
    default:
      return `${authors}. ${source.title}.`;
  }
}

// Generate Harvard citation
function generateHarvard(source: CitationSource): string {
  const authors = formatAuthors(source.authors || [], 'harvard');
  
  switch (source.type) {
    case 'book':
      return `${authors} (${source.year}) <em>${source.title}</em>. ${source.city ? `${source.city}: ` : ''}${source.publisher}.`;
      
    case 'journal':
      return `${authors} (${source.year}) '${source.title}', <em>${source.journal}</em>, ${source.volume}(${source.issue}), pp. ${source.pages}.`;
      
    case 'website':
      return `${authors} (${source.year || 'n.d.'}) <em>${source.title}</em>. [online] Available at: ${source.url} [Accessed ${source.accessed || new Date().toLocaleDateString()}].`;
      
    case 'newspaper':
      return `${authors} (${source.year}) '${source.title}', <em>${source.publisher}</em>, ${source.pages}.`;
      
    case 'magazine':
      return `${authors} (${source.year}) '${source.title}', <em>${source.publisher}</em>, ${source.pages}.`;
      
    case 'conference':
      return `${authors} (${source.year}) '${source.title}', in <em>Proceedings of ${source.publisher}</em>, pp. ${source.pages}.`;
      
    default:
      return `${authors} (${source.year}) ${source.title}.`;
  }
}

// Generate Vancouver citation
function generateVancouver(source: CitationSource): string {
  const authors = formatAuthors(source.authors || [], 'vancouver');
  
  switch (source.type) {
    case 'book':
      return `${authors}. ${source.title}. ${source.city ? `${source.city}: ` : ''}${source.publisher}; ${source.year}.`;
      
    case 'journal':
      return `${authors}. ${source.title}. ${source.journal}. ${source.year};${source.volume}(${source.issue}):${source.pages}.`;
      
    case 'website':
      return `${authors}. ${source.title} [Internet]. ${source.publisher}; ${source.year || 'cited ' + new Date().getFullYear()} [updated ${source.year}]. Available from: ${source.url}.`;
      
    case 'newspaper':
      return `${authors}. ${source.title}. ${source.publisher}. ${source.pages}.`;
      
    case 'magazine':
      return `${authors}. ${source.title}. ${source.publisher}. ${source.pages}.`;
      
    case 'conference':
      return `${authors}. ${source.title}. In: ${source.publisher}; ${source.year}. p. ${source.pages}.`;
      
    default:
      return `${authors}. ${source.title}.`;
  }
}

// Generate in-text citation
function generateInTextCitation(source: CitationSource, format: CitationFormat, position: number = 1): string {
  if (!source.authors || source.authors.length === 0) return `(${source.year || 'n.d.'})`;
  
  const firstAuthor = source.authors[0];
  const year = source.year || 'n.d.';
  
  switch (format) {
    case 'apa':
      if (source.authors.length === 1) {
        return position === 1 ? `(${firstAuthor.last}, ${year})` : `${firstAuthor.last} (${year})`;
      } else if (source.authors.length === 2) {
        return `(${firstAuthor.last} & ${source.authors[1].last}, ${year})`;
      } else {
        return `(${firstAuthor.last} et al., ${year})`;
      }
      
    case 'mla':
      if (source.authors.length === 1) {
        return `(${firstAuthor.last} ${year})`;
      } else if (source.authors.length === 2) {
        return `(${firstAuthor.last} and ${source.authors[1].last} ${year})`;
      } else {
        return `(${firstAuthor.last} et al. ${year})`;
      }
      
    case 'chicago':
      if (source.authors.length === 1) {
        return position === 1 ? `(${firstAuthor.last} ${year})` : `${firstAuthor.last} (${year})`;
      } else if (source.authors.length === 2) {
        return `(${firstAuthor.last} and ${source.authors[1].last} ${year})`;
      } else {
        return `(${firstAuthor.last} et al. ${year})`;
      }
      
    case 'harvard':
      if (source.authors.length === 1) {
        return position === 1 ? `(${firstAuthor.last}, ${year})` : `${firstAuthor.last} (${year})`;
      } else if (source.authors.length === 2) {
        return `(${firstAuthor.last} and ${source.authors[1].last}, ${year})`;
      } else {
        return `(${firstAuthor.last} et al., ${year})`;
      }
      
    case 'vancouver':
      return `(1)`; // Vancouver uses numeric citations
      
    default:
      return `(${firstAuthor.last}, ${year})`;
  }
}

// Main citation generator function
function generateCitation(source: CitationSource, format: CitationFormat): string {
  switch (format) {
    case 'apa':
      return generateAPA(source);
    case 'mla':
      return generateMLA(source);
    case 'chicago':
      return generateChicago(source);
    case 'harvard':
      return generateHarvard(source);
    case 'vancouver':
      return generateVancouver(source);
    default:
      return generateAPA(source);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { source, format = 'apa' } = await request.json();
    
    if (!source || !source.title) {
      return NextResponse.json(
        { error: 'Invalid input. Please provide at least a title.' },
        { status: 400 }
      );
    }
    
    const validFormats: CitationFormat[] = ['apa', 'mla', 'chicago', 'harvard', 'vancouver'];
    if (!validFormats.includes(format as CitationFormat)) {
      return NextResponse.json(
        { error: 'Invalid format. Use apa, mla, chicago, harvard, or vancouver.' },
        { status: 400 }
      );
    }
    
    const validTypes = ['book', 'journal', 'website', 'newspaper', 'magazine', 'conference'];
    if (source.type && !validTypes.includes(source.type)) {
      return NextResponse.json(
        { error: 'Invalid source type. Use book, journal, website, newspaper, magazine, or conference.' },
        { status: 400 }
      );
    }
    
    // Generate citation
    const citation = generateCitation(source as CitationSource, format as CitationFormat);
    const inTextCitation = generateInTextCitation(source as CitationSource, format as CitationFormat);
    
    return NextResponse.json({
      citation,
      inTextCitation,
      format: format.toUpperCase(),
      sourceType: source.type || 'general',
      source,
    });
  } catch (error) {
    console.error('Citation generator error:', error);
    return NextResponse.json(
      { error: 'Failed to generate citation. Please try again.' },
      { status: 500 }
    );
  }
}
