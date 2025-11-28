import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Loader2, ShieldBan } from 'lucide-react';

const UploadStatus = ({ status, noteId, aiSummary }) => {
  const [currentStatus, setCurrentStatus] = useState(status);

  // Simple polling to check status updates if it's still pending
  useEffect(() => {
    if (currentStatus === 'pending') {
      const interval = setInterval(async () => {
        try {
          // You'll need a simple endpoint to get just the status, 
          // or re-fetch the note details.
          const res = await fetch(`/api/notes/${noteId}`);
          const data = await res.json();
          if (data.moderationStatus !== 'pending') {
            setCurrentStatus(data.moderationStatus);
            clearInterval(interval);
          }
        } catch (e) {
          console.error("Status check failed", e);
        }
      }, 3000); // Check every 3 seconds
      return () => clearInterval(interval);
    }
  }, [currentStatus, noteId]);

  const getStatusUI = () => {
    switch (currentStatus) {
      case 'pending':
        return (
          <div className="flex items-center space-x-2 text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>AI Scanning...</span>
          </div>
        );
      case 'safe':
        return (
          <div className="flex items-center space-x-2 text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm">
            <CheckCircle className="w-4 h-4" />
            <span>AI Verified: Safe</span>
          </div>
        );
      case 'review':
        return (
          <div className="flex items-center space-x-2 text-orange-600 bg-orange-50 px-3 py-1 rounded-full text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>Under Review</span>
          </div>
        );
      case 'blocked':
        return (
          <div className="flex items-center space-x-2 text-red-600 bg-red-50 px-3 py-1 rounded-full text-sm">
            <ShieldBan className="w-4 h-4" />
            <span>Content Blocked</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      {getStatusUI()}
      {/* Show AI Summary if available and safe */}
      {currentStatus === 'safe' && aiSummary && (
        <div className="text-xs text-gray-500 italic mt-1 bg-gray-50 p-2 rounded border border-gray-100">
          🤖 AI Summary: {aiSummary}
        </div>
      )}
    </div>
  );
};

export default UploadStatus;