'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, FileText, Users, Tag, Upload, Loader2, Download, Award, BookOpen, Eye, RefreshCw, Save, X, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

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
  status: string;
  issueId?: string;
  doi?: string;
  doiStatus?: string;
}

interface PaperData {
  id: string;
  title: string;
  abstract: string;
  keywords: string;
  category: string;
  paperType?: 'REVIEW' | 'IMPLEMENTATION';
  status: string;
  filePath: string;
  coverImage?: string;
  issueId?: string;
  volumeNumber?: string;
  issueNumber?: string;
  publicationDate?: string;
  uniqueNumber?: string;
  doi?: string;
  doiStatus?: string;
  updatedAt?: string;
  paperAuthors: Array<{
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    isCorresponding: boolean;
  }>;
}

export default function EditPaperPage() {
  const router = useRouter();
  const params = useParams();
  const { isAdmin } = useAuth();
  const paperId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paper, setPaper] = useState<PaperData | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loadingIssues, setLoadingIssues] = useState(true);
  // const [selectedFile, setSelectedFile] = useState<File | null>(null); // Not used in current implementation
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [generatingCertificate, setGeneratingCertificate] = useState(false);
  const [certificateInfo, setCertificateInfo] = useState<{
    isExisting?: boolean;
    certificateNumber: string;
    issuedAt: string;
  } | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof PaperFormData | 'file' | 'image', string>>>({});
  const [hasSavedContent, setHasSavedContent] = useState(false);
  const [regeneratingPaper, setRegeneratingPaper] = useState(false);
  const [showContentPreview, setShowContentPreview] = useState(false);
  const [savedContent, setSavedContent] = useState<{
    introduction?: string;
    literatureReview?: string;
    methodology?: string;
    results?: string;
    discussion?: string;
    conclusion?: string;
    references?: string;
    images?: Array<{
      id: string;
      url: string;
      caption?: string;
    }>;
  } | null>(null);
  const [editableContent, setEditableContent] = useState({
    introduction: '',
    literatureReview: '',
    methodology: '',
    results: '',
    discussion: '',
    conclusion: '',
    references: ''
  });
  const [savingContent, setSavingContent] = useState(false);
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const [previewPdfData, setPreviewPdfData] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  
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

  const [formData, setFormData] = useState<PaperFormData>({
    title: '',
    abstract: '',
    authors: [{ name: '', email: '', isCorresponding: false }],
    keywords: [''],
    category: '',
    paperType: undefined,
    status: 'SUBMITTED',
    issueId: '',
    doi: '',
    doiStatus: ''
  });

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

  // Fetch paper data on component mount
  useEffect(() => {
    const fetchPaper = async () => {
      try {
        const response = await fetch(`/api/papers/${paperId}`);
        const result = await response.json();

        if (response.ok) {
          const paperData = result.paper;
          setPaper(paperData);
          
          // Populate form with existing data
          setFormData({
            title: paperData.title,
            abstract: paperData.abstract,
            authors: paperData.paperAuthors.map((author: {
              user: {
                firstName: string;
                lastName: string;
                email: string;
              };
              isCorresponding: boolean;
            }) => ({
              name: `${author.user.firstName} ${author.user.lastName}`,
              email: author.user.email,
              isCorresponding: author.isCorresponding
            })),
            keywords: paperData.keywords ? paperData.keywords.split(', ').filter((k: string) => k.trim()) : [''],
            category: paperData.category,
            paperType: paperData.paperType || undefined,
            status: paperData.status,
            issueId: paperData.issueId || '',
            doi: paperData.doi || '',
            doiStatus: paperData.doiStatus || ''
          });
        } else {
          alert(result.error || 'Failed to fetch paper data');
          router.push('/admin/papers');
        }
      } catch (error) {
        console.error('Error fetching paper:', error);
        alert('Failed to fetch paper data');
        router.push('/admin/papers');
      } finally {
        setLoading(false);
      }
    };

    const fetchPaperContent = async () => {
      try {
        const response = await fetch(`/api/papers/${paperId}/content`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.content) {
            setHasSavedContent(true);
            setSavedContent(result.content);
            // Populate editable content
            setEditableContent({
              introduction: result.content.introduction || '',
              literatureReview: result.content.literatureReview || '',
              methodology: result.content.methodology || '',
              results: result.content.results || '',
              discussion: result.content.discussion || '',
              conclusion: result.content.conclusion || '',
              references: result.content.references || ''
            });
          }
        }
      } catch (error) {
        console.error('Error fetching paper content:', error);
      }
    };

    if (paperId) {
      fetchPaper();
      fetchPaperContent();
    }
  }, [paperId, router]);

  // Regenerate paper from saved content
  const handleRegeneratePaper = async () => {
    if (!window.confirm('Are you sure you want to regenerate the paper PDF from saved content? This will replace the current PDF file.')) {
      return;
    }

    setRegeneratingPaper(true);
    try {
      const response = await fetch(`/api/papers/${paperId}/regenerate`, {
        method: 'POST'
      });

      const result = await response.json();

      if (response.ok) {
        alert('Paper regenerated successfully!');
        // Refresh paper data
        window.location.reload();
      } else {
        alert(result.error || 'Failed to regenerate paper');
      }
    } catch (error) {
      console.error('Error regenerating paper:', error);
      alert('Failed to regenerate paper');
    } finally {
      setRegeneratingPaper(false);
    }
  };

  // Handle content field changes
  const handleContentChange = (field: keyof typeof editableContent, value: string) => {
    setEditableContent(prev => ({ ...prev, [field]: value }));
  };

  // Save paper content
  const handleSaveContent = async () => {
    setSavingContent(true);
    try {
      const response = await fetch(`/api/papers/${paperId}/content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editableContent)
      });

      const result = await response.json();

      if (response.ok) {
        alert('Paper content saved successfully!');
        setHasSavedContent(true);
        setSavedContent(editableContent);
      } else {
        alert(result.error || 'Failed to save content');
      }
    } catch (error) {
      console.error('Error saving content:', error);
      alert('Failed to save content');
    } finally {
      setSavingContent(false);
    }
  };

  // Generate content for a specific section using AI
  const handleGenerateSection = async (section: keyof typeof editableContent) => {
    if (!formData.title || !formData.abstract || !formData.category) {
      alert('Please fill in the title, abstract, and category before generating content.');
      return;
    }

    setGeneratingSection(section);
    try {
      const response = await fetch(`/api/papers/${paperId}/generate-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section,
          title: formData.title,
          abstract: formData.abstract,
          keywords: formData.keywords.filter(k => k.trim()).join(', '),
          category: formData.category,
          wordCount: wordCounts[section],
          existingContent: editableContent[section] || undefined
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setEditableContent(prev => ({ ...prev, [section]: result.content }));
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

  // Generate preview PDF
  const handleGeneratePreview = async () => {
    setGeneratingPreview(true);
    try {
      const previewData = new FormData();
      previewData.append('title', formData.title);
      previewData.append('abstract', formData.abstract);
      previewData.append('category', formData.category);
      previewData.append('keywords', formData.keywords.filter(k => k.trim()).join(','));
      
      const validAuthors = formData.authors.filter(a => a.name.trim()).map(a => ({
        firstName: a.name.split(' ')[0],
        lastName: a.name.split(' ').slice(1).join(' ') || a.name.split(' ')[0],
        email: a.email || undefined,
        isCorresponding: a.isCorresponding
      }));
      previewData.append('authors', JSON.stringify(validAuthors));
      
      if (formData.paperType) previewData.append('paperType', formData.paperType);
      if (formData.issueId) previewData.append('issueId', formData.issueId);
      if (formData.doi) previewData.append('doi', formData.doi);
      
      previewData.append('introduction', editableContent.introduction);
      previewData.append('literatureReview', editableContent.literatureReview);
      previewData.append('methodology', editableContent.methodology);
      previewData.append('results', editableContent.results);
      previewData.append('discussion', editableContent.discussion);
      previewData.append('conclusion', editableContent.conclusion);
      previewData.append('references', editableContent.references);

      const response = await fetch('/api/admin/papers/preview-pdf', {
        method: 'POST',
        body: previewData
      });

      const result = await response.json();

      if (response.ok && result.pdfData) {
        setPreviewPdfData(result.pdfData);
        setShowPreviewModal(true);
      } else {
        alert(result.error || 'Failed to generate preview');
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      alert('Failed to generate preview');
    } finally {
      setGeneratingPreview(false);
    }
  };

  // Download preview PDF
  const handleDownloadPreviewPdf = () => {
    if (!previewPdfData) return;
    
    const link = document.createElement('a');
    link.href = previewPdfData;
    link.download = `${formData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_preview.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Use preview and regenerate
  const handleUsePreviewPdf = async () => {
    // First save the content
    await handleSaveContent();
    // Then regenerate
    setShowPreviewModal(false);
    await handleRegeneratePaper();
  };

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


  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type (images only)
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, image: 'Only image files (JPEG, PNG, GIF, WebP) are allowed' }));
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, image: 'File size must be less than 5MB' }));
        return;
      }
      
      setSelectedImage(file);
      setErrors(prev => ({ ...prev, image: undefined }));
    }
  };

  const handleImageUpload = async () => {
    if (!selectedImage) return;
    
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedImage);
      
      const response = await fetch(`/api/papers/${paperId}/cover`, {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json();
        alert('Cover image uploaded successfully!');
        setSelectedImage(null);
        
        // Update the paper data to include the new cover image
        if (paper) {
          setPaper({ ...paper, coverImage: result.coverImage });
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to upload cover image');
      }
    } catch (error) {
      console.error('Error uploading cover image:', error);
      alert('Failed to upload cover image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteCoverImage = async () => {
    if (!paper?.coverImage) return;
    
    if (!confirm('Are you sure you want to remove the cover image?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/papers/${paperId}/cover`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        alert('Cover image removed successfully!');
        
        // Update the paper data to remove the cover image
        if (paper) {
          setPaper({ ...paper, coverImage: undefined });
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to remove cover image');
      }
    } catch (error) {
      console.error('Error removing cover image:', error);
      alert('Failed to remove cover image');
    }
  };

  const handleDownloadCertificate = async () => {
    if (!paper || paper.status !== 'PUBLISHED') {
      alert('Certificate can only be generated for published papers');
      return;
    }

    setGeneratingCertificate(true);
    try {
      const response = await fetch(`/api/papers/${paperId}/certificate`);
      const result = await response.json();

      if (response.ok) {
        // Store certificate info for display
        setCertificateInfo(result);
        
        // Create a temporary window to print the certificate
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(result.certificateHTML);
          printWindow.document.close();
          
          // Wait for the content to load, then trigger print
          printWindow.onload = () => {
            setTimeout(() => {
              printWindow.print();
            }, 500);
          };
        }
      } else {
        alert(result.error || 'Failed to generate certificate');
      }
    } catch (error) {
      console.error('Error generating certificate:', error);
      alert('Failed to generate certificate');
    } finally {
      setGeneratingCertificate(false);
    }
  };


  // Check for existing certificate when paper data is loaded
  useEffect(() => {
    if (paper && paper.status === 'PUBLISHED' && paper.paperAuthors.length > 0) {
      const checkExistingCertificate = async () => {
        try {
          const response = await fetch(`/api/papers/${paperId}/certificate`);
          if (response.ok) {
            const result = await response.json();
            setCertificateInfo(result);
          }
        } catch (error) {
          console.error('Error checking certificate:', error);
        }
      };
      
      checkExistingCertificate();
    }
  }, [paper, paperId]);

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
    } else {
      // Validate email formats (only if email is provided)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      for (const author of validAuthors) {
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    
    try {
      // Debug: Log the form data before filtering
      console.log('Form data before filtering:', JSON.stringify(formData, null, 2));
      
      // Filter out empty authors and keywords
      const validAuthors = formData.authors.filter(author =>
        author.name.trim()
      );
      const validKeywords = formData.keywords.filter(keyword => keyword.trim());
      
      // Debug: Log the valid authors
      console.log('Valid authors after filtering:', JSON.stringify(validAuthors, null, 2));
      
      // Convert author names to firstName and lastName
      const authorsForUpdate = validAuthors.map(author => {
        const nameParts = author.name.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        return {
          firstName,
          lastName,
          email: author.email ? author.email.trim() : undefined,
          isCorresponding: author.isCorresponding
        };
      });
      
      // Debug: Log the authors for update
      console.log('Authors for update:', JSON.stringify(authorsForUpdate, null, 2));
      
      const updateData = {
        title: formData.title,
        abstract: formData.abstract,
        keywords: validKeywords,
        category: formData.category,
        paperType: formData.paperType || null,
        status: formData.status,
        authors: authorsForUpdate,
        issueId: formData.issueId || null,
        doi: formData.doi || null
      };

      // Debug: Log the data being sent
      console.log('Sending update data:', JSON.stringify(updateData, null, 2));

      const response = await fetch(`/api/papers/${paperId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      const result = await response.json();

      if (response.ok) {
        alert('Paper updated successfully!');
        router.push('/admin/papers');
      } else {
        alert(result.error || 'Failed to update paper');
      }
    } catch (error) {
      console.error('Error updating paper:', error);
      alert('Failed to update paper');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading paper data...</span>
        </div>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Paper Not Found</h1>
          <Link
            href="/admin/papers"
            className="text-blue-600 hover:text-blue-800"
          >
            Return to Papers List
          </Link>
        </div>
      </div>
    );
  }

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
                  <h1 className="text-3xl font-bold text-gray-900">Edit Paper</h1>
                  <p className="mt-2 text-gray-600">Update paper information and details</p>
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

                {isAdmin() && (
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
                )}
              </div>
            </div>
          </div>

          {/* Issue Assignment */}
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
                placeholder="10.xxxx/xxxxx"
              />
              {errors.doi && (
                <p className="mt-1 text-sm text-red-600">{errors.doi}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Format: 10.xxxx/xxxxx. Required for published papers.
              </p>
            </div>

            {paper.status === 'PUBLISHED' && paper.doi && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">Current DOI:</p>
                    <p className="text-sm text-blue-700">{paper.doi}</p>
                    <a
                      href={`https://doi.org/${paper.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm underline"
                    >
                      Resolve DOI
                    </a>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      paper.doiStatus === 'REGISTERED'
                        ? 'bg-green-100 text-green-800'
                        : paper.doiStatus === 'SUBMITTED'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {paper.doiStatus || 'PENDING'}
                    </span>
                  </div>
                </div>
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
            
            <div className="space-y-4">
              {formData.authors.map((author, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-700">Author {index + 1}</h3>
                    {formData.authors.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAuthor(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    )}
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
                        placeholder="Author name"
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
              
              <button
                type="button"
                onClick={addAuthor}
                className="w-full py-2 px-4 border border-dashed border-gray-300 rounded-md text-gray-600 hover:text-gray-800 hover:border-gray-400"
              >
                + Add Author
              </button>
              
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
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  )}
                  {index === formData.keywords.length - 1 && (
                    <button
                      type="button"
                      onClick={addKeyword}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Add
                    </button>
                  )}
                </div>
              ))}
              {errors.keywords && (
                <p className="text-sm text-red-600">{errors.keywords}</p>
              )}
            </div>
          </div>

          {/* Paper Content Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-blue-600" />
              Paper Content
            </h2>
            
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="text-sm text-blue-800 mb-2">
                  💡 <strong>Save content separately</strong> to easily edit and regenerate the paper PDF without re-uploading files.
                </p>
                <p className="text-xs text-blue-700">
                  Fill in the sections below and click &quot;Save Content&quot;. You can then regenerate the PDF anytime.
                </p>
              </div>

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
                  rows={6}
                  value={editableContent.introduction}
                  onChange={(e) => handleContentChange('introduction', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter the introduction section content..."
                />
              </div>

              {/* Literature Review */}
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
                  rows={6}
                  value={editableContent.literatureReview}
                  onChange={(e) => handleContentChange('literatureReview', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Review existing literature and develop hypotheses..."
                />
              </div>

              {/* Methodology */}
              <div>
                <label htmlFor="methodology" className="block text-sm font-medium text-gray-700 mb-2">
                  3. Methodology
                </label>
                <textarea
                  id="methodology"
                  rows={6}
                  value={editableContent.methodology}
                  onChange={(e) => handleContentChange('methodology', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe the research methodology..."
                />
              </div>

              {/* Results */}
              <div>
                <label htmlFor="results" className="block text-sm font-medium text-gray-700 mb-2">
                  4. Results
                </label>
                <textarea
                  id="results"
                  rows={6}
                  value={editableContent.results}
                  onChange={(e) => handleContentChange('results', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Present the research findings..."
                />
              </div>

              {/* Discussion */}
              <div>
                <label htmlFor="discussion" className="block text-sm font-medium text-gray-700 mb-2">
                  5. Discussion
                </label>
                <textarea
                  id="discussion"
                  rows={6}
                  value={editableContent.discussion}
                  onChange={(e) => handleContentChange('discussion', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Discuss the implications of the results..."
                />
              </div>

              {/* Conclusion */}
              <div>
                <label htmlFor="conclusion" className="block text-sm font-medium text-gray-700 mb-2">
                  6. Conclusion
                </label>
                <textarea
                  id="conclusion"
                  rows={5}
                  value={editableContent.conclusion}
                  onChange={(e) => handleContentChange('conclusion', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Summarize key findings and their significance..."
                />
              </div>

              {/* References */}
              <div>
                <label htmlFor="references" className="block text-sm font-medium text-gray-700 mb-2">
                  References
                </label>
                <textarea
                  id="references"
                  rows={6}
                  value={editableContent.references}
                  onChange={(e) => handleContentChange('references', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter references in appropriate format..."
                />
              </div>

              {/* Save and Regenerate Buttons */}
              <div className="flex items-center space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleGeneratePreview}
                  disabled={generatingPreview}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {generatingPreview ? 'Generating...' : 'Preview PDF'}
                </button>

                <button
                  type="button"
                  onClick={handleSaveContent}
                  disabled={savingContent}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {savingContent ? 'Saving...' : 'Save Content'}
                </button>
                
                {hasSavedContent && (
                  <button
                    type="button"
                    onClick={handleRegeneratePaper}
                    disabled={regeneratingPaper}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${regeneratingPaper ? 'animate-spin' : ''}`} />
                    {regeneratingPaper ? 'Regenerating...' : 'Regenerate Paper PDF'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Cover Image Upload */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Upload className="h-5 w-5 mr-2 text-blue-600" />
              Cover Image
            </h2>
            
            <div className="space-y-4">
              {/* Current Cover Image */}
              {paper.coverImage && (
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm font-medium text-gray-700 mb-2">Current Cover Image:</p>
                  <div className="flex items-center space-x-4">
                    <Image
                      src={paper.coverImage}
                      alt="Current cover"
                      width={128}
                      height={128}
                      className="object-cover rounded-lg border"
                    />
                    <div>
                      <p className="text-sm text-gray-600">{paper.coverImage.split('/').pop()}</p>
                      <button
                        type="button"
                        onClick={handleDeleteCoverImage}
                        className="mt-2 text-sm text-red-600 hover:text-red-800"
                      >
                        Remove Cover Image
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Upload New Cover Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload New Cover Image
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="cover-image-upload"
                  />
                  <label
                    htmlFor="cover-image-upload"
                    className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Image
                  </label>
                  {selectedImage && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{selectedImage.name}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedImage(null)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
                {selectedImage && (
                  <div className="mt-4">
                    <Image
                      src={URL.createObjectURL(selectedImage)}
                      alt="Preview"
                      width={128}
                      height={128}
                      className="object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={handleImageUpload}
                      disabled={uploadingImage}
                      className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploadingImage ? 'Uploading...' : 'Upload Cover Image'}
                    </button>
                  </div>
                )}
                {errors.image && (
                  <p className="mt-1 text-sm text-red-600">{errors.image}</p>
                )}
                <p className="mt-2 text-sm text-gray-500">
                  Accepted formats: JPEG, PNG, GIF, WebP. Maximum size: 5MB.
                </p>
              </div>
            </div>
          </div>

          {/* Current File Info */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Upload className="h-5 w-5 mr-2 text-blue-600" />
              Paper File
            </h2>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-700">
                  <strong>Current file:</strong> {paper.filePath.split('/').pop()}
                </p>
                {paper.updatedAt && (
                  <p className="text-sm text-gray-500 mt-1">
                    Last updated: {new Date(paper.updatedAt).toLocaleDateString()}
                  </p>
                )}
                <div className="mt-3 flex items-center space-x-3">
                  <a
                    href={`/api/papers/${paper.id}/download`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View PDF
                  </a>
                </div>
              </div>

              {/* Saved Content Section */}
              {hasSavedContent && (
                <div className="bg-green-50 border border-green-200 p-4 rounded-md">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-800 mb-1">
                        📄 Saved Paper Content Available
                      </p>
                      <p className="text-xs text-green-700">
                        This paper has saved content (text and images) that can be used to regenerate the PDF.
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowContentPreview(!showContentPreview)}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {showContentPreview ? 'Hide' : 'View'} Saved Content
                    </button>
                    <button
                      type="button"
                      onClick={handleRegeneratePaper}
                      disabled={regeneratingPaper}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${regeneratingPaper ? 'animate-spin' : ''}`} />
                      {regeneratingPaper ? 'Regenerating...' : 'Regenerate Paper PDF'}
                    </button>
                  </div>
                </div>
              )}

              {/* Content Preview */}
              {showContentPreview && savedContent && (
                <div className="bg-white border border-gray-200 rounded-md p-4 space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900">Saved Content Preview</h3>
                  
                  {savedContent.introduction && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-700 mb-1">Introduction:</h4>
                      <p className="text-xs text-gray-600 line-clamp-3">{savedContent.introduction}</p>
                    </div>
                  )}
                  
                  {savedContent.literatureReview && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-700 mb-1">Literature Review & Hypothesis Development:</h4>
                      <p className="text-xs text-gray-600 line-clamp-3">{savedContent.literatureReview}</p>
                    </div>
                  )}
                  
                  {savedContent.methodology && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-700 mb-1">Methodology:</h4>
                      <p className="text-xs text-gray-600 line-clamp-3">{savedContent.methodology}</p>
                    </div>
                  )}
                  
                  {savedContent.results && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-700 mb-1">Results:</h4>
                      <p className="text-xs text-gray-600 line-clamp-3">{savedContent.results}</p>
                    </div>
                  )}
                  
                  {savedContent.discussion && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-700 mb-1">Discussion:</h4>
                      <p className="text-xs text-gray-600 line-clamp-3">{savedContent.discussion}</p>
                    </div>
                  )}
                  
                  {savedContent.conclusion && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-700 mb-1">Conclusion:</h4>
                      <p className="text-xs text-gray-600 line-clamp-3">{savedContent.conclusion}</p>
                    </div>
                  )}
                  
                  {savedContent.references && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-700 mb-1">References:</h4>
                      <p className="text-xs text-gray-600 line-clamp-3">{savedContent.references}</p>
                    </div>
                  )}

                  {savedContent.images && savedContent.images.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-700 mb-1">
                        Saved Images: {savedContent.images.length}
                      </h4>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Certificate Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Award className="h-5 w-5 mr-2 text-blue-600" />
              Certificate Generation
            </h2>
            
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Award className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 mb-1">Publication Certificate</h3>
                    <p className="text-sm text-blue-700 mb-3">
                      Generate a professional certificate for the author of this published paper.
                      The certificate will include the author&apos;s name, paper title, and official IJARCM branding.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-blue-600 mb-2">
                      <span className="font-medium">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        paper.status === 'PUBLISHED'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {paper.status}
                      </span>
                    </div>
                    
                    {certificateInfo && (
                      <div className="mt-3 p-2 bg-green-100 border border-green-200 rounded text-xs">
                        <div className="flex items-center gap-2 text-green-800">
                          <span className="font-medium">Certificate:</span>
                          <span>{certificateInfo.isExisting ? 'Previously Generated' : 'Ready to Generate'}</span>
                        </div>
                        <div className="text-green-700 mt-1">
                          Certificate No: {certificateInfo.certificateNumber}
                        </div>
                        <div className="text-green-700">
                          Issue Date: {new Date(certificateInfo.issuedAt).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    {paper.status === 'PUBLISHED'
                      ? certificateInfo
                        ? certificateInfo.isExisting
                          ? 'Certificate has been previously generated and stored.'
                          : 'Certificate is ready for generation and download.'
                        : 'Certificate is ready for generation and download.'
                      : 'Paper must be published before certificate can be generated.'
                    }
                  </p>
                  {paper.status === 'PUBLISHED' && paper.paperAuthors.length > 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      Certificate issued to: {paper.paperAuthors[0].user.firstName} {paper.paperAuthors[0].user.lastName}
                    </p>
                  )}
                  {certificateInfo && (
                    <p className="text-sm text-gray-500 mt-1">
                      Issue Date: {new Date(certificateInfo.issuedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                
                <button
                  onClick={handleDownloadCertificate}
                  disabled={generatingCertificate || paper.status !== 'PUBLISHED'}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <Download className="h-4 w-4" />
                  {generatingCertificate ? 'Generating...' :
                   certificateInfo && certificateInfo.isExisting ? 'View Certificate' : 'Generate Certificate'}
                </button>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Link
              href="/admin/papers"
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {submitting ? 'Updating...' : 'Update Paper'}
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
                  onClick={handleDownloadPreviewPdf}
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
                onClick={handleUsePreviewPdf}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <Save className="h-4 w-4 inline mr-2" />
                Save & Use This PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}