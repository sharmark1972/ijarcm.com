'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Upload,
  FileText,
  Users,
  Tag,
  Calendar,
  AlertCircle,
  CheckCircle,
  X,
  Plus,
  Trash2,
  Save,
  Send,
  Eye,
  Download,
  RefreshCw,
  DollarSign,
  Info
} from 'lucide-react';
import DynamicSEO from '@/components/DynamicSEO';
import WebsiteSchema from '@/components/schema/WebsiteSchema';
import Breadcrumbs from '@/components/Breadcrumbs';

interface Author {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  institution: string;
  isCorresponding: boolean;
}

interface PaperSubmission {
  title: string;
  abstract: string;
  keywords: string[];
  category: string;
  authors: Author[];
  file: File | null;
  coverLetter: string;
  suggestedReviewers: string;
  conflictOfInterest: string;
  ethicsStatement: string;
  fundingInformation: string;
}

const categories = [
  'Computer Science',
  'Engineering',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Medicine',
  'Environmental Science',
  'Social Sciences',
  'Business & Economics',
  'Education',
  'Psychology'
];

export default function SubmitPaper() {
  const { user, isAuthenticated, canSubmitPaper } = useAuth();
  const [submission, setSubmission] = useState<PaperSubmission>({
    title: '',
    abstract: '',
    keywords: [],
    category: '',
    authors: [],
    file: null,
    coverLetter: '',
    suggestedReviewers: '',
    conflictOfInterest: '',
    ethicsStatement: '',
    fundingInformation: ''
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [newKeyword, setNewKeyword] = useState('');
  const [newAuthor, setNewAuthor] = useState<Omit<Author, 'id'>>({
    firstName: '',
    lastName: '',
    email: '',
    institution: '',
    isCorresponding: false
  });
  const [dragActive, setDragActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveAsDraft, setSaveAsDraft] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      redirect('/auth/login');
    } else if (!canSubmitPaper()) {
      redirect('/dashboard');
    }
  }, [isAuthenticated, canSubmitPaper]);

  useEffect(() => {
    // Add current user as first author if not already added
    if (user && submission.authors.length === 0) {
      const currentUserAuthor: Author = {
        id: '1',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        institution: user.institution || '',
        isCorresponding: true
      };
      setSubmission(prev => ({
        ...prev,
        authors: [currentUserAuthor]
      }));
    }
  }, [user, submission.authors.length]);

  const steps = [
    { id: 1, name: 'Basic Information', description: 'Title, abstract, and keywords' },
    { id: 2, name: 'Authors', description: 'Add co-authors and their details' },
    { id: 3, name: 'File Upload', description: 'Upload your manuscript' },
    { id: 4, name: 'Additional Information', description: 'Cover letter and declarations' },
    { id: 5, name: 'Review & Submit', description: 'Review and submit your paper' }
  ];

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!submission.title.trim()) newErrors.title = 'Title is required';
        if (!submission.abstract.trim()) newErrors.abstract = 'Abstract is required';
        if (!submission.category) newErrors.category = 'Category is required';
        if (submission.keywords.length === 0) newErrors.keywords = 'At least one keyword is required';
        break;
      case 2:
        if (submission.authors.length === 0) newErrors.authors = 'At least one author is required';
        if (!submission.authors.some(a => a.isCorresponding)) {
          newErrors.authors = 'At least one corresponding author is required';
        }
        break;
      case 3:
        if (!submission.file) newErrors.file = 'Manuscript file is required';
        break;
      case 4:
        if (!submission.coverLetter.trim()) newErrors.coverLetter = 'Cover letter is required';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !submission.keywords.includes(newKeyword.trim())) {
      setSubmission(prev => ({
        ...prev,
        keywords: [...prev.keywords, newKeyword.trim()]
      }));
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setSubmission(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }));
  };

  const addAuthor = () => {
    if (newAuthor.firstName && newAuthor.lastName && newAuthor.email) {
      const author: Author = {
        ...newAuthor,
        id: Date.now().toString()
      };
      setSubmission(prev => ({
        ...prev,
        authors: [...prev.authors, author]
      }));
      setNewAuthor({
        firstName: '',
        lastName: '',
        email: '',
        institution: '',
        isCorresponding: false
      });
    }
  };

  const removeAuthor = (id: string) => {
    setSubmission(prev => ({
      ...prev,
      authors: prev.authors.filter(a => a.id !== id)
    }));
  };

  const updateAuthor = (id: string, field: keyof Author, value: any) => {
    setSubmission(prev => ({
      ...prev,
      authors: prev.authors.map(a => 
        a.id === id ? { ...a, [field]: value } : a
      )
    }));
  };

  const handleFileUpload = (file: File) => {
    // Validate file type and size
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      setErrors({ file: 'Only PDF, DOC, and DOCX files are allowed' });
      return;
    }

    if (file.size > maxSize) {
      setErrors({ file: 'File size must be less than 10MB' });
      return;
    }

    setSubmission(prev => ({ ...prev, file }));
    setErrors(prev => ({ ...prev, file: '' }));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (isDraft: boolean = false) => {
    if (!isDraft && !validateStep(5)) return;

    setSubmitting(true);
    setSaveAsDraft(isDraft);

    try {
      const formData = new FormData();
      formData.append('title', submission.title);
      formData.append('abstract', submission.abstract);
      formData.append('keywords', JSON.stringify(submission.keywords));
      formData.append('category', submission.category);
      formData.append('authors', JSON.stringify(submission.authors));
      formData.append('coverLetter', submission.coverLetter);
      formData.append('suggestedReviewers', submission.suggestedReviewers);
      formData.append('conflictOfInterest', submission.conflictOfInterest);
      formData.append('ethicsStatement', submission.ethicsStatement);
      formData.append('fundingInformation', submission.fundingInformation);
      formData.append('isDraft', isDraft.toString());
      
      if (submission.file) {
        formData.append('manuscript', submission.file);
      }

      const response = await fetch('/api/papers/submit', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        // Show success message based on draft status
        const message = isDraft ? 'Paper saved as draft successfully!' : 'Paper submitted successfully!';
        setErrors({ submit: '' }); // Clear any previous errors
        
        // Redirect to dashboard with success message
        redirect(`/dashboard?${isDraft ? 'drafted' : 'submitted'}=true`);
      } else {
        throw new Error(result.message || 'Submission failed');
      }
    } catch (error) {
      console.error('Submission failed:', error);
      setErrors({ submit: 'Failed to submit paper. Please try again.' });
    } finally {
      setSubmitting(false);
      setSaveAsDraft(false);
    }
  };

  return (
    <>
      <DynamicSEO
        title="Submit Paper - IJARCM | International Journal of Academic Research in Commerce and Management"
        description="Submit your research paper to IJARCM for peer review and publication. Our streamlined submission process ensures efficient handling of your academic work in commerce and management."
        keywords={[
          'submit paper IJARCM',
          'academic paper submission',
          'research paper submission',
          'journal submission',
          'commerce management research',
          'peer review submission',
          'academic publishing',
          'manuscript submission'
        ]}
        canonicalUrl="/submit"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Submit Paper',
          description: 'Submit your research paper to IJARCM for peer review and publication.',
          url: 'https://ijrcam.com/submit',
          publisher: {
            '@type': 'Organization',
            name: 'IJARCM',
            url: 'https://ijrcam.com'
          }
        }}
      />
      <WebsiteSchema />
      <Breadcrumbs />
      
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">Submit New Paper</h1>
            <p className="mt-2 text-gray-600">Submit your research paper for peer review and publication</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Publication Fees Info Box */}
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-4">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-1">Publication Fees</h3>
            <p className="text-sm text-blue-800 mb-2">
              Submission is FREE. Publication charges apply only after your paper is accepted.
            </p>
            <Link 
              href="/fees" 
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
            >
              View Publication Fees & APC Calculator
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <nav aria-label="Progress">
            <ol className="flex items-center">
              {steps.map((step, stepIdx) => (
                <li key={step.id} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
                  {stepIdx !== steps.length - 1 && (
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className={`h-0.5 w-full ${currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'}`} />
                    </div>
                  )}
                  <div className="relative flex items-center justify-center">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        currentStep > step.id
                          ? 'bg-blue-600 text-white'
                          : currentStep === step.id
                          ? 'bg-blue-100 text-blue-600 border-2 border-blue-600'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {currentStep > step.id ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        step.id
                      )}
                    </div>
                  </div>
                  <div className="mt-2 text-center">
                    <p className={`text-sm font-medium ${currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'}`}>
                      {step.name}
                    </p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </nav>
        </div>

        {/* Form Content */}
        <div className="bg-white shadow-sm rounded-lg">
          <div className="p-6">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Paper Title *
                  </label>
                  <input
                    type="text"
                    value={submission.title}
                    onChange={(e) => setSubmission(prev => ({ ...prev, title: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.title ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter your paper title"
                  />
                  {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={submission.category}
                    onChange={(e) => setSubmission(prev => ({ ...prev, category: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.category ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Abstract *
                  </label>
                  <textarea
                    value={submission.abstract}
                    onChange={(e) => setSubmission(prev => ({ ...prev, abstract: e.target.value }))}
                    rows={6}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.abstract ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter your paper abstract (maximum 300 words)"
                  />
                  {errors.abstract && <p className="mt-1 text-sm text-red-600">{errors.abstract}</p>}
                  <p className="mt-1 text-sm text-gray-500">
                    {submission.abstract.split(' ').filter(word => word.length > 0).length}/300 words
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Keywords *
                  </label>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Add a keyword"
                    />
                    <button
                      type="button"
                      onClick={addKeyword}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {submission.keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                      >
                        {keyword}
                        <button
                          type="button"
                          onClick={() => removeKeyword(keyword)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  {errors.keywords && <p className="mt-1 text-sm text-red-600">{errors.keywords}</p>}
                </div>
              </div>
            )}

            {/* Step 2: Authors */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Authors</h3>
                
                {/* Existing Authors */}
                <div className="space-y-4">
                  {submission.authors.map((author, index) => (
                    <div key={author.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-900">
                          Author {index + 1} {author.isCorresponding && '(Corresponding)'}
                        </h4>
                        {submission.authors.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeAuthor(author.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            First Name
                          </label>
                          <input
                            type="text"
                            value={author.firstName}
                            onChange={(e) => updateAuthor(author.id, 'firstName', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Last Name
                          </label>
                          <input
                            type="text"
                            value={author.lastName}
                            onChange={(e) => updateAuthor(author.id, 'lastName', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                          </label>
                          <input
                            type="email"
                            value={author.email}
                            onChange={(e) => updateAuthor(author.id, 'email', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Institution
                          </label>
                          <input
                            type="text"
                            value={author.institution}
                            onChange={(e) => updateAuthor(author.id, 'institution', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <div className="mt-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={author.isCorresponding}
                            onChange={(e) => updateAuthor(author.id, 'isCorresponding', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-900">Corresponding Author</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add New Author */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Add Co-Author</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <input
                        type="text"
                        value={newAuthor.firstName}
                        onChange={(e) => setNewAuthor(prev => ({ ...prev, firstName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="First Name"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={newAuthor.lastName}
                        onChange={(e) => setNewAuthor(prev => ({ ...prev, lastName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Last Name"
                      />
                    </div>
                    <div>
                      <input
                        type="email"
                        value={newAuthor.email}
                        onChange={(e) => setNewAuthor(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Email"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={newAuthor.institution}
                        onChange={(e) => setNewAuthor(prev => ({ ...prev, institution: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Institution"
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newAuthor.isCorresponding}
                        onChange={(e) => setNewAuthor(prev => ({ ...prev, isCorresponding: e.target.checked }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-900">Corresponding Author</span>
                    </label>
                    <button
                      type="button"
                      onClick={addAuthor}
                      disabled={!newAuthor.firstName || !newAuthor.lastName || !newAuthor.email}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add Author
                    </button>
                  </div>
                </div>
                
                {errors.authors && <p className="text-sm text-red-600">{errors.authors}</p>}
              </div>
            )}

            {/* Step 3: File Upload */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Upload Manuscript</h3>
                
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive
                      ? 'border-blue-400 bg-blue-50'
                      : errors.file
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  {submission.file ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center">
                        <FileText className="h-12 w-12 text-green-600" />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-gray-900">{submission.file.name}</p>
                        <p className="text-sm text-gray-500">
                          {(submission.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <div className="flex justify-center space-x-4">
                        <button
                          type="button"
                          onClick={() => setSubmission(prev => ({ ...prev, file: null }))}
                          className="px-4 py-2 text-sm font-medium text-red-600 bg-red-100 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          Remove File
                        </button>
                        <label className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                          Replace File
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                          />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center">
                        <Upload className="h-12 w-12 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-gray-900">Upload your manuscript</p>
                        <p className="text-sm text-gray-500">
                          Drag and drop your file here, or click to browse
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          Supported formats: PDF, DOC, DOCX (max 10MB)
                        </p>
                      </div>
                      <label className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer">
                        <Upload className="h-5 w-5 mr-2" />
                        Choose File
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                        />
                      </label>
                    </div>
                  )}
                </div>
                
                {errors.file && <p className="text-sm text-red-600">{errors.file}</p>}
                
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-blue-800">File Requirements</h4>
                      <div className="mt-2 text-sm text-blue-700">
                        <ul className="list-disc list-inside space-y-1">
                          <li>File must be in PDF, DOC, or DOCX format</li>
                          <li>Maximum file size is 10MB</li>
                          <li>Ensure all figures and tables are clearly visible</li>
                          <li>Remove any author identifying information for blind review</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Additional Information */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cover Letter *
                  </label>
                  <textarea
                    value={submission.coverLetter}
                    onChange={(e) => setSubmission(prev => ({ ...prev, coverLetter: e.target.value }))}
                    rows={6}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.coverLetter ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Explain the significance of your work and why it should be published in this journal..."
                  />
                  {errors.coverLetter && <p className="mt-1 text-sm text-red-600">{errors.coverLetter}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Suggested Reviewers
                  </label>
                  <textarea
                    value={submission.suggestedReviewers}
                    onChange={(e) => setSubmission(prev => ({ ...prev, suggestedReviewers: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Suggest potential reviewers with their names, institutions, and email addresses..."
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Optional: Suggest 2-3 potential reviewers who are experts in your field
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conflict of Interest Statement
                  </label>
                  <textarea
                    value={submission.conflictOfInterest}
                    onChange={(e) => setSubmission(prev => ({ ...prev, conflictOfInterest: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Declare any potential conflicts of interest or state 'None'..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ethics Statement
                  </label>
                  <textarea
                    value={submission.ethicsStatement}
                    onChange={(e) => setSubmission(prev => ({ ...prev, ethicsStatement: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe ethical considerations, IRB approval, consent procedures, etc..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Funding Information
                  </label>
                  <textarea
                    value={submission.fundingInformation}
                    onChange={(e) => setSubmission(prev => ({ ...prev, fundingInformation: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="List funding sources, grant numbers, and acknowledgments..."
                  />
                </div>
              </div>
            )}

            {/* Step 5: Review & Submit */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Review & Submit</h3>
                
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-base font-medium text-gray-900 mb-4">Submission Summary</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Title:</span>
                      <p className="text-sm text-gray-900 mt-1">{submission.title}</p>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-gray-700">Category:</span>
                      <p className="text-sm text-gray-900 mt-1">{submission.category}</p>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-gray-700">Authors:</span>
                      <div className="mt-1">
                        {submission.authors.map((author, index) => (
                          <p key={author.id} className="text-sm text-gray-900">
                            {index + 1}. {author.firstName} {author.lastName} ({author.institution})
                            {author.isCorresponding && ' - Corresponding Author'}
                          </p>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-gray-700">Keywords:</span>
                      <p className="text-sm text-gray-900 mt-1">{submission.keywords.join(', ')}</p>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-gray-700">Manuscript:</span>
                      <p className="text-sm text-gray-900 mt-1">
                        {submission.file?.name} ({submission.file && (submission.file.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5" />
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-yellow-800">Before You Submit</h4>
                      <div className="mt-2 text-sm text-yellow-700">
                        <ul className="list-disc list-inside space-y-1">
                          <li>Review all information for accuracy</li>
                          <li>Ensure your manuscript follows journal guidelines</li>
                          <li>Verify that all co-authors have approved the submission</li>
                          <li>Check that ethical requirements are met</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                
                {errors.submit && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex">
                      <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
                      <div className="ml-3">
                        <p className="text-sm text-red-700">{errors.submit}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Previous
                </button>
              )}
            </div>
            
            <div className="flex space-x-3">
              {currentStep === 5 ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleSubmit(true)}
                    disabled={submitting}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saveAsDraft ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save as Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSubmit(false)}
                    disabled={submitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting && !saveAsDraft ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Submit Paper
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}