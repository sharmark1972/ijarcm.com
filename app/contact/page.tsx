'use client';

import { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, MessageSquare, Users, HelpCircle, Loader2 } from 'lucide-react';
import DynamicSEO from '@/components/DynamicSEO';
import WebsiteSchema from '@/components/schema/WebsiteSchema';
import Breadcrumbs from '@/components/Breadcrumbs';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setSubmitted(true);
    setIsSubmitting(false);
    setFormData({ name: '', email: '', subject: '', category: '', message: '' });
  };

  return (
    <>
      <DynamicSEO
        title="Contact Us - IJARCM"
        description="Get in touch with IJARCM editorial team. Contact us for manuscript submissions, technical support, or general inquiries."
        keywords={['contact IJARCM', 'editorial contact', 'academic journal support']}
        canonicalUrl="/contact"
      />
      <WebsiteSchema />
      
      <div className="bg-white py-4 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Contact', href: '/contact' }
            ]}
          />
        </div>
      </div>

      <div className="min-h-screen bg-slate-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-serif font-bold text-slate-900 mb-6">Contact Us</h1>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
              We&apos;re here to help! Whether you have questions about submissions, need technical support, or want to learn more about IJARCM, we&apos;d love to hear from you.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Contact Information */}
            <div className="lg:col-span-1 space-y-8">
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8">
                <h2 className="text-xl font-serif font-bold text-slate-900 mb-6">Get in Touch</h2>
                
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="flex items-center justify-center w-10 h-10 bg-slate-100 rounded-lg mr-4 flex-shrink-0">
                      <Mail className="h-5 w-5 text-slate-700" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 mb-1 uppercase tracking-wide">Email</h3>
                      <a href="mailto:info@ijarcm.com" className="block text-slate-600 hover:text-blue-700">info@ijarcm.com</a>
                      <a href="mailto:editor@ijarcm.com" className="block text-slate-600 hover:text-blue-700">editor@ijarcm.com</a>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex items-center justify-center w-10 h-10 bg-slate-100 rounded-lg mr-4 flex-shrink-0">
                      <Phone className="h-5 w-5 text-slate-700" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 mb-1 uppercase tracking-wide">Phone</h3>
                      <p className="text-slate-600">+91 8562985629</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex items-center justify-center w-10 h-10 bg-slate-100 rounded-lg mr-4 flex-shrink-0">
                      <MapPin className="h-5 w-5 text-slate-700" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 mb-1 uppercase tracking-wide">Address</h3>
                      <p className="text-slate-600 text-sm leading-relaxed">
                        Sharma Tower, 24, Dhawan Complex<br />
                        Street No. 4, Vijay Nagar<br />
                        Amritsar, Punjab - 143001
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex items-center justify-center w-10 h-10 bg-slate-100 rounded-lg mr-4 flex-shrink-0">
                      <Clock className="h-5 w-5 text-slate-700" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 mb-1 uppercase tracking-wide">Office Hours</h3>
                      <p className="text-slate-600 text-sm">
                        Mon - Fri: 9:00 AM - 6:00 PM<br />
                        Sat: 10:00 AM - 4:00 PM
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8">
                <h3 className="text-lg font-serif font-bold text-slate-900 mb-4">Quick Support</h3>
                <div className="space-y-3">
                  <button className="w-full flex items-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-left">
                    <MessageSquare className="h-5 w-5 text-slate-500 mr-3" />
                    <span className="text-slate-700 font-medium text-sm">Live Chat</span>
                  </button>
                  <button className="w-full flex items-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-left">
                    <HelpCircle className="h-5 w-5 text-slate-500 mr-3" />
                    <span className="text-slate-700 font-medium text-sm">FAQ Center</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8">
                <h2 className="text-2xl font-serif font-bold text-slate-900 mb-6">Send us a Message</h2>
                
                {submitted ? (
                  <div className="text-center py-16">
                    <div className="flex items-center justify-center w-16 h-16 bg-green-50 rounded-full mx-auto mb-6">
                      <Send className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Message Sent Successfully</h3>
                    <p className="text-slate-600 mb-8">
                      Thank you for contacting us. We&apos;ll get back to you within 24 hours.
                    </p>
                    <button
                      onClick={() => setSubmitted(false)}
                      className="inline-flex items-center px-6 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500 transition-all text-sm"
                          placeholder="Dr. John Doe"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500 transition-all text-sm"
                          placeholder="john@university.edu"
                        />
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-2">
                          Topic *
                        </label>
                        <select
                          id="category"
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500 transition-all text-sm bg-white"
                        >
                          <option value="">Select a topic</option>
                          <option value="submission">Manuscript Submission</option>
                          <option value="review">Peer Review Process</option>
                          <option value="technical">Technical Support</option>
                          <option value="editorial">Editorial Inquiry</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      
                      <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-2">
                          Subject *
                        </label>
                        <input
                          type="text"
                          id="subject"
                          name="subject"
                          value={formData.subject}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500 transition-all text-sm"
                          placeholder="Brief subject line"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-2">
                        Message *
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                        rows={6}
                        className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500 transition-all text-sm resize-y"
                        placeholder="Please provide details about your inquiry..."
                      />
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <p className="text-xs text-slate-500">
                        * Required fields
                      </p>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center px-8 py-2.5 border border-transparent text-sm font-medium rounded-md text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="animate-spin h-4 w-4 mr-2" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Send Message
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
