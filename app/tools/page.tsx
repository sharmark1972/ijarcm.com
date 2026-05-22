'use client';

import { useState } from 'react';
import { Wrench, Sparkles, Copy, Check, RefreshCw, AlertCircle, Shield, Quote, Edit3, BookOpenCheck, CheckCircle, Languages, Info, X } from 'lucide-react';

type ToolType = 'ai-humanizer' | 'grammar-checker' | 'paraphraser' | 'plagiarism-checker' | 'citation-generator' | 'readability-analyzer' | 'ai-content-editor';

export default function ToolsPage() {
  const [activeTool, setActiveTool] = useState<ToolType | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  // AI Humanizer State
  const [aiText, setAiText] = useState('');
  const [humanizedText, setHumanizedText] = useState('');
  const [bypassScore, setBypassScore] = useState(0);
  const [intensity, setIntensity] = useState<'light' | 'medium' | 'strong'>('medium');

  // Grammar Checker State
  const [grammarText, setGrammarText] = useState('');
  const [grammarIssues, setGrammarIssues] = useState<Array<{message: string, suggestion: string, type: string, position: number, original: string}>>([]);
  const [readability, setReadability] = useState<any>(null);

  // Paraphraser State
  const [paraphraseText, setParaphraseText] = useState('');
  const [paraphrasedText, setParaphrasedText] = useState('');
  const [paraphraseIntensity, setParaphraseIntensity] = useState<'light' | 'medium' | 'strong'>('medium');
  const [qualityScore, setQualityScore] = useState(0);

  // Plagiarism Checker State
  const [plagiarismText, setPlagiarismText] = useState('');
  const [plagiarismResult, setPlagiarismResult] = useState<any>(null);

  // Citation Generator State
  const [citationSource, setCitationSource] = useState({
    type: 'book',
    title: '',
    authors: [{ first: '', last: '' }],
    year: '',
    publisher: '',
  });
  const [citationFormat, setCitationFormat] = useState<'apa' | 'mla' | 'chicago' | 'harvard' | 'vancouver'>('apa');
  const [generatedCitation, setGeneratedCitation] = useState('');

  // Readability Analyzer State
  const [readabilityText, setReadabilityText] = useState('');
  const [readabilityAnalysis, setReadabilityAnalysis] = useState<any>(null);

  // AI Content Editor State
  const [aiEditorText, setAiEditorText] = useState('');
  const [aiEditorResult, setAiEditorResult] = useState<any>(null);

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tools = [
    {
      id: 'ai-humanizer' as ToolType,
      name: 'AI Humanizer',
      description: 'Transform AI-generated text into human-like content',
      icon: Sparkles,
      color: 'from-blue-500 to-purple-600',
      status: 'active',
    },
    {
      id: 'grammar-checker' as ToolType,
      name: 'Grammar Checker',
      description: 'Check grammar, spelling, and style issues',
      icon: CheckCircle,
      color: 'from-green-500 to-emerald-600',
      status: 'active',
    },
    {
      id: 'paraphraser' as ToolType,
      name: 'Paraphraser',
      description: 'Rewrite text with different wording',
      icon: Edit3,
      color: 'from-indigo-500 to-purple-600',
      status: 'active',
    },
    {
      id: 'plagiarism-checker' as ToolType,
      name: 'Plagiarism Checker',
      description: 'Detect potential plagiarism and AI patterns',
      icon: Shield,
      color: 'from-red-500 to-orange-600',
      status: 'active',
    },
    {
      id: 'citation-generator' as ToolType,
      name: 'Citation Generator',
      description: 'Generate citations in multiple formats',
      icon: Quote,
      color: 'from-yellow-500 to-orange-600',
      status: 'active',
    },
    {
      id: 'readability-analyzer' as ToolType,
      name: 'Readability Analyzer',
      description: 'Analyze text readability and complexity',
      icon: BookOpenCheck,
      color: 'from-teal-500 to-cyan-600',
      status: 'active',
    },
    {
      id: 'ai-content-editor' as ToolType,
      name: 'AI Content Editor',
      description: 'Edit content with AI transparency',
      icon: Languages,
      color: 'from-pink-500 to-rose-600',
      status: 'active',
    },
  ];

  // AI Humanizer
  const humanizeText = async () => {
    if (!aiText.trim()) return;
    setIsProcessing(true);
    try {
      const response = await fetch('/api/tools/ai-humanizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: aiText, intensity }),
      });
      const data = await response.json();
      setHumanizedText(data.humanizedText);
      setBypassScore(data.bypassScore);
    } catch (error) {
      console.error('Error humanizing text:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Grammar Checker
  const checkGrammar = async () => {
    if (!grammarText.trim()) return;
    setIsProcessing(true);
    try {
      const response = await fetch('/api/tools/grammar-checker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: grammarText }),
      });
      const data = await response.json();
      setGrammarIssues(data.issues);
      setReadability(data.readability);
    } catch (error) {
      console.error('Error checking grammar:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Paraphraser
  const paraphrase = async () => {
    if (!paraphraseText.trim()) return;
    setIsProcessing(true);
    try {
      const response = await fetch('/api/tools/paraphraser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: paraphraseText, intensity: paraphraseIntensity }),
      });
      const data = await response.json();
      setParaphrasedText(data.paraphrasedText);
      setQualityScore(data.qualityScore);
    } catch (error) {
      console.error('Error paraphrasing:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Plagiarism Checker
  const checkPlagiarism = async () => {
    if (!plagiarismText.trim()) return;
    setIsProcessing(true);
    try {
      const response = await fetch('/api/tools/plagiarism-checker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: plagiarismText }),
      });
      const data = await response.json();
      setPlagiarismResult(data);
    } catch (error) {
      console.error('Error checking plagiarism:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Citation Generator
  const generateCitation = async () => {
    if (!citationSource.title.trim()) return;
    setIsProcessing(true);
    try {
      const response = await fetch('/api/tools/citation-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: citationSource, format: citationFormat }),
      });
      const data = await response.json();
      setGeneratedCitation(data.citation);
    } catch (error) {
      console.error('Error generating citation:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Readability Analyzer
  const analyzeReadability = async () => {
    if (!readabilityText.trim()) return;
    setIsProcessing(true);
    try {
      const response = await fetch('/api/tools/readability-analyzer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: readabilityText }),
      });
      const data = await response.json();
      setReadabilityAnalysis(data);
    } catch (error) {
      console.error('Error analyzing readability:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // AI Content Editor
  const analyzeAIContent = async () => {
    if (!aiEditorText.trim()) return;
    setIsProcessing(true);
    try {
      const response = await fetch('/api/tools/ai-content-editor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: aiEditorText }),
      });
      const data = await response.json();
      setAiEditorResult(data);
    } catch (error) {
      console.error('Error analyzing AI content:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getToolComponent = () => {
    switch (activeTool) {
      case 'ai-humanizer':
        return (
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-8">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">AI Text Humanizer</h2>
                  <p className="text-blue-100">Transform AI-generated content into natural, human-like text</p>
                </div>
              </div>
            </div>
            <div className="p-8">
              <div className="mb-8">
                <label className="block text-sm font-bold text-gray-700 mb-3">Humanization Intensity</label>
                <div className="flex flex-wrap gap-3">
                  {(['light', 'medium', 'strong'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setIntensity(level)}
                      className={`px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                        intensity === level
                          ? `bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg`
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">AI-Generated Text</label>
                  <textarea
                    value={aiText}
                    onChange={(e) => setAiText(e.target.value)}
                    placeholder="Paste your AI-generated text here..."
                    className="w-full h-64 px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 text-gray-700 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">Humanized Output</label>
                  <div className="relative">
                    <textarea
                      value={humanizedText}
                      readOnly
                      placeholder="Humanized text will appear here..."
                      className="w-full h-64 px-4 py-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl text-gray-700 resize-none"
                    />
                    {isProcessing && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                      </div>
                    )}
                    {humanizedText && !isProcessing && (
                      <button
                        onClick={() => copyToClipboard(humanizedText)}
                        className="absolute top-2 right-2 p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
                      >
                        {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-600" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {bypassScore > 0 && (
                <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        bypassScore >= 95 ? 'bg-green-500' : bypassScore >= 85 ? 'bg-blue-500' : 'bg-yellow-500'
                      }`}>
                        <Shield className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-600">AI Detection Bypass Score</div>
                        <div className={`text-3xl font-extrabold ${
                          bypassScore >= 95 ? 'text-green-600' : bypassScore >= 85 ? 'text-blue-600' : 'text-yellow-600'
                        }`}>
                          {bypassScore}%
                        </div>
                      </div>
                    </div>
                    <div className={`px-4 py-2 rounded-lg font-bold ${
                      bypassScore >= 95 ? 'bg-green-100 text-green-800' : bypassScore >= 85 ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {bypassScore >= 95 ? 'Excellent' : bypassScore >= 85 ? 'Very Good' : 'Good'}
                    </div>
                  </div>
                </div>
              )}
              <button
                onClick={humanizeText}
                disabled={!aiText.trim() || isProcessing}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
                  !aiText.trim() || isProcessing
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white hover:shadow-xl hover:scale-[1.02]'
                }`}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center space-x-2">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center space-x-2">
                    <Sparkles className="w-5 h-5" />
                    <span>Humanize Text</span>
                  </span>
                )}
              </button>
            </div>
          </div>
        );

      case 'grammar-checker':
        return (
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-8">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Grammar Checker</h2>
                  <p className="text-green-100">Check grammar, spelling, and style issues</p>
                </div>
              </div>
            </div>
            <div className="p-8">
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-3">Enter text to check</label>
                <textarea
                  value={grammarText}
                  onChange={(e) => setGrammarText(e.target.value)}
                  placeholder="Paste your text here..."
                  className="w-full h-48 px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-400 text-gray-700 resize-none"
                />
              </div>
              <button
                onClick={checkGrammar}
                disabled={!grammarText.trim() || isProcessing}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 mb-8 ${
                  !grammarText.trim() || isProcessing
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-xl'
                }`}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center space-x-2">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Checking...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center space-x-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>Check Grammar</span>
                  </span>
                )}
              </button>
              {grammarIssues.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Issues Found</h3>
                  {grammarIssues.slice(0, 10).map((issue, index) => (
                    <div key={index} className={`p-4 rounded-xl border-l-4 ${
                      issue.type === 'error' ? 'border-red-500 bg-red-50' :
                      issue.type === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                      'border-blue-500 bg-blue-50'
                    }`}>
                      <div className="flex items-start justify-between mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                          issue.type === 'error' ? 'bg-red-500 text-white' :
                          issue.type === 'warning' ? 'bg-yellow-500 text-white' :
                          'bg-blue-500 text-white'
                        }`}>
                          {issue.type}
                        </span>
                        <span className="text-xs text-gray-500">Position: {issue.position}</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">{issue.message}</p>
                      <p className="text-sm text-gray-600">{issue.suggestion}</p>
                    </div>
                  ))}
                </div>
              )}
              {readability && (
                <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Readability Score</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-600">Flesch Reading Ease</div>
                      <div className="text-3xl font-extrabold text-green-600">{readability.score}</div>
                    </div>
                    <div className={`px-4 py-2 rounded-lg font-bold ${
                      readability.score >= 80 ? 'bg-green-100 text-green-800' :
                      readability.score >= 60 ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {readability.level}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'paraphraser':
        return (
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-8">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <Edit3 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Paraphraser</h2>
                  <p className="text-indigo-100">Rewrite text with different wording</p>
                </div>
              </div>
            </div>
            <div className="p-8">
              <div className="mb-8">
                <label className="block text-sm font-bold text-gray-700 mb-3">Paraphrase Intensity</label>
                <div className="flex flex-wrap gap-3">
                  {(['light', 'medium', 'strong'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setParaphraseIntensity(level)}
                      className={`px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                        paraphraseIntensity === level
                          ? `bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg`
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">Original Text</label>
                  <textarea
                    value={paraphraseText}
                    onChange={(e) => setParaphraseText(e.target.value)}
                    placeholder="Paste your text here..."
                    className="w-full h-64 px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 text-gray-700 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">Paraphrased Output</label>
                  <div className="relative">
                    <textarea
                      value={paraphrasedText}
                      readOnly
                      placeholder="Paraphrased text will appear here..."
                      className="w-full h-64 px-4 py-4 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl text-gray-700 resize-none"
                    />
                    {isProcessing && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                      </div>
                    )}
                    {paraphrasedText && !isProcessing && (
                      <button
                        onClick={() => copyToClipboard(paraphrasedText)}
                        className="absolute top-2 right-2 p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
                      >
                        {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-600" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {qualityScore > 0 && (
                <div className="mb-6 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        qualityScore >= 80 ? 'bg-green-500' : qualityScore >= 60 ? 'bg-blue-500' : 'bg-yellow-500'
                      }`}>
                        <CheckCircle className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-600">Quality Score</div>
                        <div className={`text-3xl font-extrabold ${
                          qualityScore >= 80 ? 'text-green-600' : qualityScore >= 60 ? 'text-blue-600' : 'text-yellow-600'
                        }`}>
                          {qualityScore}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <button
                onClick={paraphrase}
                disabled={!paraphraseText.trim() || isProcessing}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
                  !paraphraseText.trim() || isProcessing
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-xl hover:scale-[1.02]'
                }`}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center space-x-2">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Paraphrasing...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center space-x-2">
                    <Edit3 className="w-5 h-5" />
                    <span>Paraphrase Text</span>
                  </span>
                )}
              </button>
            </div>
          </div>
        );

      case 'plagiarism-checker':
        return (
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-orange-600 px-6 py-8">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Plagiarism Checker</h2>
                  <p className="text-red-100">Detect potential plagiarism and AI patterns</p>
                </div>
              </div>
            </div>
            <div className="p-8">
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-3">Enter text to check</label>
                <textarea
                  value={plagiarismText}
                  onChange={(e) => setPlagiarismText(e.target.value)}
                  placeholder="Paste your text here..."
                  className="w-full h-48 px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-400 text-gray-700 resize-none"
                />
              </div>
              <button
                onClick={checkPlagiarism}
                disabled={!plagiarismText.trim() || isProcessing}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 mb-8 ${
                  !plagiarismText.trim() || isProcessing
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-500 to-orange-600 text-white hover:shadow-xl'
                }`}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center space-x-2">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Checking...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center space-x-2">
                    <Shield className="w-5 h-5" />
                    <span>Check Plagiarism</span>
                  </span>
                )}
              </button>
              {plagiarismResult && (
                <div className="space-y-6">
                  <div className={`p-6 rounded-2xl border-2 ${
                    plagiarismResult.risk.color === 'green' ? 'border-green-500 bg-green-50' :
                    plagiarismResult.risk.color === 'yellow' ? 'border-yellow-500 bg-yellow-50' :
                    plagiarismResult.risk.color === 'orange' ? 'border-orange-500 bg-orange-50' :
                    'border-red-500 bg-red-50'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-sm text-gray-600">Plagiarism Score</div>
                        <div className={`text-4xl font-extrabold ${
                          plagiarismResult.risk.color === 'green' ? 'text-green-600' :
                          plagiarismResult.risk.color === 'yellow' ? 'text-yellow-600' :
                          plagiarismResult.risk.color === 'orange' ? 'text-orange-600' :
                          'text-red-600'
                        }`}>
                          {plagiarismResult.score}%
                        </div>
                      </div>
                      <div className={`px-4 py-2 rounded-lg font-bold ${
                        plagiarismResult.risk.color === 'green' ? 'bg-green-100 text-green-800' :
                        plagiarismResult.risk.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                        plagiarismResult.risk.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {plagiarismResult.risk.level}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">{plagiarismResult.risk.description}</p>
                  </div>
                  {plagiarismResult.details && (
                    <div className="space-y-4">
                      {plagiarismResult.details.repeatedPhrases?.length > 0 && (
                        <div>
                          <h3 className="text-lg font-bold text-gray-800 mb-3">Repeated Phrases</h3>
                          {plagiarismResult.details.repeatedPhrases.slice(0, 5).map((item: any, index: number) => (
                            <div key={index} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                              <p className="text-sm font-semibold text-gray-700">{item.phrase}</p>
                              <p className="text-xs text-gray-500">Count: {item.count}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {plagiarismResult.details.aiPatterns?.length > 0 && (
                        <div>
                          <h3 className="text-lg font-bold text-gray-800 mb-3">AI Patterns Detected</h3>
                          {plagiarismResult.details.aiPatterns.slice(0, 5).map((item: any, index: number) => (
                            <div key={index} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                              <p className="text-sm font-semibold text-gray-700">{item.pattern}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case 'citation-generator':
        return (
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-500 to-orange-600 px-6 py-8">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <Quote className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Citation Generator</h2>
                  <p className="text-yellow-100">Generate citations in multiple formats</p>
                </div>
              </div>
            </div>
            <div className="p-8">
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-3">Citation Format</label>
                <div className="flex flex-wrap gap-3 mb-6">
                  {(['apa', 'mla', 'chicago', 'harvard', 'vancouver'] as const).map((format) => (
                    <button
                      key={format}
                      onClick={() => setCitationFormat(format)}
                      className={`px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                        citationFormat === format
                          ? `bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-lg`
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {format.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Source Type</label>
                  <select
                    value={citationSource.type}
                    onChange={(e) => setCitationSource({ ...citationSource, type: e.target.value as any })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-400"
                  >
                    <option value="book">Book</option>
                    <option value="journal">Journal Article</option>
                    <option value="website">Website</option>
                    <option value="newspaper">Newspaper</option>
                    <option value="magazine">Magazine</option>
                    <option value="conference">Conference</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={citationSource.title}
                    onChange={(e) => setCitationSource({ ...citationSource, title: e.target.value })}
                    placeholder="Enter title..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Author First Name</label>
                  <input
                    type="text"
                    value={citationSource.authors[0]?.first || ''}
                    onChange={(e) => setCitationSource({ ...citationSource, authors: [{ ...citationSource.authors[0], first: e.target.value }] })}
                    placeholder="Enter first name..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Author Last Name</label>
                  <input
                    type="text"
                    value={citationSource.authors[0]?.last || ''}
                    onChange={(e) => setCitationSource({ ...citationSource, authors: [{ ...citationSource.authors[0], last: e.target.value }] })}
                    placeholder="Enter last name..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Year</label>
                  <input
                    type="text"
                    value={citationSource.year}
                    onChange={(e) => setCitationSource({ ...citationSource, year: e.target.value })}
                    placeholder="2024"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Publisher</label>
                  <input
                    type="text"
                    value={citationSource.publisher}
                    onChange={(e) => setCitationSource({ ...citationSource, publisher: e.target.value })}
                    placeholder="Enter publisher..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-400"
                  />
                </div>
              </div>
              <button
                onClick={generateCitation}
                disabled={!citationSource.title.trim() || isProcessing}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 mb-8 ${
                  !citationSource.title.trim() || isProcessing
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white hover:shadow-xl'
                }`}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center space-x-2">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Generating...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center space-x-2">
                    <Quote className="w-5 h-5" />
                    <span>Generate Citation</span>
                  </span>
                )}
              </button>
              {generatedCitation && (
                <div className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl border border-yellow-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-3">{citationFormat.toUpperCase()} Citation</h3>
                  <div className="relative">
                    <p className="text-gray-700 bg-white p-4 rounded-lg border border-gray-200" dangerouslySetInnerHTML={{ __html: generatedCitation }} />
                    <button
                      onClick={() => copyToClipboard(generatedCitation.replace(/<[^>]*>/g, ''))}
                      className="absolute top-2 right-2 p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-600" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'readability-analyzer':
        return (
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-teal-500 to-cyan-600 px-6 py-8">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <BookOpenCheck className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Readability Analyzer</h2>
                  <p className="text-teal-100">Analyze text readability and complexity</p>
                </div>
              </div>
            </div>
            <div className="p-8">
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-3">Enter text to analyze</label>
                <textarea
                  value={readabilityText}
                  onChange={(e) => setReadabilityText(e.target.value)}
                  placeholder="Paste your text here..."
                  className="w-full h-48 px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-400 text-gray-700 resize-none"
                />
              </div>
              <button
                onClick={analyzeReadability}
                disabled={!readabilityText.trim() || isProcessing}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 mb-8 ${
                  !readabilityText.trim() || isProcessing
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white hover:shadow-xl'
                }`}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center space-x-2">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Analyzing...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center space-x-2">
                    <BookOpenCheck className="w-5 h-5" />
                    <span>Analyze Readability</span>
                  </span>
                )}
              </button>
              {readabilityAnalysis && (
                <div className="space-y-6">
                  <div className={`p-6 rounded-2xl border-2 ${
                    readabilityAnalysis.overall.level.color === 'green' ? 'border-green-500 bg-green-50' :
                    readabilityAnalysis.overall.level.color === 'blue' ? 'border-blue-500 bg-blue-50' :
                    readabilityAnalysis.overall.level.color === 'yellow' ? 'border-yellow-500 bg-yellow-50' :
                    'border-red-500 bg-red-50'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-sm text-gray-600">Overall Score</div>
                        <div className={`text-4xl font-extrabold ${
                          readabilityAnalysis.overall.level.color === 'green' ? 'text-green-600' :
                          readabilityAnalysis.overall.level.color === 'blue' ? 'text-blue-600' :
                          readabilityAnalysis.overall.level.color === 'yellow' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {readabilityAnalysis.overall.score}
                        </div>
                      </div>
                      <div className={`px-4 py-2 rounded-lg font-bold ${
                        readabilityAnalysis.overall.level.color === 'green' ? 'bg-green-100 text-green-800' :
                        readabilityAnalysis.overall.level.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                        readabilityAnalysis.overall.level.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {readabilityAnalysis.overall.level.level}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">{readabilityAnalysis.overall.level.description}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-white rounded-xl border border-gray-200">
                      <h4 className="text-sm font-bold text-gray-700 mb-2">Flesch Reading Ease</h4>
                      <div className="text-2xl font-bold text-gray-800">{readabilityAnalysis.metrics.fleschReadingEase.score}</div>
                      <div className="text-xs text-gray-500">{readabilityAnalysis.metrics.fleschReadingEase.level.level}</div>
                    </div>
                    <div className="p-4 bg-white rounded-xl border border-gray-200">
                      <h4 className="text-sm font-bold text-gray-700 mb-2">Flesch-Kincaid Grade</h4>
                      <div className="text-2xl font-bold text-gray-800">{readabilityAnalysis.metrics.fleschKincaidGrade.score}</div>
                      <div className="text-xs text-gray-500">{readabilityAnalysis.metrics.fleschKincaidGrade.level.level}</div>
                    </div>
                    <div className="p-4 bg-white rounded-xl border border-gray-200">
                      <h4 className="text-sm font-bold text-gray-700 mb-2">Gunning Fog Index</h4>
                      <div className="text-2xl font-bold text-gray-800">{readabilityAnalysis.metrics.gunningFogIndex.score}</div>
                      <div className="text-xs text-gray-500">{readabilityAnalysis.metrics.gunningFogIndex.level.level}</div>
                    </div>
                    <div className="p-4 bg-white rounded-xl border border-gray-200">
                      <h4 className="text-sm font-bold text-gray-700 mb-2">Word Count</h4>
                      <div className="text-2xl font-bold text-gray-800">{readabilityAnalysis.statistics.wordCount}</div>
                    </div>
                  </div>
                  {readabilityAnalysis.suggestions && readabilityAnalysis.suggestions.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 mb-3">Suggestions</h3>
                      {readabilityAnalysis.suggestions.map((suggestion: any, index: number) => (
                        <div key={index} className={`p-3 rounded-lg border-l-4 ${
                          suggestion.type === 'improvement' ? 'border-blue-500 bg-blue-50' :
                          'border-yellow-500 bg-yellow-50'
                        }`}>
                          <p className="text-sm text-gray-700">{suggestion.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case 'ai-content-editor':
        return (
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-pink-500 to-rose-600 px-6 py-8">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <Languages className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">AI Content Editor</h2>
                  <p className="text-pink-100">Edit content with AI transparency</p>
                </div>
              </div>
            </div>
            <div className="p-8">
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-3">Enter content to analyze</label>
                <textarea
                  value={aiEditorText}
                  onChange={(e) => setAiEditorText(e.target.value)}
                  placeholder="Paste your content here..."
                  className="w-full h-48 px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-400 text-gray-700 resize-none"
                />
              </div>
              <button
                onClick={analyzeAIContent}
                disabled={!aiEditorText.trim() || isProcessing}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 mb-8 ${
                  !aiEditorText.trim() || isProcessing
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-pink-500 to-rose-600 text-white hover:shadow-xl'
                }`}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center space-x-2">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Analyzing...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center space-x-2">
                    <Languages className="w-5 h-5" />
                    <span>Analyze Content</span>
                  </span>
                )}
              </button>
              {aiEditorResult && (
                <div className="space-y-6">
                  <div className={`p-6 rounded-2xl border-2 ${
                    aiEditorResult.transparencyLevel === 'low' ? 'border-green-500 bg-green-50' :
                    aiEditorResult.transparencyLevel === 'moderate' ? 'border-blue-500 bg-blue-50' :
                    aiEditorResult.transparencyLevel === 'high' ? 'border-yellow-500 bg-yellow-50' :
                    'border-red-500 bg-red-50'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-sm text-gray-600">AI Content Score</div>
                        <div className={`text-4xl font-extrabold ${
                          aiEditorResult.transparencyLevel === 'low' ? 'text-green-600' :
                          aiEditorResult.transparencyLevel === 'moderate' ? 'text-blue-600' :
                          aiEditorResult.transparencyLevel === 'high' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {aiEditorResult.aiScore}%
                        </div>
                      </div>
                      <div className={`px-4 py-2 rounded-lg font-bold ${
                        aiEditorResult.transparencyLevel === 'low' ? 'bg-green-100 text-green-800' :
                        aiEditorResult.transparencyLevel === 'moderate' ? 'bg-blue-100 text-blue-800' :
                        aiEditorResult.transparencyLevel === 'high' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {aiEditorResult.transparencyLevel.replace('-', ' ').toUpperCase()}
                      </div>
                    </div>
                  </div>
                  {aiEditorResult.transparencyElements && (
                    <div className="space-y-4">
                      {aiEditorResult.transparencyElements.disclaimer && (
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <h4 className="text-sm font-bold text-gray-700 mb-2">Transparency Disclaimer</h4>
                          <p className="text-sm text-gray-700">{aiEditorResult.transparencyElements.disclaimer}</p>
                        </div>
                      )}
                      {aiEditorResult.transparencyElements.attribution && (
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <h4 className="text-sm font-bold text-gray-700 mb-2">Attribution Text</h4>
                          <p className="text-sm text-gray-700">{aiEditorResult.transparencyElements.attribution}</p>
                        </div>
                      )}
                    </div>
                  )}
                  {aiEditorResult.suggestions && aiEditorResult.suggestions.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 mb-3">Suggestions</h3>
                      {aiEditorResult.suggestions.map((suggestion: any, index: number) => (
                        <div key={index} className={`p-3 rounded-lg border-l-4 ${
                          suggestion.type === 'transparency' ? 'border-blue-500 bg-blue-50' :
                          suggestion.type === 'improvement' ? 'border-green-500 bg-green-50' :
                          'border-yellow-500 bg-yellow-50'
                        }`}>
                          <p className="text-sm text-gray-700">{suggestion.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {aiEditorResult.guidelines && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 mb-3">Transparency Guidelines</h3>
                      <div className="space-y-2">
                        <div className="flex items-start space-x-2 p-3 bg-gray-50 rounded-lg">
                          <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          <p className="text-sm text-gray-700">{aiEditorResult.guidelines.disclose}</p>
                        </div>
                        <div className="flex items-start space-x-2 p-3 bg-gray-50 rounded-lg">
                          <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          <p className="text-sm text-gray-700">{aiEditorResult.guidelines.verify}</p>
                        </div>
                        <div className="flex items-start space-x-2 p-3 bg-gray-50 rounded-lg">
                          <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          <p className="text-sm text-gray-700">{aiEditorResult.guidelines.personalize}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Ccircle cx=%222%22 cy=%222%22 r=%221%22 fill=%22rgba(255,255,255,0.1)%22/%3E%3C/svg%3E')] opacity-30"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-6 animate-pulse">
              <Wrench className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 animate-slide-in-down">
              AI Tools Suite
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Powerful tools to enhance your academic writing and research
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-50 to-transparent"></div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!activeTool ? (
          <>
            {/* Tools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {tools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id)}
                  className="relative group"
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-gray-300 to-gray-400 rounded-2xl blur opacity-30 group-hover:opacity-60 transition-opacity duration-300"></div>
                  <div className="relative bg-white rounded-2xl p-6 h-full border-2 border-transparent group-hover:border-gray-300 transition-all duration-300">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${tool.color} rounded-xl flex items-center justify-center`}>
                        <tool.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{tool.name}</h3>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm">{tool.description}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Info Box */}
            <div className="mt-12 p-6 bg-blue-50 border-2 border-blue-200 rounded-2xl">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <strong className="font-semibold">AI Transparency:</strong> All tools are designed to help you create better content while being transparent about AI assistance. Use these tools responsibly to enhance your writing while maintaining academic integrity.
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Back Button */}
            <button
              onClick={() => setActiveTool(null)}
              className="mb-6 flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <X className="w-5 h-5" />
              <span className="font-medium">Back to Tools</span>
            </button>

            {/* Tool Component */}
            {getToolComponent()}
          </>
        )}
      </div>
    </div>
  );
}
