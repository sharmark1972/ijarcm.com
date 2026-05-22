'use client';

import { useState } from 'react';
import Link from 'next/link';
import DynamicSEO from '@/components/DynamicSEO';
import WebsiteSchema from '@/components/schema/WebsiteSchema';
import { 
  HelpCircle, 
  BookOpen, 
  MessageSquare, 
  Mail, 
  Phone, 
  Clock,
  Search,
  FileText,
  Download,
  Upload,
  User,
  Shield,
  CreditCard,
  ChevronRight,
  ChevronDown,
  ExternalLink
} from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';

const HelpPage = () => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const helpCategories = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: <BookOpen className="w-5 h-5" />,
      items: [
        {
          question: 'How do I create an account?',
          answer: 'Click on the "Sign Up" button in the top right corner of the homepage. Fill in your details including email, name, and institution. You\'ll receive a verification email to activate your account.'
        },
        {
          question: 'How do I submit a paper?',
          answer: 'Navigate to the "Submit Paper" section from the main menu. Fill in the paper details, upload your PDF file, and submit for review. Our editorial team will review your submission within 5-7 business days.'
        },
        {
          question: 'What are the submission guidelines?',
          answer: 'Papers should be in PDF format, follow academic writing standards, be between 3000-8000 words, and include proper citations. Please refer to our detailed submission guidelines for specific formatting requirements.'
        }
      ]
    },
    {
      id: 'paper-management',
      title: 'Paper Management',
      icon: <FileText className="w-5 h-5" />,
      items: [
        {
          question: 'How do I download papers?',
          answer: 'Browse the library and click on any paper to view details. Click the "Download PDF" button to save the paper to your device. You must be logged in to download papers.'
        },
        {
          question: 'Can I edit my submitted paper?',
          answer: 'Yes, you can edit your paper while it\'s under review. Go to your dashboard, find the paper in "My Submissions," and click "Edit." Once a paper is published, edits require admin approval.'
        },
        {
          question: 'How do I track my paper status?',
          answer: 'Visit your dashboard and check the "My Submissions" section. You\'ll see real-time status updates: Submitted, Under Review, Approved, Published, or Rejected.'
        }
      ]
    },
    {
      id: 'account-issues',
      title: 'Account & Profile',
      icon: <User className="w-5 h-5" />,
      items: [
        {
          question: 'How do I reset my password?',
          answer: 'Click "Forgot Password" on the login page. Enter your email address, and we\'ll send you a password reset link. The link expires after 24 hours.'
        },
        {
          question: 'How do I update my profile information?',
          answer: 'Go to your dashboard and click "Edit Profile." You can update your name, institution, bio, and other personal information. Click "Save" to apply changes.'
        },
        {
          question: 'How do I change my email address?',
          answer: 'Contact support through the help center or email support@ijrcam.com. For security reasons, email changes require verification.'
        }
      ]
    },
    {
      id: 'payment-subscription',
      title: 'Payment & Subscription',
      icon: <CreditCard className="w-5 h-5" />,
      items: [
        {
          question: 'What payment methods do you accept?',
          answer: 'We accept credit/debit cards (Visa, MasterCard, American Express), PayPal, and bank transfers for institutional subscriptions.'
        },
        {
          question: 'How do I cancel my subscription?',
          answer: 'Go to your dashboard, select "Subscription Settings," and click "Cancel Subscription." Your access will continue until the end of your billing period.'
        },
        {
          question: 'Do you offer institutional access?',
          answer: 'Yes, we offer institutional subscriptions. Contact our sales team at sales@ijrcam.com for custom pricing and access arrangements.'
        }
      ]
    },
    {
      id: 'technical-issues',
      title: 'Technical Issues',
      icon: <Shield className="w-5 h-5" />,
      items: [
        {
          question: 'PDF files won\'t download properly?',
          answer: 'Check your internet connection and browser settings. Ensure pop-ups are allowed for our site. Try clearing your browser cache or using a different browser.'
        },
        {
          question: 'I can\'t upload my paper?',
          answer: 'Ensure your PDF is under 10MB and not corrupted. Check that you have a stable internet connection. Try compressing large files before uploading.'
        },
        {
          question: 'The website is loading slowly?',
          answer: 'Clear your browser cache, disable browser extensions, or try accessing the site from a different network. Contact support if issues persist.'
        }
      ]
    }
  ];

  const filteredCategories = helpCategories.map(category => ({
    ...category,
    items: category.items.filter(item =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.items.length > 0);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  return (
    <>
      <DynamicSEO
        title="Help Center - IJARCM | Support & FAQs"
        description="Find answers to common questions and get help with IJARCM services. Access our comprehensive help documentation and support resources."
        keywords={['help center', 'support', 'FAQs', 'IJARCM', 'assistance', 'documentation']}
        canonicalUrl="/help"
      />
      <WebsiteSchema
        name="IJARCM Help Center"
        url="https://ijrcam.com/help"
        description="Help center and support documentation for IJARCM"
      />
      
      <div className="bg-white py-4 border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs 
            items={[
              { label: 'Home', href: '/' },
              { label: 'Help Center', href: '/help' }
            ]}
          />
        </div>
      </div>

      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Help Center</h1>
            <Link
              href="/support"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Contact Support
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/submit"
            className="flex items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
          >
            <Upload className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <h3 className="font-semibold text-gray-900">Submit Paper</h3>
              <p className="text-sm text-gray-600">Share your research</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
          </Link>

          <Link
            href="/library"
            className="flex items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
          >
            <Download className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <h3 className="font-semibold text-gray-900">Browse Library</h3>
              <p className="text-sm text-gray-600">Access papers</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
          </Link>

          <Link
            href="/support"
            className="flex items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
          >
            <MessageSquare className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <h3 className="font-semibold text-gray-900">Get Support</h3>
              <p className="text-sm text-gray-600">Contact our team</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
          </Link>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-6">
          {filteredCategories.map((category) => (
            <div key={category.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <div className="text-blue-600 mr-3">{category.icon}</div>
                  <h2 className="text-lg font-semibold text-gray-900">{category.title}</h2>
                </div>
                {expandedCategory === category.id ? (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
              </button>
              
              {expandedCategory === category.id && (
                <div className="border-t border-gray-200">
                  {category.items.map((item, index) => (
                    <div key={index} className="px-6 py-4 border-b border-gray-100 last:border-b-0">
                      <h3 className="font-medium text-gray-900 mb-2">{item.question}</h3>
                      <p className="text-gray-600 leading-relaxed">{item.answer}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact Information */}
        <div className="mt-12 bg-blue-50 rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Still Need Help?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start">
              <Mail className="w-5 h-5 text-blue-600 mr-3 mt-1" />
              <div>
                <h3 className="font-medium text-gray-900">Email Support</h3>
                <p className="text-gray-600">support@ijrcam.com</p>
                <p className="text-sm text-gray-500">Response within 24 hours</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <Phone className="w-5 h-5 text-blue-600 mr-3 mt-1" />
              <div>
                <h3 className="font-medium text-gray-900">Phone Support</h3>
                <p className="text-gray-600">8562985629</p>
                <p className="text-sm text-gray-500">Mon-Fri, 9 AM - 6 PM EST</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <Clock className="w-5 h-5 text-blue-600 mr-3 mt-1" />
              <div>
                <h3 className="font-medium text-gray-900">Response Time</h3>
                <p className="text-gray-600">Email: 24 hours</p>
                <p className="text-sm text-gray-500">Phone: Immediate</p>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <Link
              href="/support"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              Create Support Ticket
            </Link>
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default HelpPage;