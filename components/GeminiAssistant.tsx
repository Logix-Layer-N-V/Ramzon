
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Sparkles, Send, Loader2, Wand2, Copy, Check } from 'lucide-react';

const GeminiAssistant: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResponse('');
    try {
      /* Always use direct process.env.API_KEY when initializing GoogleGenAI */
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are a professional CMS assistant. Help me write or optimize content for a blog post based on this request: ${prompt}`,
        config: {
          systemInstruction: 'Be concise, professional, and SEO-focused.',
        },
      });
      /* Directly access the .text property from the response */
      setResponse(res.text || 'No response from AI.');
    } catch (error) {
      console.error(error);
      setResponse('Error generating content. Please check API key configuration.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Word Assistant</h1>
          <p className="text-slate-500">AI-powered content generation and optimization</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6 flex flex-col">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
              <Sparkles size={20} />
            </div>
            <h3 className="font-black text-slate-900 tracking-tight">Describe your needs</h3>
          </div>
          <textarea 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Write a catchy headline for a blog post about modern CMS features..."
            className="w-full flex-1 p-6 bg-slate-50 border border-slate-200 rounded-[24px] text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none resize-none transition-all font-medium leading-relaxed"
          />
          <div className="flex justify-between items-center pt-2">
            <div className="flex flex-col">
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">Engine</p>
              <p className="text-xs font-bold text-blue-600">Gemini 3 Flash</p>
            </div>
            <button 
              onClick={handleGenerate}
              disabled={loading}
              className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-sm font-black hover:bg-slate-800 transition-all flex items-center gap-3 disabled:opacity-50 shadow-xl shadow-slate-200 active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
              Generate
            </button>
          </div>
        </div>

        <div className="bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden flex flex-col min-h-[500px] border border-slate-800">
          <div className="p-6 bg-slate-800/80 backdrop-blur-md border-b border-slate-700 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">System Output</h3>
            </div>
            {response && (
              <button 
                onClick={copyToClipboard}
                className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl hover:bg-slate-700 transition-all shadow-sm"
              >
                {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
              </button>
            )}
          </div>
          <div className="flex-1 p-8 overflow-y-auto text-slate-100 text-sm leading-relaxed whitespace-pre-wrap font-medium">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full gap-6 text-slate-500">
                <div className="relative">
                  <Loader2 className="animate-spin w-12 h-12 text-blue-600" />
                  <Sparkles className="absolute inset-0 m-auto w-4 h-4 text-blue-400 animate-pulse" />
                </div>
                <div className="text-center">
                  <p className="font-black text-slate-400 uppercase tracking-widest text-[10px] mb-2">Processing</p>
                  <p className="animate-pulse text-lg text-slate-300 font-bold">Gemini is thinking...</p>
                </div>
              </div>
            ) : response ? (
              <div className="animate-in fade-in duration-700">
                {response}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full opacity-10 select-none grayscale">
                <Sparkles size={80} className="mb-6" />
                <p className="text-center font-black text-2xl tracking-tighter uppercase italic">Your generated content<br/>will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeminiAssistant;
