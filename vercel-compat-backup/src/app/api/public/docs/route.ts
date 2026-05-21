import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'html';

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003';

  const apiDocs = {
    title: 'IJARCM Public API Documentation',
    version: '1.0.0',
    description: 'Public API for accessing published papers from the International Journal of Research and Current Affairs in Management',
    baseUrl,
    endpoints: {
      papers: {
        list: {
          method: 'GET',
          path: '/api/public/papers',
          description: 'Get a list of published papers with optional filtering and pagination',
          parameters: {
            query: {
              type: 'string',
              description: 'Search term to filter papers by title, abstract, keywords, or author names',
              required: false,
              example: 'machine learning'
            },
            category: {
              type: 'string',
              description: 'Filter papers by category',
              required: false,
              example: 'Computer Science'
            },
            author: {
              type: 'string',
              description: 'Filter papers by author name',
              required: false,
              example: 'John Doe'
            },
            dateFrom: {
              type: 'string',
              description: 'Filter papers published after this date (YYYY-MM-DD format)',
              required: false,
              example: '2023-01-01'
            },
            dateTo: {
              type: 'string',
              description: 'Filter papers published before this date (YYYY-MM-DD format)',
              required: false,
              example: '2023-12-31'
            },
            sortBy: {
              type: 'string',
              description: 'Sort papers by field',
              required: false,
              enum: ['relevance', 'date', 'downloads', 'title'],
              default: 'date'
            },
            sortOrder: {
              type: 'string',
              description: 'Sort order',
              required: false,
              enum: ['asc', 'desc'],
              default: 'desc'
            },
            page: {
              type: 'number',
              description: 'Page number for pagination',
              required: false,
              default: 1,
              example: 1
            },
            limit: {
              type: 'number',
              description: 'Number of papers per page (max 50)',
              required: false,
              default: 20,
              example: 20
            },
            apiKey: {
              type: 'string',
              description: 'API key for authentication (optional but recommended)',
              required: false,
              example: 'ijarcm_abc123...'
            }
          },
          response: {
            success: true,
            data: {
              papers: [
                {
                  id: 'paper-id',
                  title: 'Paper Title',
                  abstract: 'Paper abstract...',
                  keywords: ['keyword1', 'keyword2'],
                  category: 'Computer Science',
                  publishedAt: '2023-06-15T00:00:00.000Z',
                  authors: [
                    {
                      name: 'John Doe',
                      institution: 'University Name'
                    }
                  ],
                  averageRating: 4.5,
                  downloadCount: 125,
                  reviewCount: 3,
                  issue: {
                    id: 'issue-id',
                    title: 'Issue Title',
                    volume: '1',
                    issueNumber: '1',
                    year: 2023,
                    publishDate: '2023-06-01T00:00:00.000Z'
                  }
                }
              ],
              pagination: {
                currentPage: 1,
                totalPages: 5,
                totalCount: 100,
                hasNextPage: true,
                hasPrevPage: false,
                limit: 20
              }
            },
            meta: {
              source: 'IJARCM Public API',
              version: '1.0.0',
              timestamp: '2023-06-15T12:00:00.000Z'
            }
          }
        },
        details: {
          method: 'GET',
          path: '/api/public/papers/{id}',
          description: 'Get detailed information about a specific paper',
          parameters: {
            id: {
              type: 'string',
              description: 'Paper ID',
              required: true,
              example: 'paper-id'
            },
            apiKey: {
              type: 'string',
              description: 'API key for authentication (optional but recommended)',
              required: false,
              example: 'ijarcm_abc123...'
            }
          },
          response: {
            success: true,
            data: {
              id: 'paper-id',
              title: 'Paper Title',
              abstract: 'Paper abstract...',
              keywords: ['keyword1', 'keyword2'],
              category: 'Computer Science',
              publishedAt: '2023-06-15T00:00:00.000Z',
              authors: [
                {
                  name: 'John Doe',
                  institution: 'University Name',
                  order: 1,
                  isCorresponding: true
                }
              ],
              averageRating: 4.5,
              downloadCount: 125,
              reviewCount: 3,
              issue: {
                id: 'issue-id',
                title: 'Issue Title',
                volume: '1',
                issueNumber: '1',
                year: 2023,
                publishDate: '2023-06-01T00:00:00.000Z'
              }
            },
            meta: {
              source: 'IJARCM Public API',
              version: '1.0.0',
              timestamp: '2023-06-15T12:00:00.000Z'
            }
          }
        }
      },
      authentication: {
        apiKey: {
          method: 'POST',
          path: '/api/public/auth',
          description: 'Generate a new API key (admin only)',
          parameters: {
            name: {
              type: 'string',
              description: 'Name for the API key',
              required: true,
              example: 'My Website API'
            },
            description: {
              type: 'string',
              description: 'Description of the API key usage',
              required: false,
              example: 'API for my academic website'
            },
            rateLimit: {
              type: 'number',
              description: 'Custom rate limit per minute (1-1000)',
              required: false,
              default: 100,
              example: 200
            },
            allowedOrigins: {
              type: 'array',
              description: 'List of allowed origins for this API key',
              required: false,
              example: ['https://mywebsite.com']
            }
          },
          response: {
            success: true,
            data: {
              id: 'key_1234567890',
              name: 'My Website API',
              description: 'API for my academic website',
              apiKey: 'ijarcm_abc123...', // Only shown once
              rateLimit: 200,
              allowedOrigins: ['https://mywebsite.com'],
              createdAt: '2023-06-15T00:00:00.000Z',
              isActive: true
            },
            message: 'API key created successfully. Save this key securely as it won\'t be shown again.'
          }
        },
        validate: {
          method: 'GET',
          path: '/api/public/auth',
          description: 'Validate an API key',
          parameters: {
            apiKey: {
              type: 'string',
              description: 'API key to validate',
              required: true,
              example: 'ijarcm_abc123...'
            }
          },
          response: {
            success: true,
            data: {
              isValid: true,
              apiKey: 'ijarcm_abc1...' // Partial key for security
            }
          }
        }
      }
    },
    rateLimit: {
      description: 'API requests are rate limited to prevent abuse',
      defaultLimit: '100 requests per minute per IP address',
      customLimits: 'Custom rate limits can be set per API key',
      headers: {
        'X-RateLimit-Limit': 'Rate limit for the current period',
        'X-RateLimit-Remaining': 'Remaining requests in current period',
        'X-RateLimit-Reset': 'Timestamp when rate limit resets',
        'Retry-After': 'Seconds to wait before retrying (when rate limited)'
      }
    },
    errors: {
      common: {
        400: 'Bad Request - Invalid parameters',
        401: 'Unauthorized - Invalid API key',
        403: 'Forbidden - Insufficient permissions',
        404: 'Not Found - Resource not found',
        429: 'Too Many Requests - Rate limit exceeded',
        500: 'Internal Server Error'
      }
    },
    examples: {
      javascript: `
// Fetch all papers
fetch('${baseUrl}/api/public/papers')
  .then(response => response.json())
  .then(data => console.log(data));

// Search papers with filters
fetch('${baseUrl}/api/public/papers?query=machine learning&category=Computer Science&limit=10')
  .then(response => response.json())
  .then(data => console.log(data));

// Get specific paper
fetch('${baseUrl}/api/public/papers/paper-id')
  .then(response => response.json())
  .then(data => console.log(data));

// With API key
fetch('${baseUrl}/api/public/papers?apiKey=your-api-key-here')
  .then(response => response.json())
  .then(data => console.log(data));
      `,
      python: `
import requests

# Fetch all papers
response = requests.get('${baseUrl}/api/public/papers')
data = response.json()
print(data)

# Search papers with filters
response = requests.get('${baseUrl}/api/public/papers', params={
    'query': 'machine learning',
    'category': 'Computer Science',
    'limit': 10
})
data = response.json()
print(data)

# Get specific paper
response = requests.get('${baseUrl}/api/public/papers/paper-id')
data = response.json()
print(data)

# With API key
response = requests.get('${baseUrl}/api/public/papers', params={
    'apiKey': 'your-api-key-here'
})
data = response.json()
print(data)
      `,
      curl: `
# Fetch all papers
curl "${baseUrl}/api/public/papers"

# Search papers with filters
curl "${baseUrl}/api/public/papers?query=machine learning&category=Computer Science&limit=10"

# Get specific paper
curl "${baseUrl}/api/public/papers/paper-id"

# With API key
curl "${baseUrl}/api/public/papers?apiKey=your-api-key-here"
      `
    }
  };

  if (format === 'json') {
    return NextResponse.json(apiDocs);
  }

  // Return HTML documentation
  const htmlDoc = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${apiDocs.title}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; }
        h2 { color: #444; margin-top: 30px; }
        h3 { color: #555; }
        .endpoint { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 5px; padding: 15px; margin: 20px 0; }
        .method { display: inline-block; padding: 3px 8px; border-radius: 3px; color: white; font-weight: bold; }
        .get { background-color: #28a745; }
        .post { background-color: #007bff; }
        .path { font-family: monospace; background: #e9ecef; padding: 2px 5px; border-radius: 3px; }
        .param { margin: 10px 0; }
        .param-name { font-weight: bold; }
        .param-type { color: #666; font-style: italic; }
        .param-required { color: #dc3545; }
        .param-optional { color: #28a745; }
        .code { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 3px; padding: 10px; font-family: monospace; white-space: pre-wrap; overflow-x: auto; }
        .error { color: #dc3545; }
        .success { color: #28a745; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f22; }
    </style>
</head>
<body>
    <h1>${apiDocs.title} v${apiDocs.version}</h1>
    <p>${apiDocs.description}</p>
    <p><strong>Base URL:</strong> ${apiDocs.baseUrl}</p>
    
    <h2>Authentication</h2>
    <p>While the API works without authentication, using an API key is recommended for higher rate limits and better service. API keys can be generated by administrators.</p>
    
    <h2>Rate Limiting</h2>
    <p>${apiDocs.rateLimit.description}</p>
    <ul>
        <li>Default limit: ${apiDocs.rateLimit.defaultLimit}</li>
        <li>Custom limits: ${apiDocs.rateLimit.customLimits}</li>
    </ul>
    
    <h2>Endpoints</h2>
    
    <div class="endpoint">
        <h3><span class="method get">GET</span> <span class="path">${apiDocs.endpoints.papers.list.path}</span></h3>
        <p>${apiDocs.endpoints.papers.list.description}</p>
        
        <h4>Parameters</h4>
        <div class="param">
            <span class="param-name">query</span>
            <span class="param-type">(string)</span>
            <span class="param-optional">Optional</span>
            <p>Search term to filter papers by title, abstract, keywords, or author names</p>
            <p><strong>Example:</strong> machine learning</p>
        </div>
        <div class="param">
            <span class="param-name">category</span>
            <span class="param-type">(string)</span>
            <span class="param-optional">Optional</span>
            <p>Filter papers by category</p>
            <p><strong>Example:</strong> Computer Science</p>
        </div>
        <div class="param">
            <span class="param-name">author</span>
            <span class="param-type">(string)</span>
            <span class="param-optional">Optional</span>
            <p>Filter papers by author name</p>
            <p><strong>Example:</strong> John Doe</p>
        </div>
        <div class="param">
            <span class="param-name">page</span>
            <span class="param-type">(number)</span>
            <span class="param-optional">Optional</span>
            <p>Page number for pagination</p>
            <p><strong>Default:</strong> 1</p>
            <p><strong>Example:</strong> 1</p>
        </div>
        <div class="param">
            <span class="param-name">limit</span>
            <span class="param-type">(number)</span>
            <span class="param-optional">Optional</span>
            <p>Number of papers per page (max 50)</p>
            <p><strong>Default:</strong> 20</p>
            <p><strong>Example:</strong> 20</p>
        </div>
        <div class="param">
            <span class="param-name">apiKey</span>
            <span class="param-type">(string)</span>
            <span class="param-optional">Optional</span>
            <p>API key for authentication (optional but recommended)</p>
            <p><strong>Example:</strong> ijarcm_abc123...</p>
        </div>
    </div>
    
    <h2>Error Codes</h2>
    <table>
        <tr><th>Code</th><th>Description</th></tr>
        ${Object.entries(apiDocs.errors.common).map(([code, description]) => `
            <tr>
                <td class="error">${code}</td>
                <td>${description}</td>
            </tr>
        `).join('')}
    </table>
    
    <h2>Examples</h2>
    
    <h3>JavaScript</h3>
    <div class="code">${apiDocs.examples.javascript}</div>
    
    <h3>Python</h3>
    <div class="code">${apiDocs.examples.python}</div>
    
    <h3>cURL</h3>
    <div class="code">${apiDocs.examples.curl}</div>
</body>
</html>
  `;

  return new NextResponse(htmlDoc, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}