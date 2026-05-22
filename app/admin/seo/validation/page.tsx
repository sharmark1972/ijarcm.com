'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import GoogleScholarValidator, { 
  GoogleScholarValidationResult, 
  PaperMetadata 
} from '@/utils/googleScholarValidator';

interface ValidationHistory {
  id: string;
  timestamp: string;
  paperId: string;
  paperTitle: string;
  score: number;
  status: 'PASS' | 'FAIL' | 'NEEDS_IMPROVEMENT';
  issues: string[];
}

export default function GoogleScholarValidationPage() {
  const [validator] = useState(new GoogleScholarValidator());
  const [papers, setPapers] = useState<PaperMetadata[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<PaperMetadata | null>(null);
  const [validationResult, setValidationResult] = useState<GoogleScholarValidationResult | null>(null);
  const [validationHistory, setValidationHistory] = useState<ValidationHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Load papers on component mount
  useEffect(() => {
    loadPapers();
    loadValidationHistory();
  }, []);

  const loadPapers = async () => {
    try {
      const response = await fetch('/api/admin/papers');
      if (response.ok) {
        const data = await response.json();
        const formattedPapers = data.papers.map((paper) => ({
          id: paper.id,
          title: paper.title,
          abstract: paper.abstract || '',
          authors: paper.paperAuthors?.map((author) => ({
            name: `${author.user.firstName} ${author.user.lastName}`,
            affiliation: author.user.institution,
            email: author.user.email,
            orcid: author.orcid
          })) || [],
          publishedAt: paper.publishedAt || paper.createdAt,
          doi: paper.doi,
          journal: 'International Journal of Research in Computer Applications and Management',
          volume: paper.volumeNumber,
          issue: paper.issueNumber,
          pages: paper.pages,
          keywords: paper.keywords ? paper.keywords.split(',').map((k) => k.trim()) : [],
          pdfUrl: paper.pdfUrl,
          issn: '2455-0116'
        }));
        setPapers(formattedPapers);
      }
    } catch (error) {
      console.error('Failed to load papers:', error);
    }
  };

  const loadValidationHistory = async () => {
    try {
      const response = await fetch('/api/admin/seo/validation-history');
      if (response.ok) {
        const history = await response.json();
        setValidationHistory(history);
      }
    } catch (error) {
      console.error('Failed to load validation history:', error);
    }
  };

  const validatePaper = async (paper: PaperMetadata) => {
    setIsLoading(true);
    setSelectedPaper(paper);
    
    try {
      const result = await validator.validatePaper(paper);
      setValidationResult(result);
      
      // Save validation result to history
      const historyEntry: ValidationHistory = {
        id: Date.now().toString(),
        timestamp: result.timestamp,
        paperId: paper.id,
        paperTitle: paper.title,
        score: result.score,
        status: result.isValid ? 'PASS' : result.score >= 60 ? 'NEEDS_IMPROVEMENT' : 'FAIL',
        issues: result.issues
      };
      
      setValidationHistory(prev => [historyEntry, ...prev.slice(0, 49)]); // Keep last 50 entries
      
      // Save to backend
      await saveValidationResult(historyEntry);
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateAllPapers = async () => {
    setIsLoading(true);
    
    try {
      const results = await validator.validateMultiplePapers(papers);
      
      const historyEntries: ValidationHistory[] = results.map((result, index) => ({
        id: (Date.now() + index).toString(),
        timestamp: result.timestamp,
        paperId: papers[index].id,
        paperTitle: papers[index].title,
        score: result.score,
        status: result.isValid ? 'PASS' : result.score >= 60 ? 'NEEDS_IMPROVEMENT' : 'FAIL',
        issues: result.issues
      }));
      
      setValidationHistory(prev => [...historyEntries, ...prev.slice(0, 50 - historyEntries.length)]);
      
      // Save batch results
      await saveBatchValidationResults(historyEntries);
    } catch (error) {
      console.error('Batch validation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const simulateGoogleScholarBot = async (paperId: string) => {
    setIsLoading(true);
    
    try {
      const result = await validator.simulateGoogleScholarBot(paperId);
      
      if (result.accessible && result.metadataExtracted && result.pdfAccessible) {
        alert('✅ Google Scholar bot simulation successful! All critical elements are accessible.');
      } else {
        alert(`⚠️ Google Scholar bot simulation found issues:\n${result.issues.join('\n')}`);
      }
    } catch (error) {
      console.error('Bot simulation failed:', error);
      alert('❌ Failed to simulate Google Scholar bot access');
    } finally {
      setIsLoading(false);
    }
  };

  const saveValidationResult = async (entry: ValidationHistory) => {
    try {
      await fetch('/api/admin/seo/validation-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
    } catch (error) {
      console.error('Failed to save validation result:', error);
    }
  };

  const saveBatchValidationResults = async (entries: ValidationHistory[]) => {
    try {
      await fetch('/api/admin/seo/validation-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results: entries })
      });
    } catch (error) {
      console.error('Failed to save batch validation results:', error);
    }
  };

  const generateReport = () => {
    if (!validationResult) return;
    
    const report = validator.generateReport(validationResult);
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `google-scholar-validation-${selectedPaper?.id}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PASS':
        return <Badge className="bg-green-100 text-green-800">PASS</Badge>;
      case 'NEEDS_IMPROVEMENT':
        return <Badge className="bg-yellow-100 text-yellow-800">NEEDS IMPROVEMENT</Badge>;
      case 'FAIL':
        return <Badge className="bg-red-100 text-red-800">FAIL</Badge>;
      default:
        return <Badge>UNKNOWN</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Google Scholar Validation</h1>
          <p className="text-muted-foreground">
            Validate and optimize papers for Google Scholar compatibility
          </p>
        </div>
        <div className="space-x-2">
          <Button 
            onClick={validateAllPapers} 
            disabled={isLoading || papers.length === 0}
            variant="outline"
          >
            {isLoading ? 'Validating...' : 'Validate All Papers'}
          </Button>
          <Button onClick={loadPapers} variant="outline">
            Refresh Papers
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="papers">Papers</TabsTrigger>
          <TabsTrigger value="validation">Validation Results</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Papers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{papers.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Validated Papers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{validationHistory.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {validationHistory.length > 0 
                    ? Math.round(validationHistory.reduce((sum, h) => sum + h.score, 0) / validationHistory.length)
                    : 0}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {validationHistory.length > 0 
                    ? Math.round((validationHistory.filter(h => h.status === 'PASS').length / validationHistory.length) * 100)
                    : 0}%
                </div>
              </CardContent>
            </Card>
          </div>

          {validationHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Validations</CardTitle>
                <CardDescription>Latest Google Scholar validation results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {validationHistory.slice(0, 5).map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium truncate">{entry.paperTitle}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(entry.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <p className="font-bold">{entry.score}/100</p>
                          <Progress value={entry.score} className="w-20 h-2" />
                        </div>
                        {getStatusBadge(entry.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="papers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Papers for Validation</CardTitle>
              <CardDescription>
                Select papers to validate for Google Scholar compatibility
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {papers.map((paper) => (
                  <div key={paper.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium">{paper.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {paper.authors.length > 0 ? paper.authors[0].name : 'Unknown Author'} • 
                        {new Date(paper.publishedAt).toLocaleDateString()}
                      </p>
                      {paper.doi && (
                        <p className="text-xs text-muted-foreground">DOI: {paper.doi}</p>
                      )}
                    </div>
                    <div className="space-x-2">
                      <Button 
                        size="sm" 
                        onClick={() => validatePaper(paper)}
                        disabled={isLoading}
                      >
                        Validate
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => simulateGoogleScholarBot(paper.id)}
                        disabled={isLoading}
                      >
                        Test Bot
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validation" className="space-y-6">
          {validationResult ? (
            <>
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Validation Results</CardTitle>
                      <CardDescription>
                        {selectedPaper?.title} • {new Date(validationResult.timestamp).toLocaleString()}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <p className="text-2xl font-bold">{validationResult.score}/100</p>
                        {getStatusBadge(validationResult.isValid ? 'PASS' : 'NEEDS_IMPROVEMENT')}
                      </div>
                      <Button onClick={generateReport} variant="outline">
                        Download Report
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Progress value={validationResult.score} className="h-3" />
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Citation Metadata</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Score:</span>
                        <span className="font-medium">{validationResult.details.citationMetadata.score}/100</span>
                      </div>
                      <Progress value={validationResult.details.citationMetadata.score} />
                      {validationResult.details.citationMetadata.issues.length > 0 && (
                        <Alert>
                          <AlertDescription>
                            {validationResult.details.citationMetadata.issues.join(', ')}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">PDF Accessibility</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Score:</span>
                        <span className="font-medium">{validationResult.details.pdfAccessibility.score}/100</span>
                      </div>
                      <Progress value={validationResult.details.pdfAccessibility.score} />
                      {validationResult.details.pdfAccessibility.issues.length > 0 && (
                        <Alert>
                          <AlertDescription>
                            {validationResult.details.pdfAccessibility.issues.join(', ')}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">DOI Integration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Score:</span>
                        <span className="font-medium">{validationResult.details.doiIntegration.score}/100</span>
                      </div>
                      <Progress value={validationResult.details.doiIntegration.score} />
                      {validationResult.details.doiIntegration.issues.length > 0 && (
                        <Alert>
                          <AlertDescription>
                            {validationResult.details.doiIntegration.issues.join(', ')}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Structured Data</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Score:</span>
                        <span className="font-medium">{validationResult.details.structuredData.score}/100</span>
                      </div>
                      <Progress value={validationResult.details.structuredData.score} />
                      {validationResult.details.structuredData.issues.length > 0 && (
                        <Alert>
                          <AlertDescription>
                            {validationResult.details.structuredData.issues.join(', ')}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Sitemap</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Score:</span>
                        <span className="font-medium">{validationResult.details.sitemapAccessibility.score}/100</span>
                      </div>
                      <Progress value={validationResult.details.sitemapAccessibility.score} />
                      {validationResult.details.sitemapAccessibility.issues.length > 0 && (
                        <Alert>
                          <AlertDescription>
                            {validationResult.details.sitemapAccessibility.issues.join(', ')}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Technical SEO</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Score:</span>
                        <span className="font-medium">{validationResult.details.technicalSEO.score}/100</span>
                      </div>
                      <Progress value={validationResult.details.technicalSEO.score} />
                      {validationResult.details.technicalSEO.issues.length > 0 && (
                        <Alert>
                          <AlertDescription>
                            {validationResult.details.technicalSEO.issues.join(', ')}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {validationResult.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {validationResult.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-blue-500">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">
                  Select a paper and click &quot;Validate&quot; to see detailed results
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Validation History</CardTitle>
              <CardDescription>Track Google Scholar validation results over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {validationHistory.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium">{entry.paperTitle}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleString()}
                      </p>
                      {entry.issues.length > 0 && (
                        <p className="text-xs text-red-600">
                          {entry.issues.length} issue{entry.issues.length > 1 ? 's' : ''} found
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <p className="font-bold">{entry.score}/100</p>
                        <Progress value={entry.score} className="w-20 h-2" />
                      </div>
                      {getStatusBadge(entry.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}