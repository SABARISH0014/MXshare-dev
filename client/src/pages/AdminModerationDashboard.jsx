import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Check, X, Eye, AlertOctagon } from 'lucide-react';
import api from '../utils/api'; // Your axios instance

const AdminModerationDashboard = () => {
  const { user } = useAuth();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch items needing review
  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    try {
      // Create this endpoint in backend: 
      // router.get('/admin/queue', auth, adminOnly, getModerationQueue);
      const res = await api.get('/admin/queue'); 
      setQueue(res.data);
    } catch (err) {
      console.error("Failed to load queue", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (noteId, decision, comments = "") => {
    try {
      await api.post(`/admin/review/${noteId}`, {
        decision: decision, // 'approve' or 'block'
        adminComment: comments
      });
      // Remove from UI
      setQueue(queue.filter(item => item._id !== noteId));
    } catch (err) {
      alert("Action failed: " + err.message);
    }
  };

  if (!user || user.role !== 'admin') {
    return <div className="p-10 text-center text-red-500">Access Denied: Admins Only</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 flex items-center">
        <ShieldBan className="mr-2" /> AI Moderation Queue
      </h1>

      {loading ? (
        <p>Loading flagged content...</p>
      ) : queue.length === 0 ? (
        <div className="p-10 text-center bg-green-50 rounded-lg text-green-700">
          🎉 All clear! No content pending review.
        </div>
      ) : (
        <div className="grid gap-6">
          {queue.map((item) => (
            <div key={item._id} className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col md:flex-row overflow-hidden">
              
              {/* LEFT: Content Preview */}
              <div className="w-full md:w-1/3 bg-gray-100 p-4 flex flex-col items-center justify-center border-r border-gray-200">
                {item.thumbnailUrl ? (
                  <img src={item.thumbnailUrl} alt="Preview" className="h-40 object-cover rounded mb-3" />
                ) : (
                  <div className="h-40 w-full bg-gray-200 flex items-center justify-center rounded mb-3">No Preview</div>
                )}
                <h3 className="font-bold text-center">{item.title}</h3>
                <a href={item.websiteUrl} target="_blank" rel="noreferrer" className="text-blue-600 text-sm mt-2 hover:underline flex items-center">
                  <Eye className="w-3 h-3 mr-1" /> View Original File
                </a>
              </div>

              {/* MIDDLE: AI Analysis Report */}
              <div className="w-full md:w-1/3 p-4 border-r border-gray-200">
                <h4 className="font-semibold text-gray-700 mb-2">🤖 AI Detection Report</h4>
                
                {/* Overall Score Badge */}
                <div className={`inline-block px-2 py-1 rounded text-xs font-bold mb-3 ${
                  item.moderationStatus === 'blocked' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  Status: {item.moderationStatus.toUpperCase()}
                </div>

                {/* The 9 Categories */}
                <div className="space-y-1 text-xs">
                  {/* We assume you populated 'moderationLog' in the fetch */}
                  {item.moderationLog && Object.entries(item.moderationLog.categories).map(([key, data]) => (
                    <div key={key} className="flex justify-between items-center">
                      <span className="capitalize text-gray-600">{key.replace('_', ' ')}:</span>
                      <span className={`font-mono ${data.score > 60 ? 'text-red-600 font-bold' : 'text-gray-400'}`}>
                        {data.score}/100
                      </span>
                    </div>
                  ))}
                </div>
                
                {item.aiSummary && (
                  <div className="mt-4 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    <strong>Summary:</strong> {item.aiSummary}
                  </div>
                )}
              </div>

              {/* RIGHT: Admin Actions */}
              <div className="w-full md:w-1/3 p-4 flex flex-col justify-center space-y-3 bg-gray-50">
                <h4 className="font-semibold text-gray-700 text-center mb-2">Admin Decision</h4>
                
                <button 
                  onClick={() => handleDecision(item._id, 'approve')}
                  className="flex items-center justify-center w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                >
                  <Check className="w-4 h-4 mr-2" /> Override: Mark as Safe
                </button>

                <button 
                  onClick={() => handleDecision(item._id, 'block')}
                  className="flex items-center justify-center w-full py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                >
                  <X className="w-4 h-4 mr-2" /> Confirm Block
                </button>

                <p className="text-xs text-center text-gray-400 mt-2">
                  This action logs your ID ({user.name})
                </p>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminModerationDashboard;