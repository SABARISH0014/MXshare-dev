import React, { useState, useContext } from 'react';
import { Lightbulb, Loader2, Zap, Clipboard } from 'lucide-react';
import { Button } from './ui/primitives';
import { ToastContext } from '../context/ToastContext';
import { fetchMiniMaxContent } from '../utils/api';

const NoteTitleSuggestor = () => {
    const [description, setDescription] = useState('');
    const [titles, setTitles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { addToast } = useContext(ToastContext);

    const generateTitles = async () => {
        if (description.trim().length < 10) {
            setError('Please enter a description of at least 10 characters.');
            return;
        }
        setLoading(true);
        setError('');
        setTitles([]);
        const userQuery = `Generate 5 alternative, creative, formal, and clear titles for an academic note based on this content description: "${description}".`;
        const systemPrompt = "You are an expert academic editor and title generator for a student notes platform. Output ONLY a comma-separated list of 5 titles. Do not include introductory phrases, numbering, or quotation marks.";
        try {
            const response = await fetchMiniMaxContent(userQuery, systemPrompt, null);
            const generatedTitles = response.text.split(',').map(t => t.trim()).filter(t => t.length > 0).slice(0, 5);
            if (generatedTitles.length > 0) {
                setTitles(generatedTitles);
                addToast('Titles generated successfully!', 'success');
            } else {
                 setError('AI could not generate suitable titles.');
            }
        } catch (err) {
            setError(`Error calling MiniMax M2 API: ${err.message}`);
            addToast('Title generation failed.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text) => {
        try {
            const tempInput = document.createElement('textarea');
            tempInput.value = text;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            addToast('Copied to clipboard!', 'info');
        } catch (err) {
            console.error('Copy failed:', err);
            addToast('Copy failed (unsupported browser).', 'error');
        }
    };

    return (
        <div className="p-6 bg-gray-900 border border-blue-900/30 rounded-xl shadow-lg space-y-4">
            <h3 className="text-xl font-bold text-white flex items-center">
                <Lightbulb className="mr-2 h-5 w-5 text-yellow-500" /> AI Note Title Suggestor
            </h3>
            <p className="text-sm text-gray-300">
                Describe the content of your note below, and let MiniMax M2 suggest 5 professional titles.
            </p>
            <div className="space-y-3">
                <textarea
                    className="flex min-h-[80px] w-full rounded-lg border border-gray-700 bg-gray-800 text-white px-3 py-2 text-sm placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    placeholder="E.g., Summary of Laplace Transforms focusing on solving linear ODEs..."
                    value={description}
                    onChange={(e) => {
                        setDescription(e.target.value);
                        if (e.target.value.length >= 10) setError('');
                    }}
                />
                {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
                <Button onClick={generateTitles} disabled={loading || description.trim().length < 10} className="w-full">
                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : <><Zap className="mr-2 h-4 w-4" /> Generate Titles</>}
                </Button>
            </div>
            {titles.length > 0 && (
                <div className="pt-4 border-t border-gray-700">
                    <h4 className="text-md font-semibold mb-2 text-blue-400">Suggestions:</h4>
                    <ul className="space-y-2">
                        {titles.map((title, index) => (
                            <li key={index} className="flex justify-between items-center p-2 bg-gray-800/50 rounded-lg text-sm font-medium text-gray-200">
                                <span className="truncate pr-4">{title}</span>
                                <Button size="icon" variant="ghost" onClick={() => copyToClipboard(title)} title="Copy Title" className="p-1">
                                    <Clipboard className="w-4 h-4 text-blue-400 hover:text-blue-200" />
                                </Button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default NoteTitleSuggestor;