'use client';

import { useEffect, useState } from 'react';
import type { Issue, IssuePaper, TypeFieldsData } from '../types';

interface PublicationFieldsProps {
  onChange: (data: TypeFieldsData) => void;
}

export default function PublicationFields({ onChange }: PublicationFieldsProps) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [issuePapers, setIssuePapers] = useState<IssuePaper[]>([]);
  const [selectedIssueId, setSelectedIssueId] = useState('');
  const [selectedPaperId, setSelectedPaperId] = useState('');
  const [loadingIssues, setLoadingIssues] = useState(true);
  const [loadingPapers, setLoadingPapers] = useState(false);

  useEffect(() => {
    fetch('/api/issues?limit=100')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setIssues(data.issues || []);
      })
      .finally(() => setLoadingIssues(false));
  }, []);

  const handleIssueSelect = async (issueId: string) => {
    setSelectedIssueId(issueId);
    setSelectedPaperId('');
    setIssuePapers([]);
    onChange({});

    if (!issueId) return;

    setLoadingPapers(true);
    try {
      // Use admin papers API to get uniqueNumber, volumeNumber, issueNumber
      const res = await fetch(`/api/admin/papers?issueId=${issueId}&status=PUBLISHED&limit=100`);
      if (res.ok) {
        const data = await res.json();
        setIssuePapers(data.papers || []);
      }
    } finally {
      setLoadingPapers(false);
    }
  };

  const handlePaperSelect = (paperId: string) => {
    setSelectedPaperId(paperId);
    const paper = issuePapers.find(p => p.id === paperId);
    if (paper) {
      onChange({
        paperId: paper.id,
        paperTitle: paper.title,
        paperNumber: paper.uniqueNumber || '',
      });
    } else {
      onChange({});
    }
  };

  const selectedIssue = issues.find(i => i.id === selectedIssueId);
  const selectedPaper = issuePapers.find(p => p.id === selectedPaperId);

  if (loadingIssues) {
    return <div className="py-4 text-sm text-gray-500">Loading issues...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Step 1: Issue select */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Issue <span className="text-red-500">*</span>
        </label>
        <select
          value={selectedIssueId}
          onChange={(e) => handleIssueSelect(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Choose an issue...</option>
          {issues.map((issue) => (
            <option key={issue.id} value={issue.id}>
              Volume {issue.volume} / Issue {issue.issue} — {issue.year} ({issue.paperCount} papers)
            </option>
          ))}
        </select>

        {/* Issue info box */}
        {selectedIssue && (
          <div className="mt-2 border border-gray-200 rounded-md bg-gray-50 p-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-600">
            <span><span className="font-medium">Volume:</span> {selectedIssue.volume}</span>
            <span><span className="font-medium">Issue:</span> {selectedIssue.issue}</span>
            <span><span className="font-medium">Year:</span> {selectedIssue.year}</span>
            <span><span className="font-medium">Papers:</span> {selectedIssue.paperCount}</span>
          </div>
        )}
      </div>

      {/* Step 2: Paper select — shown after issue selected */}
      {selectedIssueId && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Paper <span className="text-red-500">*</span>
          </label>

          {loadingPapers ? (
            <div className="py-3 text-sm text-gray-500">Loading papers...</div>
          ) : issuePapers.length === 0 ? (
            <div className="py-3 text-sm text-gray-500">No published papers found in this issue.</div>
          ) : (
            <>
              <select
                value={selectedPaperId}
                onChange={(e) => handlePaperSelect(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Choose a paper...</option>
                {issuePapers.map((paper) => (
                  <option key={paper.id} value={paper.id}>
                    {paper.uniqueNumber ? `[${paper.uniqueNumber}] ` : ''}{paper.title}
                  </option>
                ))}
              </select>

              {/* Paper info box */}
              {selectedPaper && (
                <div className="mt-3 border border-gray-200 rounded-md bg-gray-50 p-3 space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Paper Title</p>
                    <p className="text-sm text-gray-800 font-medium leading-snug">{selectedPaper.title}</p>
                  </div>
                  {selectedPaper.uniqueNumber && (
                    <div>
                      <p className="text-xs text-gray-500">Paper Number</p>
                      <p className="text-sm font-mono text-gray-700">{selectedPaper.uniqueNumber}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    {selectedPaper.volumeNumber && (
                      <div>
                        <p className="text-xs text-gray-500">Volume</p>
                        <p className="text-sm text-gray-700">{selectedPaper.volumeNumber}</p>
                      </div>
                    )}
                    {selectedPaper.issueNumber && (
                      <div>
                        <p className="text-xs text-gray-500">Issue</p>
                        <p className="text-sm text-gray-700">{selectedPaper.issueNumber}</p>
                      </div>
                    )}
                  </div>
                  {selectedPaper.publishedAt && (
                    <div>
                      <p className="text-xs text-gray-500">Published</p>
                      <p className="text-sm text-gray-700">
                        {new Date(selectedPaper.publishedAt).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  )}
                  {selectedPaper.paperAuthors && selectedPaper.paperAuthors.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500">Authors</p>
                      <p className="text-sm text-gray-700">
                        {selectedPaper.paperAuthors.map(a => `${a.user.firstName} ${a.user.lastName}`).join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
