import React, { useState, useContext } from 'react';
import api, { getAISuggestions } from '../utils/api'; // Import helper for file upload
import { AuthContext } from '../context/AuthContext';
import { Button, Input } from '../components/ui/primitives';
import { Loader2, ShieldCheck, Search, FileText, Sparkles, UploadCloud } from 'lucide-react';

const TestAI = () => {
  const { authToken } = useContext(AuthContext); 
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  
  // Inputs
  const [inputText, setInputText] = useState("React is a library for building user interfaces.");
  const [testFile, setTestFile] = useState(null);

  const addLog = (msg, type = 'info') => {
    setLogs(prev => [{ msg, type, time: new Date().toLocaleTimeString() }, ...prev]);
  };

  // --- TEST 1: MODERATION ---
  const testModeration = async () => {
    if (!authToken) return addLog("⛔ Error: Not Logged In", "error");
    
    setLoading(true);
    addLog(`🛡️ Testing Moderation for: "${inputText.substring(0, 30)}..."`, "info");
    
    try {
      const res = await api.get('/api/ai/moderate', { params: { text: inputText } });
      
      if (res.data.isSafe) {
        addLog(`✅ Moderation Passed: Content is Safe.`, "success");
      } else {
        addLog(`⚠️ Moderation Flagged: ${res.data.reason || "Unsafe content detected"}`, "warning");
      }
      addLog(`📄 Raw JSON: ${JSON.stringify(res.data)}`, "info");
    } catch (err) {
      addLog(`❌ Moderation API Error: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // --- TEST 2: SEMANTIC SEARCH ---
 // --- TEST 2: SEMANTIC SEARCH ---
  const testSemanticSearch = async () => {
    if (!authToken) return addLog("⛔ Error: Not Logged In", "error");

    setLoading(true);
    addLog(`🧠 Testing Vector Search for: "${inputText}"`, "info");
    
    try {
      const res = await api.get('/api/notes', {
        params: { q: inputText, type: 'semantic' }
      });
      
      const count = res.data.length;
      
      if (count > 0) {
        addLog(`✅ Found ${count} semantic matches.`, "success");
        
        // Loop through the Top 3 (or fewer if less found)
        res.data.slice(0, 3).forEach((item, index) => {
            const score = item.searchScore ? (item.searchScore * 100).toFixed(1) + '%' : 'N/A';
            const icon = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
            
            addLog(
                `${icon} #${index + 1}: "${item.title}" (Match: ${score})`, 
                "success"
            );
        });

      } else {
        addLog(`⚠️ No semantic matches found.`, "warning");
      }
    } catch (err) {
      addLog(`❌ Search API Error: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // --- TEST 3: METADATA AUTO-FILL ---
  const testMetadata = async () => {
    if (!testFile) return addLog("⛔ Error: Please select a file first.", "error");
    if (!authToken) return addLog("⛔ Error: Not Logged In", "error");

    setLoading(true);
    addLog(`✨ Analyzing file: ${testFile.name} (${(testFile.size / 1024).toFixed(2)} KB)...`, "info");

    try {
      // Use the utility function from api.js
      const data = await getAISuggestions(testFile);
      
      addLog("✅ AI Analysis Complete!", "success");
      addLog(`📝 Suggested Title: ${data.title}`, "success");
      addLog(`🏷️ Tags: ${data.tags?.join(", ")}`, "info");
      addLog(`📚 Subject: ${data.subject || "N/A"}`, "info");
      addLog(`📄 Description: ${data.description?.substring(0, 50)}...`, "info");
      
    } catch (err) {
      console.error(err);
      addLog(`❌ Metadata API Error: ${err.response?.data?.message || err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-10 max-w-5xl mx-auto bg-gray-50 dark:bg-slate-950 min-h-screen font-sans">
      <h1 className="text-3xl font-bold mb-2 dark:text-white flex items-center gap-3">
        <Sparkles className="text-indigo-500" /> AI Diagnostics Panel
      </h1>
      <p className="text-gray-500 dark:text-slate-400 mb-8">
        Use this dashboard to verify that Gemini, TensorFlow, and MongoDB Vector Search are connected correctly.
      </p>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT COLUMN: CONTROLS */}
        <div className="space-y-6">
            
            {/* Text Tests Card */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-500" /> Text Analysis (Moderation & Search)
                </h3>
                <label className="block text-xs font-medium uppercase text-gray-500 dark:text-slate-500 mb-2">Test Input String</label>
                <Input 
                    value={inputText} 
                    onChange={(e) => setInputText(e.target.value)} 
                    className="mb-4"
                    placeholder="Enter text to search or moderate..."
                />
                
                <div className="grid grid-cols-2 gap-3">
                    <Button onClick={testModeration} disabled={loading} variant="outline" className="justify-center border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400">
                        {loading ? <Loader2 className="animate-spin w-4 h-4"/> : <ShieldCheck className="w-4 h-4 mr-2"/>} Check Safety
                    </Button>
                    <Button onClick={testSemanticSearch} disabled={loading} className="justify-center bg-blue-600 hover:bg-blue-700 text-white">
                        {loading ? <Loader2 className="animate-spin w-4 h-4"/> : <Search className="w-4 h-4 mr-2"/>} Vector Search
                    </Button>
                </div>
            </div>

            {/* File Tests Card */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <UploadCloud className="w-5 h-5 text-purple-500" /> File Analysis (Metadata & Summary)
                </h3>
                
                <div className="mb-4">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-lg cursor-pointer bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-750 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <UploadCloud className="w-8 h-8 mb-2 text-gray-400" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {testFile ? testFile.name : "Click to upload PDF/Docx"}
                            </p>
                        </div>
                        <input 
                            type="file" 
                            className="hidden" 
                            onChange={(e) => setTestFile(e.target.files[0])} 
                            accept=".pdf,.docx,.txt"
                        />
                    </label>
                </div>

                <Button onClick={testMetadata} disabled={loading || !testFile} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                    {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2"/> : <Sparkles className="w-4 h-4 mr-2"/>} 
                    Generate AI Metadata
                </Button>
            </div>

        </div>

        {/* RIGHT COLUMN: LOGS */}
        <div className="bg-black text-green-400 p-6 rounded-xl font-mono text-sm h-[600px] overflow-y-auto shadow-inner border border-gray-800">
            <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-2">
                <span className="font-bold">System Terminal</span>
                <button onClick={() => setLogs([])} className="text-xs text-gray-500 hover:text-white">Clear</button>
            </div>
            
            {logs.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center opacity-30">
                    <Sparkles className="w-12 h-12 mb-4" />
                    <p>Ready to run diagnostics...</p>
                </div>
            )}

            {logs.map((log, i) => (
                <div key={i} className="mb-3 animate-in fade-in slide-in-from-left-2 duration-300">
                    <span className="opacity-40 mr-2">[{log.time}]</span>
                    <span className={
                        log.type === 'error' ? 'text-red-400 font-bold' : 
                        log.type === 'success' ? 'text-green-400 font-bold' : 
                        log.type === 'warning' ? 'text-yellow-400' : 
                        'text-blue-300'
                    }>
                        {log.msg}
                    </span>
                </div>
            ))}
        </div>

      </div>
    </div>
  );
};

export default TestAI;