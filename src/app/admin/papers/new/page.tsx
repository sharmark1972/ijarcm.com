'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  FileText,
  Users,
  Tag,
  Upload,
  Save,
  X,
  Plus,
  Minus,
  BookOpen,
  File,
  Eye,
  Download,
  Sparkles,
  Loader2
} from 'lucide-react';

interface AuthorData {
  name: string;
  email?: string;
  isCorresponding: boolean;
}

interface Issue {
  id: string;
  title: string;
  volume: string;
  issueNumber: string;
  year: number;
  publishDate: string;
}

interface PaperFormData {
  title: string;
  abstract: string;
  authors: AuthorData[];
  keywords: string[];
  category: string;
  paperType?: 'REVIEW' | 'IMPLEMENTATION';
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'REVISION_REQUIRED' | 'ACCEPTED' | 'REJECTED' | 'PUBLISHED';
  issueId?: string;
  doi?: string;
  introduction?: string;
  literatureReview?: string;
  methodology?: string;
  results?: string;
  discussion?: string;
  conclusion?: string;
  references?: string;
}

export default function NewPaperPage() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loadingIssues, setLoadingIssues] = useState(true);
  const [formData, setFormData] = useState<PaperFormData>({
    title: '',
    abstract: '',
    authors: [{ name: '', email: '', isCorresponding: true }],
    keywords: [''],
    category: '',
    paperType: undefined,
    status: 'SUBMITTED',
    issueId: '',
    doi: '',
    introduction: '',
    literatureReview: '',
    methodology: '',
    results: '',
    discussion: '',
    conclusion: '',
    references: ''
  });
  const [errors, setErrors] = useState<Partial<Record<keyof PaperFormData | 'file', string>>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewPdfData, setPreviewPdfData] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [useGeneratedPdf, setUseGeneratedPdf] = useState(false);
  
  // AI Content Generation State
  const [generatingSection, setGeneratingSection] = useState<string | null>(null);
  const [wordCounts, setWordCounts] = useState({
    introduction: 1000,
    literatureReview: 1000,
    methodology: 1000,
    results: 1000,
    discussion: 1000,
    conclusion: 500,
    references: 1000
  });

  if (!isAdmin) {
    redirect('/dashboard');
  }

  // Fetch published issues
  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const response = await fetch('/api/admin/issues?published=true');
        const data = await response.json();
        if (response.ok) {
          setIssues(data.issues || []);
        }
      } catch (error) {
        console.error('Error fetching issues:', error);
      } finally {
        setLoadingIssues(false);
      }
    };
    fetchIssues();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof PaperFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleAuthorChange = (index: number, field: keyof AuthorData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      authors: prev.authors.map((author, i) => 
        i === index ? { ...author, [field]: value } : author
      )
    }));
    
    // Clear error when user starts typing
    if (errors.authors) {
      setErrors(prev => ({ ...prev, authors: undefined }));
    }
  };

  const handleKeywordChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.map((keyword, i) => i === index ? value : keyword)
    }));
    
    // Clear error when user starts typing
    if (errors.keywords) {
      setErrors(prev => ({ ...prev, keywords: undefined }));
    }
  };

  const addAuthor = () => {
    setFormData(prev => ({
      ...prev,
      authors: [...prev.authors, { name: '', email: '', isCorresponding: false }]
    }));
  };

  const removeAuthor = (index: number) => {
    if (formData.authors.length > 1) {
      setFormData(prev => ({
        ...prev,
        authors: prev.authors.filter((_, i) => i !== index)
      }));
    }
  };

  const addKeyword = () => {
    setFormData(prev => ({
      ...prev,
      keywords: [...prev.keywords, '']
    }));
  };

  const removeKeyword = (index: number) => {
    if (formData.keywords.length > 1) {
      setFormData(prev => ({
        ...prev,
        keywords: prev.keywords.filter((_, i) => i !== index)
      }));
    }
  };

  // Generate content for a specific section using AI
  const handleGenerateSection = async (section: keyof typeof formData) => {
    if (!formData.title || !formData.abstract || !formData.category) {
      alert('Please fill in the title, abstract, and category before generating content.');
      return;
    }

    setGeneratingSection(section);
    try {
      const response = await fetch(`/api/papers/generate-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section,
          title: formData.title,
          abstract: formData.abstract,
          keywords: formData.keywords.filter(k => k.trim()).join(', '),
          category: formData.category,
          wordCount: wordCounts[section],
          existingContent: formData[section] || undefined
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Clean up the generated content: remove ### ** patterns
        let cleanedContent = result.content;
        // Remove ### ** and ### followed by **
        cleanedContent = cleanedContent.replace(/###\s*\*\*/g, '');
        // Remove any standalone ### at the start of lines
        cleanedContent = cleanedContent.replace(/^###\s*/gm, '');
        // Clean up any extra whitespace
        cleanedContent = cleanedContent.trim();
        
        setFormData(prev => ({ ...prev, [section]: cleanedContent }));
      } else {
        alert(result.error || 'Failed to generate content');
      }
    } catch (error) {
      console.error('Error generating content:', error);
      alert('Failed to generate content');
    } finally {
      setGeneratingSection(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type (PDF only)
      if (file.type !== 'application/pdf') {
        setErrors(prev => ({ ...prev, file: 'Only PDF files are allowed' }));
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, file: 'File size must be less than 10MB' }));
        return;
      }
      
      setSelectedFile(file);
      setUseGeneratedPdf(false);
      setPreviewPdfData(null);
      setErrors(prev => ({ ...prev, file: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof PaperFormData | 'file', string>> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Paper title is required';
    }

    if (!formData.abstract.trim()) {
      newErrors.abstract = 'Abstract is required';
    }

    if (formData.abstract.length > 2000) {
      newErrors.abstract = 'Abstract must be less than 2000 characters';
    }

    // Validate authors
    const validAuthors = formData.authors.filter(author =>
      author.name.trim()
    );
    if (validAuthors.length === 0) {
      newErrors.authors = 'At least one author with name is required';
    }

    // Validate author emails (only if provided)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const author of formData.authors) {
      if (author.name.trim()) {
        if (!author.name.trim()) {
          newErrors.authors = 'All authors must have a name';
          break;
        }
        // Only validate email if it's provided
        if (author.email && author.email.trim() && !emailRegex.test(author.email.trim())) {
          newErrors.authors = `Invalid email format: ${author.email}`;
          break;
        }
      }
    }

    const validKeywords = formData.keywords.filter(keyword => keyword.trim());
    if (validKeywords.length === 0) {
      newErrors.keywords = 'At least one keyword is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    // Validate DOI if provided
    if (formData.doi && formData.doi.trim()) {
      const doiRegex = /^10\.\d{4,9}\/.+$/;
      if (!doiRegex.test(formData.doi.trim())) {
        newErrors.doi = 'Invalid DOI format. DOI should be in format: 10.xxxx/xxxxx';
      }
    }

    // File is required unless useGeneratedPdf is enabled
    if (!selectedFile && !useGeneratedPdf) {
      newErrors.file = 'PDF file is required (or generate PDF from content)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGeneratePreview = async () => {
    // Validate required fields for preview
    const newErrors: Partial<Record<keyof PaperFormData, string>> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Paper title is required';
    }

    if (!formData.abstract.trim()) {
      newErrors.abstract = 'Abstract is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setGeneratingPreview(true);

    try {
      const submitData = new FormData();
      
      const validAuthors = formData.authors.filter(author =>
        author.name.trim()
      ).map(author => ({
        email: author.email ? author.email.trim() : undefined,
        isCorresponding: author.isCorresponding
      }));
      const validKeywords = formData.keywords.filter(keyword => keyword.trim());
      
      submitData.append('title', formData.title);
      submitData.append('abstract', formData.abstract);
      submitData.append('authors', JSON.stringify(validAuthors));
      submitData.append('keywords', JSON.stringify(validKeywords));
      submitData.append('category', formData.category);
      if (formData.paperType) {
        submitData.append('paperType', formData.paperType);
      }
      
      if (formData.issueId) {
        submitData.append('issueId', formData.issueId);
      }
      
      if (formData.doi) {
        submitData.append('doi', formData.doi);
      }
      
      if (formData.introduction) {
        submitData.append('introduction', formData.introduction);
      }
      if (formData.methodology) {
        submitData.append('methodology', formData.methodology);
      }
      if (formData.results) {
        submitData.append('results', formData.results);
      }
      if (formData.discussion) {
        submitData.append('discussion', formData.discussion);
      }
      if (formData.conclusion) {
        submitData.append('conclusion', formData.conclusion);
      }
      if (formData.references) {
        submitData.append('references', formData.references);
      }

      const response = await fetch('/api/admin/papers/preview-pdf', {
        method: 'POST',
        body: submitData
      });

      const result = await response.json();

      if (response.ok) {
        setPreviewPdfData(result.pdfData);
        setShowPreviewModal(true);
      } else {
        alert(result.error || 'Failed to generate preview PDF');
      }
    } catch (error) {
      console.error('Error generating preview PDF:', error);
      alert('Failed to generate preview PDF');
    } finally {
      setGeneratingPreview(false);
    }
  };

  const handleUseGeneratedPdf = () => {
    setUseGeneratedPdf(true);
    setSelectedFile(null);
    setShowPreviewModal(false);
    setErrors(prev => ({ ...prev, file: undefined }));
  };

  const handleDownloadPdf = () => {
    if (previewPdfData) {
      const link = document.createElement('a');
      link.href = previewPdfData;
      link.download = `${formData.title.replace(/[^a-z0-9]/gi, '_')}_preview.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      // Create FormData for file upload
      const submitData = new FormData();
      
      // Filter out empty authors and keywords
      const validAuthors = formData.authors.filter(author =>
        author.name.trim()
      ).map(author => ({
        email: author.email ? author.email.trim() : undefined,
        isCorresponding: author.isCorresponding
      }));
      const validKeywords = formData.keywords.filter(keyword => keyword.trim());
      
      submitData.append('title', formData.title);
      submitData.append('abstract', formData.abstract);
      submitData.append('authors', JSON.stringify(validAuthors));
      submitData.append('keywords', JSON.stringify(validKeywords));
      submitData.append('category', formData.category);
      if (formData.paperType) {
        submitData.append('paperType', formData.paperType);
      }
      submitData.append('status', formData.status);
      
      // Add optional issue assignment
      if (formData.issueId) {
        submitData.append('issueId', formData.issueId);
      }
      
      // Add DOI if provided
      if (formData.doi) {
        submitData.append('doi', formData.doi);
      }
      
      // Add paper content sections if provided
      if (formData.introduction) {
        submitData.append('introduction', formData.introduction);
      }
      if (formData.literatureReview) {
        submitData.append('literatureReview', formData.literatureReview);
      }
      if (formData.methodology) {
        submitData.append('methodology', formData.methodology);
      }
      if (formData.results) {
        submitData.append('results', formData.results);
      }
      if (formData.discussion) {
        submitData.append('discussion', formData.discussion);
      }
      if (formData.conclusion) {
        submitData.append('conclusion', formData.conclusion);
      }
      if (formData.references) {
        submitData.append('references', formData.references);
      }
      
      // Add file or generate PDF flag
      if (selectedFile) {
        submitData.append('file', selectedFile);
      }
      
      // Add generate PDF flag
      submitData.append('generatePDF', useGeneratedPdf.toString());

      const response = await fetch('/api/admin/papers', {
        method: 'POST',
        body: submitData
      });

      const result = await response.json();

      if (response.ok) {
        alert('Paper created successfully!');
        router.push('/admin/papers');
      } else {
        alert(result.error || 'Failed to create paper');
      }
    } catch (error) {
      console.error('Error creating paper:', error);
      alert('Failed to create paper');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Link
                  href="/admin/papers"
                  className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Add New Paper</h1>
                  <p className="mt-2 text-gray-600">Submit a new research paper to the journal</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-blue-600" />
              Basic Information
            </h2>
            
            <div className="space-y-6">
              {/* Paper Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Paper Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                    errors.title ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter paper title"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                )}
              </div>

              {/* Abstract */}
              <div>
                <label htmlFor="abstract" className="block text-sm font-medium text-gray-700 mb-2">
                  Abstract *
                </label>
                <textarea
                  id="abstract"
                  name="abstract"
                  rows={6}
                  value={formData.abstract}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                    errors.abstract ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter paper abstract (max 2000 characters)"
                  maxLength={2000}
                />
                <div className="flex justify-between items-center mt-1">
                  {errors.abstract && (
                    <p className="text-sm text-red-600">{errors.abstract}</p>
                  )}
                  <p className="text-sm text-gray-500 ml-auto">
                    {formData.abstract.length}/2000 characters
                  </p>
                </div>
              </div>

              {/* Category, Paper Type, and Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    <Tag className="h-4 w-4 inline mr-1" />
                    Category *
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                      errors.category ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select a category</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Environmental Science">Environmental Science</option>
                    <option value="Finance">Finance</option>
                    <option value="Medicine">Medicine</option>
                    <option value="Agriculture">Agriculture</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Business">Business</option>
                    <option value="Education">Education</option>
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="paperType" className="block text-sm font-medium text-gray-700 mb-2">
                    <FileText className="h-4 w-4 inline mr-1" />
                    Paper Type
                  </label>
                  <select
                    id="paperType"
                    name="paperType"
                    value={formData.paperType || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select paper type</option>
                    <option value="REVIEW">Review Paper</option>
                    <option value="IMPLEMENTATION">Implementation Paper</option>
                  </select>
                  <p className="mt-1 text-sm text-gray-500">
                    Select the type of paper for PDF generation
                  </p>
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="SUBMITTED">Submitted</option>
                    <option value="UNDER_REVIEW">Under Review</option>
                    <option value="REVISION_REQUIRED">Revision Required</option>
                    <option value="ACCEPTED">Accepted</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="PUBLISHED">Published</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* DOI Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-blue-600" />
              DOI Information
            </h2>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="doi" className="block text-sm font-medium text-gray-700 mb-2">
                  DOI (Digital Object Identifier)
                </label>
                <input
                  type="text"
                  id="doi"
                  name="doi"
                  value={formData.doi}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                    errors.doi ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="10.xxxx/xxxxx (optional)"
                />
                {errors.doi && (
                  <p className="mt-1 text-sm text-red-600">{errors.doi}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Format: 10.xxxx/xxxxx. Optional for new papers, required for published papers.
                </p>
              </div>
            </div>
          </div>

          {/* Publication Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
              Issue Assignment (Optional)
            </h2>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Assign this paper to a published issue. If no issue is selected, you can set it later.
              </p>
              
              <div>
                <label htmlFor="issueId" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Issue
                </label>
                {loadingIssues ? (
                  <div className="text-sm text-gray-500">Loading issues...</div>
                ) : issues.length === 0 ? (
                  <div className="text-sm text-gray-500">
                    No published issues available. 
                    <Link href="/admin/issues" className="text-blue-600 hover:underline ml-1">
                      Create one first
                    </Link>
                  </div>
                ) : (
                  <select
                    id="issueId"
                    name="issueId"
                    value={formData.issueId || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">-- No Issue (Assign Later) --</option>
                    {issues.map((issue) => (
                      <option key={issue.id} value={issue.id}>
                        Vol. {issue.volume}, Issue {issue.issueNumber} ({issue.year}) - {issue.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              
              {formData.issueId && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Selected Issue:</strong> {issues.find(i => i.id === formData.issueId)?.title}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Authors */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-600" />
              Authors
            </h2>
            
            <div className="space-y-6">
              {formData.authors.map((author, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-700">Author {index + 1}</h3>
                    <div className="flex items-center space-x-2">
                      {formData.authors.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeAuthor(index)}
                          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                      )}
                      {index === formData.authors.length - 1 && (
                        <button
                          type="button"
                          onClick={addAuthor}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={author.name}
                        onChange={(e) => handleAuthorChange(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Author full name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={author.email}
                        onChange={(e) => handleAuthorChange(index, 'email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="author@email.com (optional)"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={author.isCorresponding}
                        onChange={(e) => handleAuthorChange(index, 'isCorresponding', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Corresponding author</span>
                    </label>
                  </div>
                </div>
              ))}
              {errors.authors && (
                <p className="text-sm text-red-600">{errors.authors}</p>
              )}
            </div>
          </div>

          {/* Keywords */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Tag className="h-5 w-5 mr-2 text-blue-600" />
              Keywords
            </h2>
            
            <div className="space-y-4">
              {formData.keywords.map((keyword, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={keyword}
                      onChange={(e) => handleKeywordChange(index, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder={`Keyword ${index + 1}`}
                    />
                  </div>
                  {formData.keywords.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeKeyword(index)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                  )}
                  {index === formData.keywords.length - 1 && (
                    <button
                      type="button"
                      onClick={addKeyword}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              {errors.keywords && (
                <p className="text-sm text-red-600">{errors.keywords}</p>
              )}
            </div>
          </div>
        
          {/* Paper Content Sections */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-blue-600" />
              Paper Content (Optional)
            </h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
              <p className="text-sm text-blue-800 mb-2">
                💡 <strong>Content is automatically saved</strong> when you create the paper.
              </p>
              <p className="text-xs text-blue-700">
                Fill in the sections below and they will be:
              </p>
              <ul className="text-xs text-blue-700 mt-2 ml-4 list-disc space-y-1">
                <li>Saved to the database for future editing</li>
                <li>Used to generate the PDF (if you use &quot;Generate & Preview PDF&quot;)</li>
                <li>Available for regenerating the PDF later from the edit page</li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
              <p className="text-sm text-green-800 mb-2">
                ✨ <strong>Auto-Subsection Formatting in PDF</strong>
              </p>
              <p className="text-xs text-green-700 mb-2">
                Add subsections in your content using this format:
              </p>
              <div className="bg-white border border-green-200 rounded px-3 py-2 mb-2">
                <code className="text-xs text-gray-800">
                  1.1 Background. This section provides background...<br/>
                  <br/>
                  1.2 Research Gap. Despite numerous studies...<br/>
                  <br/>
                  1.3 Objectives. The primary objectives are...
                </code>
              </div>
              <p className="text-xs text-green-700">
                The PDF generator will automatically detect patterns like <strong>1.1</strong>, <strong>1.2</strong>, <strong>2.1</strong>, etc. and create formatted subsection headings!
              </p>
            </div>
            
            <div className="space-y-6">
              {/* Introduction */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="introduction" className="block text-sm font-medium text-gray-700">
                    1. Introduction
                  </label>
                  <div className="flex items-center space-x-2">
                    <select
                      value={wordCounts.introduction}
                      onChange={(e) => setWordCounts(prev => ({ ...prev, introduction: parseInt(e.target.value) }))}
                      className="text-xs px-2 py-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={500}>500 words</option>
                      <option value={1000}>1K words</option>
                      <option value={2000}>2K words</option>
                      <option value={5000}>5K words</option>
                      <option value={10000}>10K words</option>
                      <option value={20000}>20K words</option>
                      <option value={50000}>50K words</option>
                      <option value={100000}>100K words</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => handleGenerateSection('introduction')}
                      disabled={generatingSection === 'introduction'}
                      className="inline-flex items-center px-3 py-1 text-xs font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {generatingSection === 'introduction' ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3 w-3 mr-1" />
                          Generate
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <textarea
                  id="introduction"
                  name="introduction"
                  rows={8}
                  value={formData.introduction}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter the introduction section content...&#10;&#10;Tip: Add subsections like:&#10;1.1 Background. This section provides background...&#10;&#10;1.2 Research Gap. Despite numerous studies...&#10;&#10;1.3 Objectives. The primary objectives are..."
                />
              </div>

              {/* Literature Review & Hypothesis Development */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="literatureReview" className="block text-sm font-medium text-gray-700">
                    2. Literature Review & Hypothesis Development
                  </label>
                  <div className="flex items-center space-x-2">
                    <select
                      value={wordCounts.literatureReview}
                      onChange={(e) => setWordCounts(prev => ({ ...prev, literatureReview: parseInt(e.target.value) }))}
                      className="text-xs px-2 py-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={500}>500 words</option>
                      <option value={1000}>1K words</option>
                      <option value={2000}>2K words</option>
                      <option value={5000}>5K words</option>
                      <option value={10000}>10K words</option>
                      <option value={20000}>20K words</option>
                      <option value={50000}>50K words</option>
                      <option value={100000}>100K words</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => handleGenerateSection('literatureReview')}
                      disabled={generatingSection === 'literatureReview'}
                      className="inline-flex items-center px-3 py-1 text-xs font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {generatingSection === 'literatureReview' ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3 w-3 mr-1" />
                          Generate
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <textarea
                  id="literatureReview"
                  name="literatureReview"
                  rows={8}
                  value={formData.literatureReview}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Review existing literature and develop hypotheses...&#10;&#10;Tip: Use subsections like:&#10;2.1 Theoretical Framework. The theoretical foundation...&#10;&#10;2.2 Previous Studies. Prior research has shown..."
                />
              </div>

              {/* Methodology */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="methodology" className="block text-sm font-medium text-gray-700">
                    3. Methodology
                  </label>
                  <div className="flex items-center space-x-2">
                    <select
                      value={wordCounts.methodology}
                      onChange={(e) => setWordCounts(prev => ({ ...prev, methodology: parseInt(e.target.value) }))}
                      className="text-xs px-2 py-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={500}>500 words</option>
                      <option value={1000}>1K words</option>
                      <option value={2000}>2K words</option>
                      <option value={5000}>5K words</option>
                      <option value={10000}>10K words</option>
                      <option value={20000}>20K words</option>
                      <option value={50000}>50K words</option>
                      <option value={100000}>100K words</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => handleGenerateSection('methodology')}
                      disabled={generatingSection === 'methodology'}
                      className="inline-flex items-center px-3 py-1 text-xs font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {generatingSection === 'methodology' ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3 w-3 mr-1" />
                          Generate
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <textarea
                  id="methodology"
                  name="methodology"
                  rows={8}
                  value={formData.methodology}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe the research methodology..."
                />
              </div>

              {/* Results */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="results" className="block text-sm font-medium text-gray-700">
                    4. Results
                  </label>
                  <div className="flex items-center space-x-2">
                    <select
                      value={wordCounts.results}
                      onChange={(e) => setWordCounts(prev => ({ ...prev, results: parseInt(e.target.value) }))}
                      className="text-xs px-2 py-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={500}>500 words</option>
                      <option value={1000}>1K words</option>
                      <option value={2000}>2K words</option>
                      <option value={5000}>5K words</option>
                      <option value={10000}>10K words</option>
                      <option value={20000}>20K words</option>
                      <option value={50000}>50K words</option>
                      <option value={100000}>100K words</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => handleGenerateSection('results')}
                      disabled={generatingSection === 'results'}
                      className="inline-flex items-center px-3 py-1 text-xs font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {generatingSection === 'results' ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3 w-3 mr-1" />
                          Generate
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <textarea
                  id="results"
                  name="results"
                  rows={8}
                  value={formData.results}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Present the research findings..."
                />
              </div>

              {/* Discussion */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="discussion" className="block text-sm font-medium text-gray-700">
                    5. Discussion
                  </label>
                  <div className="flex items-center space-x-2">
                    <select
                      value={wordCounts.discussion}
                      onChange={(e) => setWordCounts(prev => ({ ...prev, discussion: parseInt(e.target.value) }))}
                      className="text-xs px-2 py-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={500}>500 words</option>
                      <option value={1000}>1K words</option>
                      <option value={2000}>2K words</option>
                      <option value={5000}>5K words</option>
                      <option value={10000}>10K words</option>
                      <option value={20000}>20K words</option>
                      <option value={50000}>50K words</option>
                      <option value={100000}>100K words</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => handleGenerateSection('discussion')}
                      disabled={generatingSection === 'discussion'}
                      className="inline-flex items-center px-3 py-1 text-xs font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {generatingSection === 'discussion' ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3 w-3 mr-1" />
                          Generate
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <textarea
                  id="discussion"
                  name="discussion"
                  rows={8}
                  value={formData.discussion}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Discuss the implications of the results..."
                />
              </div>

              {/* Conclusion */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="conclusion" className="block text-sm font-medium text-gray-700">
                    6. Conclusion
                  </label>
                  <div className="flex items-center space-x-2">
                    <select
                      value={wordCounts.conclusion}
                      onChange={(e) => setWordCounts(prev => ({ ...prev, conclusion: parseInt(e.target.value) }))}
                      className="text-xs px-2 py-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={300}>300 words</option>
                      <option value={500}>500 words</option>
                      <option value={1000}>1K words</option>
                      <option value={2000}>2K words</option>
                      <option value={5000}>5K words</option>
                      <option value={10000}>10K words</option>
                      <option value={20000}>20K words</option>
                      <option value={50000}>50K words</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => handleGenerateSection('conclusion')}
                      disabled={generatingSection === 'conclusion'}
                      className="inline-flex items-center px-3 py-1 text-xs font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {generatingSection === 'conclusion' ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3 w-3 mr-1" />
                          Generate
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <textarea
                  id="conclusion"
                  name="conclusion"
                  rows={6}
                  value={formData.conclusion}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Summarize key findings and their significance..."
                />
              </div>

              {/* References */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="references" className="block text-sm font-medium text-gray-700">
                    References
                  </label>
                  <div className="flex items-center space-x-2">
                    <select
                      value={wordCounts.references}
                      onChange={(e) => setWordCounts(prev => ({ ...prev, references: parseInt(e.target.value) }))}
                      className="text-xs px-2 py-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={500}>10-15 refs</option>
                      <option value={1000}>20-30 refs</option>
                      <option value={2000}>40-50 refs</option>
                      <option value={5000}>100+ refs</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => handleGenerateSection('references')}
                      disabled={generatingSection === 'references'}
                      className="inline-flex items-center px-3 py-1 text-xs font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {generatingSection === 'references' ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3 w-3 mr-1" />
                          Generate
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <textarea
                  id="references"
                  name="references"
                  rows={8}
                  value={formData.references}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter references in appropriate format..."
                />
              </div>
            </div>
          </div>

          {/* File Upload & PDF Generation */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Upload className="h-5 w-5 mr-2 text-blue-600" />
              Paper File
            </h2>
            
            <div className="space-y-6">
              {/* Generate & Preview Button */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <File className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Generate PDF from Content
                      </p>
                      <p className="text-xs text-gray-600">
                        Preview the PDF before creating the paper
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleGeneratePreview}
                    disabled={generatingPreview}
                    className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generatingPreview ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 inline mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 inline mr-2" />
                        Generate & Preview
                      </>
                    )}
                  </button>
                </div>
              </div>

              {useGeneratedPdf && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <File className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        Using Generated PDF
                      </p>
                      <p className="text-sm text-green-700 mt-1">
                        The PDF will be generated in Scopus format using the paper details provided above.
                      </p>
                      <button
                        type="button"
                        onClick={() => setUseGeneratedPdf(false)}
                        className="mt-2 text-sm text-blue-600 hover:underline"
                      >
                        Switch to upload file instead
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {!useGeneratedPdf && (
                <div>
                  <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
                    Upload PDF File *
                  </label>
                  <input
                    type="file"
                    id="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                      errors.file ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.file && (
                    <p className="mt-1 text-sm text-red-600">{errors.file}</p>
                  )}
                  {selectedFile && (
                    <p className="mt-1 text-sm text-green-600">
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    Only PDF files are allowed. Maximum file size: 10MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4">
            <Link
                href="/admin/papers"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
              <X className="h-4 w-4 inline mr-2" />
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 inline mr-2" />
                  Create Paper
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* PDF Preview Modal */}
      {showPreviewModal && previewPdfData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">PDF Preview</h3>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <iframe
                src={previewPdfData}
                className="w-full h-full min-h-[600px] border-0"
                title="PDF Preview"
              />
            </div>
            <div className="flex items-center justify-between p-4 border-t bg-gray-50">
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Download className="h-4 w-4 inline mr-2" />
                  Download PDF
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Close
                </button>
              </div>
              <button
                type="button"
                onClick={handleUseGeneratedPdf}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                <Save className="h-4 w-4 inline mr-2" />
                Use This PDF & Create Paper
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}