'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { 
  FileText, 
  Download, 
  Star, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft,
  Send,
  Eye,
  Calendar
} from 'lucide-react';

interface Paper {
  id: string;
  title: string;
  abstract: string;
  keywords: string[];
  fileName: string;
  fileSize: number;
  submittedAt: string;
  status: string;
  authors: {
    firstName: string;
    lastName: string;
    institution: string;
    email: string;
  }[];
  submittedBy: {
    firstName: string;
    lastName: string;
    institution: string;
  };
}

interface Review {
  id: string;
  rating: number;
  comments: string;
  recommendation: string;
  submittedAt: string;
  status: string;
}

export default function ReviewPaperPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isReviewer } = useAuth();
  const [paper, setPaper] = useState<Paper | null>(null);
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  
  // Review form state
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [confidenceLevel, setConfidenceLevel] = useState('');
  const [technicalQuality, setTechnicalQuality] = useState(0);
  const [novelty, setNovelty] = useState(0);
  const [clarity, setClarity] = useState(0);
  const [significance, setSignificance] = useState(0);

  const fetchPaperAndReview = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch paper details
      const paperResponse = await fetch(`/api/papers/${params.id}`);
      if (paperResponse.ok) {
        const paperData = await paperResponse.json();
        setPaper(paperData);
      }
      
      // Fetch existing review if any
      const reviewResponse = await fetch(`/api/reviews/${params.id}`);
      if (reviewResponse.ok) {
        const reviewData = await reviewResponse.json();
        if (reviewData) {
          setExistingReview(reviewData);
          setRating(reviewData.rating);
          setComments(reviewData.comments);
          setRecommendation(reviewData.recommendation);
          setConfidenceLevel(reviewData.confidenceLevel || '');
          setTechnicalQuality(reviewData.technicalQuality || 0);
          setNovelty(reviewData.novelty || 0);
          setClarity(reviewData.clarity || 0);
          setSignificance(reviewData.significance || 0);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (!isReviewer()) {
      router.push('/dashboard');
      return;
    }
    fetchPaperAndReview();
  }, [params.id, fetchPaperAndReview, isReviewer, router]);

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/papers/${params.id}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = paper?.fileName || 'paper.pdf';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading paper:', error);
    }
  };

  const handleSubmitReview = async () => {
    if (!rating || !comments || !recommendation) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      
      const reviewData = {
        paperId: params.id,
        rating,
        comments,
        recommendation,
        confidenceLevel,
        technicalQuality,
        novelty,
        clarity,
        significance
      };

      const response = await fetch('/api/reviews', {
        method: existingReview ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reviewData)
      });

      if (response.ok) {
        alert('Review submitted successfully!');
        router.push('/dashboard/reviewer');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Error submitting review');
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ value, onChange, label }: { value: number; onChange: (value: number) => void; label: string }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`p-1 ${star <= value ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400 transition-colors`}
          >
            <Star className="w-6 h-6 fill-current" />
          </button>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading paper details...</p>
        </div>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Paper Not Found</h1>
          <p className="text-gray-600 mb-4">The requested paper could not be found or you don&apos;t have permission to review it.</p>
          <button
            onClick={() => router.push('/dashboard/reviewer')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard/reviewer')}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </button>
              <div className="h-6 border-l border-gray-300"></div>
              <h1 className="text-xl font-semibold text-gray-900">Paper Review</h1>
            </div>
            <div className="flex items-center space-x-3">
              {existingReview && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Review Submitted
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Paper Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Paper Info Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{paper.title}</h2>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Submitted: {new Date(paper.submittedAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center">
                      <FileText className="w-4 h-4 mr-1" />
                      {(paper.fileSize / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowPdfViewer(!showPdfViewer)}
                    className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {showPdfViewer ? 'Hide' : 'View'} PDF
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </button>
                </div>
              </div>

              {/* Authors */}
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Authors</h3>
                <div className="space-y-1">
                  {paper.authors.map((author, index) => (
                    <div key={index} className="text-sm text-gray-600">
                      {author.firstName} {author.lastName} - {author.institution}
                    </div>
                  ))}
                </div>
              </div>

              {/* Abstract */}
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Abstract</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{paper.abstract}</p>
              </div>

              {/* Keywords */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {paper.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* PDF Viewer */}
            {showPdfViewer && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">PDF Viewer</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">PDF viewer would be integrated here</p>
                  <p className="text-sm text-gray-500">Use a library like react-pdf or pdf.js for full PDF viewing functionality</p>
                </div>
              </div>
            )}
          </div>

          {/* Review Form */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Review Form</h3>
              
              {/* Overall Rating */}
              <StarRating
                value={rating}
                onChange={setRating}
                label="Overall Rating *"
              />

              {/* Detailed Ratings */}
              <StarRating
                value={technicalQuality}
                onChange={setTechnicalQuality}
                label="Technical Quality"
              />
              
              <StarRating
                value={novelty}
                onChange={setNovelty}
                label="Novelty & Originality"
              />
              
              <StarRating
                value={clarity}
                onChange={setClarity}
                label="Clarity & Presentation"
              />
              
              <StarRating
                value={significance}
                onChange={setSignificance}
                label="Significance & Impact"
              />

              {/* Recommendation */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Recommendation *</label>
                <select
                  value={recommendation}
                  onChange={(e) => setRecommendation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select recommendation</option>
                  <option value="ACCEPT">Accept</option>
                  <option value="MINOR_REVISION">Minor Revision</option>
                  <option value="MAJOR_REVISION">Major Revision</option>
                  <option value="REJECT">Reject</option>
                </select>
              </div>

              {/* Confidence Level */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Confidence Level</label>
                <select
                  value={confidenceLevel}
                  onChange={(e) => setConfidenceLevel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select confidence level</option>
                  <option value="HIGH">High - I am very confident</option>
                  <option value="MEDIUM">Medium - I am somewhat confident</option>
                  <option value="LOW">Low - I am not very confident</option>
                </select>
              </div>

              {/* Comments */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Detailed Comments *</label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Provide detailed feedback on the paper's strengths, weaknesses, and suggestions for improvement..."
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmitReview}
                disabled={submitting || !rating || !comments || !recommendation}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                {existingReview ? 'Update Review' : 'Submit Review'}
              </button>
            </div>

            {/* Review Guidelines */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h4 className="text-sm font-semibold text-blue-900 mb-3">Review Guidelines</h4>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>• Evaluate technical quality and methodology</li>
                <li>• Assess novelty and significance of contributions</li>
                <li>• Check clarity of presentation and writing</li>
                <li>• Verify reproducibility of results</li>
                <li>• Provide constructive feedback</li>
                <li>• Maintain confidentiality</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}