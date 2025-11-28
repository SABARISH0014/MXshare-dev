import React, { useState, useContext } from 'react';
import api from '../utils/api'; // <--- CHANGE THIS (was import axios from 'axios')
import { AuthContext } from '../context/AuthContext';
import { Button, Input } from '../components/ui/primitives';
import { Loader2 } from 'lucide-react';

const TestAI = () => {
  const { authToken } = useContext(AuthContext); 
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [inputText, setInputText] = useState("React is a library for building user interfaces.");

  const addLog = (msg, type = 'info') => {
    setLogs(prev => [...prev, { msg, type, time: new Date().toLocaleTimeString() }]);
  };

  const testModeration = async () => {
    // 1. Check Login Status
    if (!authToken) {
        addLog("⛔ Error: You are NOT logged in. Token is missing.", "error");
        return;
    }

    setLoading(true);
    addLog("Testing Moderation...", "info");
    try {
      // 2. Use 'api' instead of 'axios'
      const res = await api.get('/api/ai/moderate', { 
        params: { text: inputText }
        // No headers needed here, 'api' handles it automatically
      });
      addLog(`✅ Moderation Result: ${JSON.stringify(res.data)}`, "success");
    } catch (err) {
      console.error(err);
      addLog(`❌ Moderation Failed: ${err.response?.data?.message || err.message}`, "error");
    }
    setLoading(false);
  };

  const testSemanticSearch = async () => {
    if (!authToken) {
        addLog("⛔ Error: You are NOT logged in.", "error");
        return;
    }

    setLoading(true);
    addLog("Testing Semantic Search...", "info");
    try {
      // 2. Use 'api' instead of 'axios'
      const res = await api.get('/api/notes', {
        params: { q: inputText, type: 'semantic' }
      });
      addLog(`✅ Found ${res.data.length} results via Vectors`, "success");
    } catch (err) {
      addLog(`❌ Search Failed: ${err.response?.data?.message || err.message}`, "error");
    }
    setLoading(false);
  };

  return (
    <div className="p-10 max-w-4xl mx-auto bg-gray-50 dark:bg-slate-950 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 dark:text-white">AI Module Diagnostics</h1>
      
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 mb-6">
        <label className="block text-sm font-medium mb-2 dark:text-gray-300">Test Input Text</label>
        <Input 
          value={inputText} 
          onChange={(e) => setInputText(e.target.value)} 
          className="mb-4"
        />
        
        <div className="flex gap-4">
          <Button onClick={testModeration} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : "Test Moderation API"}
          </Button>
          <Button onClick={testSemanticSearch} disabled={loading} variant="secondary">
            {loading ? <Loader2 className="animate-spin" /> : "Test Semantic Search"}
          </Button>
        </div>
      </div>

      <div className="bg-black text-green-400 p-4 rounded-xl font-mono text-sm h-96 overflow-y-auto">
        {logs.length === 0 && <span className="opacity-50">// System logs will appear here...</span>}
        {logs.map((log, i) => (
          <div key={i} className="mb-1">
            <span className="opacity-50">[{log.time}]</span>{' '}
            <span className={log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-green-400' : 'text-blue-300'}>
              {log.msg}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestAI;