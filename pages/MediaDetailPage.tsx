
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  Trash2, 
  Maximize2, 
  Info, 
  Calendar, 
  HardDrive, 
  Image as ImageIcon, 
  Scissors, 
  Zap,
  Share2,
  X,
  Type,
  FileText,
  Save,
  RotateCcw,
  Crop as CropIcon,
  Sun,
  Contrast
} from 'lucide-react';
import { mockMedia } from '../lib/mock-data';

const MediaDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const item = mockMedia.find(m => m.id === id);

  // States
  const [copied, setCopied] = useState(false);
  const [minifying, setMinifying] = useState(false);
  const [isMinified, setIsMinified] = useState(false);
  const [currentSize, setCurrentSize] = useState(item?.size || '0 KB');
  const [isEnlarged, setIsEnlarged] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // SEO Metadata States
  const [altText, setAltText] = useState(item?.name?.split('.')[0] || '');
  const [caption, setCaption] = useState('');
  const [description, setDescription] = useState('');

  // Editing States
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
        <ImageIcon size={48} className="mb-4 opacity-20" />
        <h2 className="text-xl font-bold">Media Item Not Found</h2>
        <button 
          onClick={() => navigate('/media')}
          className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg font-bold text-sm"
        >
          Back to Library
        </button>
      </div>
    );
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(item.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMinify = () => {
    setMinifying(true);
    setTimeout(() => {
      setMinifying(false);
      setIsMinified(true);
      setCurrentSize('342 KB');
    }, 1200);
  };

  const handleSaveMetadata = () => {
    // In a real app, this would be an API call
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/media')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-bold text-sm"
        >
          <ArrowLeft size={16} />
          Back to Media Library
        </button>
        <div className="flex gap-2">
          <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all border border-slate-200 bg-white shadow-sm">
            <Trash2 size={18} />
          </button>
          <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-all border border-slate-200 bg-white shadow-sm">
            <Share2 size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Workspace (Preview or Editor) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center relative group min-h-[500px] overflow-hidden">
            {isEditing ? (
              <div className="w-full h-full flex flex-col items-center animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between w-full mb-4 px-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Scissors size={14} /> Image Editor
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { setBrightness(100); setContrast(100); }} 
                      className="p-1.5 hover:bg-slate-100 rounded text-slate-500" title="Reset"
                    >
                      <RotateCcw size={16} />
                    </button>
                    <button 
                      onClick={() => setIsEditing(false)} 
                      className="p-1.5 hover:bg-red-50 text-red-500 rounded" title="Close"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="relative border-4 border-blue-500/20 rounded-lg p-1 bg-slate-50">
                   <img 
                    src={item.url} 
                    className="max-w-full max-h-[400px] rounded shadow-inner transition-all duration-300" 
                    style={{ filter: `brightness(${brightness}%) contrast(${contrast}%)` }}
                    alt="Editing" 
                  />
                  {/* Simulated Crop Grid */}
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none border border-white/50">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className="border border-white/20"></div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 w-full max-w-md mt-8">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase">
                      <span className="flex items-center gap-1"><Sun size={12} /> Brightness</span>
                      <span>{brightness}%</span>
                    </div>
                    <input 
                      type="range" min="50" max="200" value={brightness} 
                      onChange={(e) => setBrightness(parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase">
                      <span className="flex items-center gap-1"><Contrast size={12} /> Contrast</span>
                      <span>{contrast}%</span>
                    </div>
                    <input 
                      type="range" min="50" max="200" value={contrast} 
                      onChange={(e) => setContrast(parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-900"
                    />
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                   <button 
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold text-sm flex items-center gap-2"
                  >
                    <Save size={16} /> Apply Changes
                  </button>
                  <button className="px-6 py-2 border border-slate-200 text-slate-600 rounded-lg font-bold text-sm flex items-center gap-2">
                    <CropIcon size={16} /> Crop Area
                  </button>
                </div>
              </div>
            ) : (
              <>
                <img 
                  src={item.url} 
                  className="max-w-full max-h-[600px] rounded shadow-lg object-contain bg-slate-50 cursor-zoom-in" 
                  alt={item.name} 
                  onClick={() => setIsEnlarged(true)}
                />
                <button 
                  onClick={() => setIsEnlarged(true)}
                  className="absolute bottom-6 right-6 p-2.5 bg-white/95 backdrop-blur shadow-xl rounded-lg text-slate-900 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95 border border-slate-200 z-10"
                >
                  <Maximize2 size={20} />
                </button>
              </>
            )}
          </div>

          {/* SEO Metadata Section */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Zap size={16} className="text-blue-600" /> SEO & Media Metadata
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Type size={12} /> Alt Text
                  </label>
                  <input 
                    type="text" 
                    value={altText}
                    onChange={(e) => setAltText(e.target.value)}
                    placeholder="Describe this image for screen readers..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-slate-900 outline-none transition-all"
                  />
                  <p className="text-[10px] text-slate-400 font-medium italic leading-tight">
                    Required for accessibility. Describes the image for blind users and search engines.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <FileText size={12} /> Caption
                  </label>
                  <input 
                    type="text" 
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Add a visible caption..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-slate-900 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                   Description
                </label>
                <textarea 
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed context about this asset..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-slate-900 outline-none transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-50">
              <button 
                onClick={handleSaveMetadata}
                className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-slate-800 transition-all shadow-sm active:scale-95"
              >
                {copied ? <Check size={16} /> : <Save size={16} />}
                {copied ? 'Metadata Saved' : 'Update Metadata'}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Info & Actions */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6 sticky top-24">
            <div>
              <h2 className="text-xl font-bold text-slate-900 truncate" title={item.name}>
                {item.name}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Image Asset</span>
                <span className="text-[10px] font-bold text-slate-300">•</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">PNG</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-md bg-slate-50 flex items-center justify-center text-slate-400">
                  <HardDrive size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] uppercase text-slate-400 font-bold tracking-widest leading-none mb-1">File Size</p>
                  <p className="text-slate-900 font-semibold">{currentSize} {isMinified && <span className="text-green-600 ml-1 text-xs font-bold">(Optimized)</span>}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-md bg-slate-50 flex items-center justify-center text-slate-400">
                  <Calendar size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] uppercase text-slate-400 font-bold tracking-widest leading-none mb-1">Uploaded On</p>
                  <p className="text-slate-900 font-semibold">{item.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-md bg-slate-50 flex items-center justify-center text-slate-400">
                  <Maximize2 size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] uppercase text-slate-400 font-bold tracking-widest leading-none mb-1">Dimensions</p>
                  <p className="text-slate-900 font-semibold">1200 x 800 px</p>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button 
                onClick={handleCopyLink}
                className="w-full py-2.5 bg-slate-900 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Link Copied!' : 'Copy Asset Link'}
              </button>
              
              <button 
                onClick={handleMinify}
                disabled={minifying || isMinified}
                className={`w-full py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all border ${
                  isMinified 
                    ? 'bg-green-50 border-green-200 text-green-700' 
                    : 'bg-white border-slate-200 text-slate-900 hover:bg-slate-50 shadow-sm'
                } ${minifying ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {minifying ? <Zap size={16} className="animate-pulse" /> : isMinified ? <Check size={16} /> : <Zap size={16} />}
                {minifying ? 'Minifying...' : isMinified ? 'Image Optimized' : 'Minify Image'}
              </button>

              <button 
                onClick={() => setIsEditing(true)}
                className={`w-full py-2.5 border rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm ${
                  isEditing ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Scissors size={16} />
                Edit / Crop
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enlarged Modal Overlay */}
      {isEnlarged && (
        <div 
          className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300"
          onClick={() => setIsEnlarged(false)}
        >
          <button 
            onClick={() => setIsEnlarged(false)}
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
          >
            <X size={24} />
          </button>
          <img 
            src={item.url} 
            className="max-w-full max-h-full rounded-lg shadow-2xl object-contain animate-in zoom-in-95 duration-300" 
            alt={item.name} 
          />
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur px-4 py-2 rounded-full border border-white/20 text-white text-xs font-bold uppercase tracking-widest">
            {item.name} • Full Resolution Preview
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaDetailPage;
