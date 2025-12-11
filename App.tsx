import React, { useState, useEffect, useMemo, useRef } from 'react';
import { HashRouter, Routes, Route, useNavigate, useParams, Link, useSearchParams, useLocation } from 'react-router-dom';
import { ALL_TOOLS } from './constants';
import Sidebar from './components/Sidebar';
import { Search, Sun, Moon, Upload, FileText, ArrowRight, X, Heart, Loader2, CheckCircle, Download, Menu, Clock, Settings, MoveUp, MoveDown, Trash, RefreshCw, Grid2X2, QrCode, FileType, LayoutTemplate } from 'lucide-react';
import { Tool, ToolCategory } from './types';
import { processPDF, getPageCount } from './services/pdfService';
import clsx from 'clsx';

// --- COMPONENTS DEFINED IN-FILE FOR SINGLE XML CONSTRAINT ---

// 1. HEADER
const Header = ({ toggleTheme, isDark, setMobileMenuOpen }: any) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState(searchParams.get('search') || '');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync internal state with URL params (e.g. browser back button)
  useEffect(() => {
    const q = searchParams.get('search') || '';
    // Only sync if on home page to avoid overwriting tool specific queries if we add them later
    if (location.pathname === '/') {
        setQuery(q);
    }
  }, [searchParams, location.pathname]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);

    if (location.pathname === '/') {
       // Real-time update on Home Page
       // We replace the current entry to avoid polluting history with every keystroke, 
       // OR we push if we want history. Replace is usually better for "as you type".
       if (newQuery) {
           setSearchParams({ search: newQuery }, { replace: true });
       } else {
           setSearchParams({}, { replace: true });
       }
       setIsOpen(false); // Don't show dropdown on home since grid filters
    } else {
       // On other pages, show the dropdown
       setIsOpen(!!newQuery);
    }
  };

  const filteredTools = useMemo(() => {
     if (!query) return [];
     const lowerQ = query.toLowerCase();
     return ALL_TOOLS.filter(t => 
       t.name.toLowerCase().includes(lowerQ) || 
       t.description.toLowerCase().includes(lowerQ)
     ).slice(0, 8); // Limit to 8 results for dropdown
  }, [query]);

  const clearSearch = () => {
    setQuery('');
    setIsOpen(false);
    if (location.pathname === '/') setSearchParams({}, { replace: true });
  };

  const handleResultClick = () => {
      setQuery('');
      setIsOpen(false);
  };

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 px-4 lg:px-8 flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1">
        <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-2 text-slate-600 dark:text-slate-300">
          <Menu size={24} />
        </button>
        
        {/* Smart Search Bar */}
        <div className="relative w-full max-w-md hidden md:block" ref={wrapperRef}>
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                <input 
                    type="text" 
                    placeholder="Search 100+ tools (e.g. 'merge', 'word')" 
                    value={query}
                    onChange={handleSearchChange}
                    onFocus={() => {
                        if (query && location.pathname !== '/') setIsOpen(true);
                    }}
                    className="w-full pl-10 pr-10 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-transparent focus:border-primary-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all dark:text-white shadow-sm font-medium text-sm"
                />
                {query && (
                    <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        <X size={14} />
                    </button>
                )}
            </div>

            {/* Dropdown Results (Not on Home) */}
            {isOpen && location.pathname !== '/' && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-100 dark:border-slate-700 overflow-hidden animate-fade-in z-50">
                    {filteredTools.length > 0 ? (
                        <>
                            <div className="max-h-[60vh] overflow-y-auto py-2">
                                <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Jump</div>
                                {filteredTools.map(tool => (
                                    <Link 
                                        key={tool.id} 
                                        to={`/tool/${tool.id}`} 
                                        onClick={handleResultClick}
                                        className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group border-l-4 border-transparent hover:border-primary-500"
                                    >
                                        <div className="p-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 rounded-lg group-hover:scale-110 transition-transform">
                                            <tool.icon size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-slate-900 dark:text-white text-sm truncate group-hover:text-primary-600 transition-colors">{tool.name}</h4>
                                            <p className="text-xs text-slate-500 truncate">{tool.description}</p>
                                        </div>
                                        <ArrowRight size={14} className="text-slate-300 group-hover:text-primary-500 -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
                                    </Link>
                                ))}
                            </div>
                            <Link 
                                to={`/?search=${query}`} 
                                onClick={handleResultClick}
                                className="block w-full text-center py-3 text-xs font-bold text-primary-600 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                See all {filteredTools.length}+ results on Home Page
                            </Link>
                        </>
                    ) : (
                        <div className="p-8 text-center text-slate-500">
                            <Search size={24} className="mx-auto mb-2 opacity-20" />
                            <p className="text-sm">No tools found for "{query}"</p>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
      <div className="flex items-center gap-3">
         {/* Auth Mock */}
        <button className="hidden sm:flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary-600 px-3 py-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs">A</div>
            <span>Account</span>
        </button>
        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300">
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </header>
  );
};

// 2. TOOL CARD
const ToolCard: React.FC<{ tool: Tool }> = ({ tool }) => (
  <Link to={`/tool/${tool.id}`} className="group relative bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-start gap-4 h-full">
    {tool.popular && (
      <span className="absolute top-4 right-4 bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">
        Hot
      </span>
    )}
    <div className="p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform duration-300">
      <tool.icon size={28} strokeWidth={1.5} />
    </div>
    <div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1 group-hover:text-primary-600 transition-colors">
        {tool.name}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
        {tool.description}
      </p>
    </div>
  </Link>
);

// 3. HOME PAGE
const HomePage = () => {
  const [searchParams] = useSearchParams();
  const { cat } = useParams<{ cat: string }>(); 
  const query = searchParams.get('search') || '';
  
  const filteredTools = useMemo(() => {
    let tools = ALL_TOOLS;
    if (cat) tools = tools.filter(t => t.category === cat);
    if (query) {
      const q = query.toLowerCase();
      tools = tools.filter(t => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
    }
    return tools;
  }, [query, cat]);

  const categories = Object.values(ToolCategory);

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-12 animate-fade-in">
      {!query && !cat && (
        <div className="text-center space-y-6 py-12">
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight">
            Every PDF Tool <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-indigo-600">You Need.</span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Merge, split, compress, convert, rotate, unlock and watermark PDFs with just a few clicks. 100% Client-side privacy.
          </p>
        </div>
      )}

      {(query || cat) ? (
         <>
           <div className="mb-6 flex items-center gap-2 text-lg text-slate-600 dark:text-slate-400">
             {query ? (
                <>Found {filteredTools.length} tools for "<span className="font-bold text-slate-900 dark:text-white">{query}</span>"</>
             ) : (
                <>
                  <Link to="/" className="hover:text-primary-500 transition-colors">All Tools</Link> 
                  <span>/</span> 
                  <span className="font-bold text-slate-900 dark:text-white">{cat}</span>
                </>
             )}
           </div>
           
           {filteredTools.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                 {filteredTools.map(tool => <ToolCard key={tool.id} tool={tool} />)}
               </div>
           ) : (
               <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400">
                   <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                       <Search size={32} />
                   </div>
                   <p className="text-lg font-medium">No tools found for "{query}"</p>
                   <button onClick={() => window.location.href='/'} className="mt-4 text-primary-600 hover:underline">View all tools</button>
               </div>
           )}
         </>
      ) : (
        categories.map(categoryName => {
          const catTools = ALL_TOOLS.filter(t => t.category === categoryName);
          if (catTools.length === 0) return null;
          return (
            <div key={categoryName} className="space-y-6">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">{categoryName}</h2>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
                <Link to={`/category/${categoryName}`} className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
                  View All
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {catTools.map(tool => <ToolCard key={tool.id} tool={tool} />)}
              </div>
            </div>
          )
        })
      )}
    </div>
  );
};

// 4. TOOL WORKSPACE (Core Logic)
const ToolWorkspace = () => {
  const { id } = useParams();
  const tool = ALL_TOOLS.find(t => t.id === id);
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  
  // Advanced State
  const [numPages, setNumPages] = useState<number>(0);
  const [pageOrder, setPageOrder] = useState<number[]>([]);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});

  // Dynamic Options
  const [options, setOptions] = useState<any>({
    password: '',
    pages: '',
    rotation: 90,
    rotateMode: 'all',
    blankPagePos: 1,
    duplicatePages: '1',
    nUp: 2,
    splitSize: 5,
    splitText: '',
    // Image to PDF options
    pageSize: 'a4', // a4, letter, fit
    orientation: 'portrait', // portrait, landscape
    margin: 'small', // none, small, big
    // QR
    qrText: '',
    // Text
    fontSize: 12,
    // PDF to Image options
    quality: 'high', // low, medium, high
    pageRange: 'all', // all, specific
    // Compression options
    // Compression - no options needed (automatic optimization)
    // Security options
    oldPassword: '',
    newPassword: '',
    watermarkText: 'CONFIDENTIAL',
    watermarkOpacity: 30,
    watermarkSize: 48,
    watermarkRotation: 45,
    // Grayscale options
    grayscaleMethod: 'luminosity',
    grayscaleQuality: 'high',
    // Page numbers
    pageNumberPosition: 'bottom-center',
    pageNumberStart: 1,
    pageNumberSize: 12,
    pageNumberFormat: 'number',
    // Header & Footer
    headerText: '',
    footerText: '',
    headerFooterSize: 10,
    // Crop
    cropMargin: 50,
    // Resize
    resizeTarget: 'a4',
    // Repair PDF
    repairMode: 'standard',
    removeCorrupted: true,
    // OCR PDF
    ocrLanguage: 'eng',
    ocrDeskew: true,
    ocrEnhance: true,
    // Compare PDF
    compareMode: 'visual',
    highlightColor: 'red',
    // Optimize Web
    webCompression: 'medium',
    embedFonts: true,
    removeMetadata: false,
    // Metadata
    metaTitle: '',
    metaAuthor: '',
    metaSubject: '',
    metaKeywords: '',
    metaCreator: 'All PDF Tools',
    // Viewer Preferences
    viewerPageMode: 'UseNone',
    viewerPageLayout: 'SinglePage',
    viewerFitWindow: true,
    viewerCenterWindow: true,
    viewerHideToolbar: false,
    viewerHideMenubar: false,
    // Analyze
    analyzeImages: true,
    analyzeFonts: true,
    analyzeText: true,
    // Batch Process
    batchAction: 'compress',
    // Print Ready
    printColorProfile: 'cmyk',
    printBleed: 0,
    printCropMarks: false,
    // Share Link
    shareExpiry: 30,
    sharePassword: false,
    shareDownload: true,
  });

  // Favorites logic
  useEffect(() => {
    const favs = JSON.parse(localStorage.getItem('favs') || '[]');
    setIsFavorite(favs.includes(id));
  }, [id]);

  // Clean up previews
  useEffect(() => {
    return () => {
      Object.values(previewUrls).forEach((url: string) => URL.revokeObjectURL(url));
    }
  }, [previewUrls]);

  const toggleFav = () => {
    if (!id) return;
    const favs = JSON.parse(localStorage.getItem('favs') || '[]');
    const newFavs = isFavorite ? favs.filter((i: string) => i !== id) : [...favs, id];
    localStorage.setItem('favs', JSON.stringify(newFavs));
    setIsFavorite(!isFavorite);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles: File[] = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
      setResult(null);
      setError(null);

      // Generate previews for images
      const newPreviews: Record<string, string> = {};
      newFiles.forEach(f => {
          if (f.type.startsWith('image/')) {
              newPreviews[f.name] = URL.createObjectURL(f);
          }
      });
      setPreviewUrls(prev => ({...prev, ...newPreviews}));

      // Pre-load page count for reorder/layout tools
      if (['reorder-pages', 'rotate-pdf', 'remove-pages', 'split'].includes(tool?.id || '') && newFiles[0].type === 'application/pdf') {
          try {
              const count = await getPageCount(newFiles[0]);
              setNumPages(count);
              setPageOrder(Array.from({length: count}, (_, i) => i + 1));
          } catch (err: any) {
              console.error("Could not count pages", err);
          }
      }
    }
  };

  const removeFile = (index: number) => {
      setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const movePage = (index: number, direction: 'up' | 'down') => {
      const newOrder = [...pageOrder];
      if (direction === 'up' && index > 0) {
          [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
      } else if (direction === 'down' && index < newOrder.length - 1) {
          [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      }
      setPageOrder(newOrder);
  };

  const handleProcess = async () => {
    if (tool?.id === 'qr-to-pdf' && !options.qrText) {
        setError("Please enter text for the QR code");
        return;
    }
    if (tool?.id !== 'qr-to-pdf' && !files.length) return;

    setIsProcessing(true);
    setError(null);
    try {
      if (!id) throw new Error("No tool ID");
      const finalOptions = { ...options, pageOrder };
      const res = await processPDF(id, files, finalOptions);
      setResult(res);
      
      const hist = JSON.parse(localStorage.getItem('history') || '[]');
      const itemName = tool?.id === 'qr-to-pdf' ? `QR Code: ${options.qrText.substring(0, 15)}...` : files[0].name;
      hist.unshift({ id, toolName: tool?.name, timestamp: Date.now(), fileName: itemName });
      localStorage.setItem('history', JSON.stringify(hist.slice(0, 20))); 
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = (fileData: any) => {
    const blob = new Blob([fileData.data], { type: fileData.type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileData.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!tool) return <div className="p-10 text-center">Tool not found</div>;

  const isImageTool = tool.id.includes('to-pdf') && (tool.id.includes('jpg') || tool.id.includes('png') || tool.id.includes('bmp') || tool.id.includes('webp') || tool.id.includes('svg') || tool.id.includes('heic'));
  const isQRTool = tool.id === 'qr-to-pdf';
  const isTextTool = tool.id === 'txt-to-pdf' || tool.id === 'markdown-to-pdf' || tool.id === 'html-to-pdf';
  const isPdfToImageTool = tool.id === 'pdf-to-jpg' || tool.id === 'pdf-to-png' || tool.id === 'pdf-to-bmp' || tool.id === 'pdf-to-tiff';
  const isCompressTool = tool.id === 'compress-pdf';
  const isUnlockTool = tool.id === 'unlock-pdf';
  const isProtectTool = tool.id === 'protect-pdf';
  const isWatermarkTool = tool.id === 'watermark-pdf';
  const isChangePasswordTool = tool.id === 'change-password';
  const isGrayscaleTool = tool.id === 'grayscale-pdf';
  const isPageNumbersTool = tool.id === 'page-numbers';
  const isHeaderFooterTool = tool.id === 'add-header-footer';
  const isCropTool = tool.id === 'crop-pdf';
  const isResizeTool = tool.id === 'resize-pdf';
  const isOverlayTool = tool.id === 'overlay-pdf';
  const isRepairTool = tool.id === 'repair-pdf';
  const isOcrTool = tool.id === 'ocr-pdf';
  const isCompareTool = tool.id === 'compare-pdf';
  const isOptimizeWebTool = tool.id === 'optimize-web';
  const isMetaEditTool = tool.id === 'meta-edit';
  const isViewerPrefsTool = tool.id === 'set-viewer';
  const isExtractFontsTool = tool.id === 'extract-fonts';
  const isAnalyzeTool = tool.id === 'analyze-pdf';
  const isBatchProcessTool = tool.id === 'batch-process';
  const isPrintReadyTool = tool.id === 'print-ready';
  const isShareLinkTool = tool.id === 'share-link';

  return (
    <div className="max-w-5xl mx-auto p-6 lg:p-12 animate-slide-up">
      {/* Tool Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-primary-100 dark:bg-primary-900/40 rounded-2xl text-primary-600 dark:text-primary-400">
            <tool.icon size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{tool.name}</h1>
            <p className="text-slate-500 dark:text-slate-400 max-w-lg">{tool.description}</p>
          </div>
        </div>
        <button onClick={toggleFav} className="p-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <Heart className={clsx("transition-colors", isFavorite ? "fill-red-500 text-red-500" : "text-slate-400")} />
        </button>
      </div>

      {/* Workspace Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-slate-100 dark:border-slate-700 overflow-hidden min-h-[500px] flex flex-col">
        
        {/* State: Initial Upload OR Input */}
        {!files.length && !isQRTool && (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 m-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer relative">
            <input 
              type="file" 
              multiple 
              onChange={handleFileChange} 
              className="absolute inset-0 opacity-0 cursor-pointer" 
              accept={
                 isImageTool ? 'image/*' :
                 tool.id.includes('to-pdf') ? '.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md,.html,.rtf,.odt,.epub' : 
                 '.pdf'
              } 
            />
            <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-full shadow-lg flex items-center justify-center mb-6 text-primary-500">
              <Upload size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Drop files here or click to upload</h3>
            <p className="text-slate-500 text-sm">Supports multiple files for batch operations</p>
          </div>
        )}

        {/* QR Tool Specific Input */}
        {isQRTool && !result && (
            <div className="flex-1 p-8 flex flex-col items-center justify-center">
                <div className="w-full max-w-md space-y-4">
                    <label className="block text-lg font-medium text-slate-900 dark:text-white">Enter Text or URL</label>
                    <textarea 
                        value={options.qrText}
                        onChange={e => setOptions({...options, qrText: e.target.value})}
                        className="w-full h-32 p-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 outline-none"
                        placeholder="https://example.com"
                    />
                     <button 
                        onClick={handleProcess}
                        disabled={!options.qrText || isProcessing}
                        className="w-full py-4 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700 transition-colors flex justify-center items-center gap-2"
                    >
                        {isProcessing ? <Loader2 className="animate-spin" /> : <QrCode />} Generate QR PDF
                    </button>
                </div>
            </div>
        )}

        {/* State: Selected Files & Options */}
        {files.length > 0 && !result && (
          <div className="flex-1 p-6 flex flex-col items-center w-full">
             
             {/* File List / Grid */}
             {isImageTool ? (
                 <div className="w-full mb-8">
                     <div className="flex justify-between items-center mb-4">
                         <h3 className="font-bold text-slate-700 dark:text-slate-300">{files.length} Images Selected</h3>
                         <button onClick={() => setFiles([])} className="text-red-500 text-sm hover:underline">Clear All</button>
                     </div>
                     <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                         {files.map((f, i) => (
                             <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900">
                                 <img src={previewUrls[f.name]} alt={f.name} className="w-full h-full object-cover" />
                                 <button 
                                    onClick={() => removeFile(i)}
                                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                 >
                                     <X size={14} />
                                 </button>
                                 <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] p-1 truncate px-2">
                                     {f.name}
                                 </div>
                             </div>
                         ))}
                         {/* Add More Button */}
                         <div className="relative aspect-square rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center text-slate-400 hover:text-primary-500 hover:border-primary-500 transition-colors cursor-pointer">
                             <input type="file" multiple onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                             <Upload size={24} />
                             <span className="text-xs mt-2">Add</span>
                         </div>
                     </div>
                 </div>
             ) : (
                 <div className="w-full max-w-2xl space-y-4 mb-8">
                    {files.map((f, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                            <FileText className="text-primary-500" />
                            <div className="text-left">
                            <span className="block text-sm font-medium text-slate-700 dark:text-slate-200 truncate max-w-xs">{f.name}</span>
                            <span className="text-xs text-slate-400">{(f.size / 1024).toFixed(1)} KB</span>
                            </div>
                        </div>
                        <button onClick={() => removeFile(i)} className="text-slate-400 hover:text-red-500">
                            <X size={18} />
                        </button>
                        </div>
                    ))}
                 </div>
             )}

             {/* TOOL SPECIFIC OPTIONS */}
             <div className="w-full max-w-2xl mb-8 space-y-6">
                
                {/* IMAGE PDF SETTINGS */}
                {isImageTool && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                            <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Page Size</label>
                            <select 
                                value={options.pageSize}
                                onChange={e => setOptions({...options, pageSize: e.target.value})}
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="a4">A4</option>
                                <option value="letter">Letter</option>
                                <option value="fit">Fit to Image</option>
                            </select>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                            <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Orientation</label>
                            <select 
                                value={options.orientation}
                                onChange={e => setOptions({...options, orientation: e.target.value})}
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="portrait">Portrait</option>
                                <option value="landscape">Landscape</option>
                            </select>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                            <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Margin</label>
                            <select 
                                value={options.margin}
                                onChange={e => setOptions({...options, margin: e.target.value})}
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="none">None</option>
                                <option value="small">Small</option>
                                <option value="big">Big</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* TEXT SETTINGS */}
                {isTextTool && (
                     <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Font Size (pt)</label>
                        <input 
                            type="number" 
                            min="8" max="72"
                            value={options.fontSize}
                            onChange={e => setOptions({...options, fontSize: parseInt(e.target.value)})}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                        />
                     </div>
                )}
                
                {/* UNLOCK PDF */}
                {isUnlockTool && (
                   <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Enter PDF Password</label>
                      <input 
                        type="password" 
                        value={options.password}
                        onChange={e => setOptions({...options, password: e.target.value})}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 outline-none dark:text-white"
                        placeholder="Enter password to unlock"
                      />
                      <p className="text-xs text-slate-500 mt-2">⚠️ Only use this for PDFs you own or have permission to unlock</p>
                   </div>
                )}

                {/* PROTECT PDF */}
                {isProtectTool && (
                   <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Set Password</label>
                        <input 
                          type="password" 
                          value={options.password}
                          onChange={e => setOptions({...options, password: e.target.value})}
                          className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 outline-none dark:text-white"
                          placeholder="Enter a secure password (min 4 characters)"
                        />
                      </div>
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-2">🔒 Password Security Tips:</p>
                        <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                          <li>• Use at least 8 characters</li>
                          <li>• Mix uppercase, lowercase, numbers & symbols</li>
                          <li>• Avoid common words or personal info</li>
                          <li>• Store password securely</li>
                        </ul>
                      </div>
                      {options.password && (
                        <div className="flex items-center gap-2">
                          <div className={clsx(
                            "h-2 flex-1 rounded-full",
                            options.password.length < 6 ? "bg-red-500" :
                            options.password.length < 8 ? "bg-yellow-500" : "bg-green-500"
                          )} />
                          <span className="text-xs font-medium">
                            {options.password.length < 6 ? "Weak" :
                             options.password.length < 8 ? "Medium" : "Strong"}
                          </span>
                        </div>
                      )}
                   </div>
                )}

                {/* WATERMARK PDF */}
                {isWatermarkTool && (
                   <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Watermark Text</label>
                        <input 
                          type="text" 
                          value={options.watermarkText}
                          onChange={e => setOptions({...options, watermarkText: e.target.value})}
                          className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 outline-none dark:text-white"
                          placeholder="e.g., CONFIDENTIAL, DRAFT"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Opacity</label>
                          <span className="text-sm font-bold text-primary-600">{options.watermarkOpacity}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="10" 
                          max="100" 
                          value={options.watermarkOpacity}
                          onChange={e => setOptions({...options, watermarkOpacity: parseInt(e.target.value)})}
                          className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Font Size</label>
                          <input 
                            type="number" 
                            min="12" 
                            max="120"
                            value={options.watermarkSize}
                            onChange={e => setOptions({...options, watermarkSize: parseInt(e.target.value)})}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Rotation (°)</label>
                          <input 
                            type="number" 
                            min="0" 
                            max="360"
                            value={options.watermarkRotation}
                            onChange={e => setOptions({...options, watermarkRotation: parseInt(e.target.value)})}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                          />
                        </div>
                      </div>
                   </div>
                )}

                {/* CHANGE PASSWORD */}
                {isChangePasswordTool && (
                   <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Current Password</label>
                        <input 
                          type="password" 
                          value={options.oldPassword}
                          onChange={e => setOptions({...options, oldPassword: e.target.value})}
                          className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 outline-none dark:text-white"
                          placeholder="Enter current password"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">New Password</label>
                        <input 
                          type="password" 
                          value={options.newPassword}
                          onChange={e => setOptions({...options, newPassword: e.target.value})}
                          className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 outline-none dark:text-white"
                          placeholder="Enter new password (min 4 characters)"
                        />
                      </div>
                      {options.newPassword && (
                        <div className="flex items-center gap-2">
                          <div className={clsx(
                            "h-2 flex-1 rounded-full",
                            options.newPassword.length < 6 ? "bg-red-500" :
                            options.newPassword.length < 8 ? "bg-yellow-500" : "bg-green-500"
                          )} />
                          <span className="text-xs font-medium">
                            {options.newPassword.length < 6 ? "Weak" :
                             options.newPassword.length < 8 ? "Medium" : "Strong"}
                          </span>
                        </div>
                      )}
                   </div>
                )}
                
                {/* 2. REORDER PAGES */}
                {tool.id === 'reorder-pages' && numPages > 0 && (
                   <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                       <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">Arrange Pages (Top is first)</label>
                       <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-60 overflow-y-auto p-1">
                           {pageOrder.map((pageNum, idx) => (
                               <div key={idx} className="relative group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg p-2 flex flex-col items-center justify-between h-24">
                                   <span className="text-xl font-bold text-slate-400">{pageNum}</span>
                                   <div className="flex gap-1 w-full justify-center">
                                       <button onClick={() => movePage(idx, 'up')} disabled={idx === 0} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded disabled:opacity-30">
                                            <MoveUp size={14} />
                                       </button>
                                       <button onClick={() => movePage(idx, 'down')} disabled={idx === pageOrder.length - 1} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded disabled:opacity-30">
                                            <MoveDown size={14} />
                                       </button>
                                   </div>
                               </div>
                           ))}
                       </div>
                   </div>
                )}

                {/* PDF TO IMAGE OPTIONS */}
                {isPdfToImageTool && (
                    <div className="space-y-4">
                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Image Quality</label>
                            <div className="flex gap-4">
                                {['low', 'medium', 'high'].map(q => (
                                    <button 
                                        key={q} 
                                        onClick={() => setOptions({...options, quality: q})}
                                        className={clsx(
                                            "flex-1 py-2 rounded-lg border text-sm font-medium transition-colors capitalize",
                                            options.quality === q 
                                                ? "bg-primary-600 text-white border-primary-600" 
                                                : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-primary-500"
                                        )}
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Pages to Convert</label>
                            <div className="flex gap-4 mb-2">
                                <button onClick={() => setOptions({...options, pageRange: 'all'})} className={clsx("px-3 py-1 rounded text-sm", options.pageRange === 'all' ? "bg-slate-200 dark:bg-slate-700" : "")}>All Pages</button>
                                <button onClick={() => setOptions({...options, pageRange: 'specific'})} className={clsx("px-3 py-1 rounded text-sm", options.pageRange === 'specific' ? "bg-slate-200 dark:bg-slate-700" : "")}>Specific Pages</button>
                            </div>
                            {options.pageRange === 'specific' && (
                                <input 
                                    type="text" 
                                    placeholder="e.g. 1,3,5-10" 
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                                    value={options.pages}
                                    onChange={e => setOptions({...options, pages: e.target.value})}
                                />
                            )}
                        </div>
                    </div>
                )}

                {/* COMPRESS PDF OPTIONS */}
                {isCompressTool && (
                    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 p-8 rounded-2xl border-2 border-blue-200 dark:border-blue-800">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">⚡ Smart Optimization</h3>
                                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">Professional-grade compression that removes waste while preserving 100% quality.</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm p-4 rounded-xl border border-blue-200 dark:border-blue-700">
                                <div className="flex items-center gap-2 mb-2">
                                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                                    <span className="font-semibold text-slate-900 dark:text-white text-sm">What Gets Optimized</span>
                                </div>
                                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 ml-7">
                                    <li>• Duplicate objects removed</li>
                                    <li>• Unused resources cleaned</li>
                                    <li>• Structure optimized</li>
                                    <li>• Metadata streamlined</li>
                                </ul>
                            </div>
                            
                            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm p-4 rounded-xl border border-blue-200 dark:border-blue-700">
                                <div className="flex items-center gap-2 mb-2">
                                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                                    <span className="font-semibold text-slate-900 dark:text-white text-sm">What Stays Perfect</span>
                                </div>
                                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 ml-7">
                                    <li>• Text (selectable & sharp)</li>
                                    <li>• Images (original quality)</li>
                                    <li>• Vectors (crisp & clear)</li>
                                    <li>• Fonts & links preserved</li>
                                </ul>
                            </div>
                        </div>
                        
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
                            <div className="flex items-start gap-3">
                                <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/></svg>
                                <div>
                                    <p className="text-xs font-semibold text-amber-900 dark:text-amber-200 mb-1">Expected Results:</p>
                                    <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                                        Typical reduction: <strong>10-30%</strong> for most PDFs. Already optimized files may see minimal reduction. This is normal and indicates your PDF is already efficient.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* PAGE NUMBERS OPTIONS */}
                {isPageNumbersTool && (
                    <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Position</label>
                            <select value={options.pageNumberPosition} onChange={e => setOptions({...options, pageNumberPosition: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800">
                                <option value="bottom-center">Bottom Center</option>
                                <option value="bottom-right">Bottom Right</option>
                                <option value="bottom-left">Bottom Left</option>
                                <option value="top-center">Top Center</option>
                                <option value="top-right">Top Right</option>
                                <option value="top-left">Top Left</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Start Number</label>
                                <input type="number" min="1" value={options.pageNumberStart} onChange={e => setOptions({...options, pageNumberStart: parseInt(e.target.value)})} className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Font Size</label>
                                <input type="number" min="8" max="24" value={options.pageNumberSize} onChange={e => setOptions({...options, pageNumberSize: parseInt(e.target.value)})} className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Format</label>
                            <div className="flex gap-4">
                                <button onClick={() => setOptions({...options, pageNumberFormat: 'number'})} className={clsx("flex-1 py-2 rounded-lg border", options.pageNumberFormat === 'number' ? "bg-primary-600 text-white" : "bg-white dark:bg-slate-800")}>Number</button>
                                <button onClick={() => setOptions({...options, pageNumberFormat: 'page-of-total'})} className={clsx("flex-1 py-2 rounded-lg border", options.pageNumberFormat === 'page-of-total' ? "bg-primary-600 text-white" : "bg-white dark:bg-slate-800")}>Page X / Y</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* HEADER & FOOTER OPTIONS */}
                {isHeaderFooterTool && (
                    <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Header Text</label>
                            <input type="text" value={options.headerText} onChange={e => setOptions({...options, headerText: e.target.value})} placeholder="Enter header text" className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Footer Text</label>
                            <input type="text" value={options.footerText} onChange={e => setOptions({...options, footerText: e.target.value})} placeholder="Enter footer text" className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Font Size</label>
                            <input type="number" min="8" max="18" value={options.headerFooterSize} onChange={e => setOptions({...options, headerFooterSize: parseInt(e.target.value)})} className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800" />
                        </div>
                    </div>
                )}

                {/* CROP OPTIONS */}
                {isCropTool && (
                    <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Crop Margin (pixels)</label>
                        <input type="number" min="0" max="200" value={options.cropMargin} onChange={e => setOptions({...options, cropMargin: parseInt(e.target.value)})} className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800" />
                        <p className="text-xs text-slate-500 mt-2">Amount to crop from all edges</p>
                    </div>
                )}

                {/* RESIZE OPTIONS */}
                {isResizeTool && (
                    <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Target Page Size</label>
                        <select value={options.resizeTarget} onChange={e => setOptions({...options, resizeTarget: e.target.value})} className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800">
                            <option value="a4">A4</option>
                            <option value="letter">Letter</option>
                            <option value="a3">A3</option>
                            <option value="a5">A5</option>
                        </select>
                    </div>
                )}

                {/* OVERLAY INFO */}
                {isOverlayTool && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-700">
                        <p className="text-sm text-blue-700 dark:text-blue-300">📄 Upload 2 PDFs: First will be the base, second will be overlaid on top with 50% opacity.</p>
                    </div>
                )}

                {/* REPAIR PDF OPTIONS */}
                {isRepairTool && (
                    <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Repair Mode</label>
                            <select value={options.repairMode} onChange={e => setOptions({...options, repairMode: e.target.value})} className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800">
                                <option value="minimal">Minimal - Quick fix</option>
                                <option value="standard">Standard - Balanced</option>
                                <option value="aggressive">Aggressive - Deep repair</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-3">
                            <input type="checkbox" checked={options.removeCorrupted} onChange={e => setOptions({...options, removeCorrupted: e.target.checked})} className="w-4 h-4" />
                            <label className="text-sm text-slate-700 dark:text-slate-300">Remove corrupted pages (add placeholder if unchecked)</label>
                        </div>
                    </div>
                )}

                {/* OCR PDF OPTIONS */}
                {isOcrTool && (
                    <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Language</label>
                            <select value={options.ocrLanguage} onChange={e => setOptions({...options, ocrLanguage: e.target.value})} className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800">
                                <option value="eng">English</option>
                                <option value="spa">Spanish</option>
                                <option value="fra">French</option>
                                <option value="deu">German</option>
                                <option value="chi">Chinese</option>
                                <option value="jpn">Japanese</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-3">
                            <input type="checkbox" checked={options.ocrDeskew} onChange={e => setOptions({...options, ocrDeskew: e.target.checked})} className="w-4 h-4" />
                            <label className="text-sm text-slate-700 dark:text-slate-300">Auto-deskew pages</label>
                        </div>
                        <div className="flex items-center gap-3">
                            <input type="checkbox" checked={options.ocrEnhance} onChange={e => setOptions({...options, ocrEnhance: e.target.checked})} className="w-4 h-4" />
                            <label className="text-sm text-slate-700 dark:text-slate-300">Enhance contrast for better recognition</label>
                        </div>
                        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                            <p className="text-xs text-amber-700 dark:text-amber-300">Note: This is a client-side simulation. For production OCR, server-side processing with Tesseract is recommended.</p>
                        </div>
                    </div>
                )}

                {/* COMPARE PDF INFO */}
                {isCompareTool && (
                    <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Comparison Mode</label>
                            <select value={options.compareMode} onChange={e => setOptions({...options, compareMode: e.target.value})} className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800">
                                <option value="visual">Visual Comparison</option>
                                <option value="text">Text Comparison</option>
                                <option value="both">Both Visual & Text</option>
                            </select>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                            <p className="text-xs text-blue-700 dark:text-blue-300">📄 Upload 2 PDFs to compare. A detailed comparison report will be generated.</p>
                        </div>
                    </div>
                )}

                {/* OPTIMIZE WEB OPTIONS */}
                {isOptimizeWebTool && (
                    <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Compression Level</label>
                            <div className="flex gap-4">
                                {['low', 'medium', 'high'].map(level => (
                                    <button key={level} onClick={() => setOptions({...options, webCompression: level})} className={clsx("flex-1 py-2 rounded-lg border capitalize", options.webCompression === level ? "bg-primary-600 text-white" : "bg-white dark:bg-slate-800")}>{level}</button>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <input type="checkbox" checked={options.embedFonts} onChange={e => setOptions({...options, embedFonts: e.target.checked})} className="w-4 h-4" />
                            <label className="text-sm text-slate-700 dark:text-slate-300">Embed fonts</label>
                        </div>
                        <div className="flex items-center gap-3">
                            <input type="checkbox" checked={options.removeMetadata} onChange={e => setOptions({...options, removeMetadata: e.target.checked})} className="w-4 h-4" />
                            <label className="text-sm text-slate-700 dark:text-slate-300">Remove metadata</label>
                        </div>
                    </div>
                )}

                {/* METADATA EDIT OPTIONS */}
                {isMetaEditTool && (
                    <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Title</label>
                            <input type="text" value={options.metaTitle} onChange={e => setOptions({...options, metaTitle: e.target.value})} placeholder="Document title" className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Author</label>
                            <input type="text" value={options.metaAuthor} onChange={e => setOptions({...options, metaAuthor: e.target.value})} placeholder="Author name" className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Subject</label>
                            <input type="text" value={options.metaSubject} onChange={e => setOptions({...options, metaSubject: e.target.value})} placeholder="Document subject" className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Keywords</label>
                            <input type="text" value={options.metaKeywords} onChange={e => setOptions({...options, metaKeywords: e.target.value})} placeholder="keyword1, keyword2, keyword3" className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800" />
                        </div>
                    </div>
                )}

                {/* VIEWER PREFERENCES OPTIONS */}
                {isViewerPrefsTool && (
                    <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Page Mode</label>
                            <select value={options.viewerPageMode} onChange={e => setOptions({...options, viewerPageMode: e.target.value})} className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800">
                                <option value="UseNone">Default</option>
                                <option value="UseOutlines">Show Bookmarks</option>
                                <option value="UseThumbs">Show Thumbnails</option>
                                <option value="FullScreen">Full Screen</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Page Layout</label>
                            <select value={options.viewerPageLayout} onChange={e => setOptions({...options, viewerPageLayout: e.target.value})} className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800">
                                <option value="SinglePage">Single Page</option>
                                <option value="OneColumn">One Column</option>
                                <option value="TwoColumnLeft">Two Column Left</option>
                                <option value="TwoColumnRight">Two Column Right</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-2">
                                <input type="checkbox" checked={options.viewerFitWindow} onChange={e => setOptions({...options, viewerFitWindow: e.target.checked})} className="w-4 h-4" />
                                <label className="text-sm text-slate-700 dark:text-slate-300">Fit window</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" checked={options.viewerCenterWindow} onChange={e => setOptions({...options, viewerCenterWindow: e.target.checked})} className="w-4 h-4" />
                                <label className="text-sm text-slate-700 dark:text-slate-300">Center window</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" checked={options.viewerHideToolbar} onChange={e => setOptions({...options, viewerHideToolbar: e.target.checked})} className="w-4 h-4" />
                                <label className="text-sm text-slate-700 dark:text-slate-300">Hide toolbar</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" checked={options.viewerHideMenubar} onChange={e => setOptions({...options, viewerHideMenubar: e.target.checked})} className="w-4 h-4" />
                                <label className="text-sm text-slate-700 dark:text-slate-300">Hide menubar</label>
                            </div>
                        </div>
                    </div>
                )}

                {/* BATCH PROCESS OPTIONS */}
                {isBatchProcessTool && (
                    <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Action to Apply</label>
                            <select value={options.batchAction} onChange={e => setOptions({...options, batchAction: e.target.value})} className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800">
                                <option value="compress">Compress All</option>
                                <option value="rotate">Rotate 90° All</option>
                                <option value="watermark">Watermark All</option>
                            </select>
                        </div>
                        {options.batchAction === 'watermark' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Watermark Text</label>
                                <input type="text" value={options.watermarkText} onChange={e => setOptions({...options, watermarkText: e.target.value})} className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800" />
                            </div>
                        )}
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                            <p className="text-xs text-blue-700 dark:text-blue-300">Upload multiple PDFs to process them all at once with the same action.</p>
                        </div>
                    </div>
                )}

                {/* PRINT READY OPTIONS */}
                {isPrintReadyTool && (
                    <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Color Profile</label>
                            <select value={options.printColorProfile} onChange={e => setOptions({...options, printColorProfile: e.target.value})} className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800">
                                <option value="cmyk">CMYK (Print Standard)</option>
                                <option value="grayscale">Grayscale</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Bleed Margin (points)</label>
                            <input type="number" min="0" max="20" value={options.printBleed} onChange={e => setOptions({...options, printBleed: parseInt(e.target.value)})} className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800" />
                        </div>
                        <div className="flex items-center gap-3">
                            <input type="checkbox" checked={options.printCropMarks} onChange={e => setOptions({...options, printCropMarks: e.target.checked})} className="w-4 h-4" />
                            <label className="text-sm text-slate-700 dark:text-slate-300">Add crop marks</label>
                        </div>
                    </div>
                )}

                {/* SHARE LINK OPTIONS */}
                {isShareLinkTool && (
                    <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Link Expiry (minutes)</label>
                            <select value={options.shareExpiry} onChange={e => setOptions({...options, shareExpiry: parseInt(e.target.value)})} className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800">
                                <option value="15">15 minutes</option>
                                <option value="30">30 minutes</option>
                                <option value="60">1 hour</option>
                                <option value="180">3 hours</option>
                                <option value="1440">24 hours</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-3">
                            <input type="checkbox" checked={options.sharePassword} onChange={e => setOptions({...options, sharePassword: e.target.checked})} className="w-4 h-4" />
                            <label className="text-sm text-slate-700 dark:text-slate-300">Require password</label>
                        </div>
                        <div className="flex items-center gap-3">
                            <input type="checkbox" checked={options.shareDownload} onChange={e => setOptions({...options, shareDownload: e.target.checked})} className="w-4 h-4" />
                            <label className="text-sm text-slate-700 dark:text-slate-300">Allow download</label>
                        </div>
                        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                            <p className="text-xs text-amber-700 dark:text-amber-300">⚠️ Client-side demo: Files stored in localStorage. Production version would use secure server storage with automatic deletion.</p>
                        </div>
                    </div>
                )}

                {/* GRAYSCALE PDF OPTIONS */}
                {isGrayscaleTool && (
                    <div className="bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 dark:from-slate-900 dark:via-gray-900 dark:to-zinc-900 p-6 rounded-2xl border-2 border-slate-200 dark:border-slate-700">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="p-3 bg-gradient-to-br from-slate-600 to-gray-700 rounded-xl shadow-lg">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">🎨 Grayscale Conversion</h3>
                                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">Convert your PDF to black & white with professional color algorithms.</p>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Conversion Method</label>
                                <div className="grid grid-cols-1 gap-3">
                                    {[
                                        { value: 'luminosity', label: 'Luminosity', desc: 'Most accurate - preserves perceived brightness' },
                                        { value: 'average', label: 'Average', desc: 'Simple average of RGB values' },
                                        { value: 'desaturate', label: 'Desaturate', desc: 'Balanced between max and min RGB' }
                                    ].map(method => (
                                        <button
                                            key={method.value}
                                            onClick={() => setOptions({...options, grayscaleMethod: method.value})}
                                            className={clsx(
                                                "text-left p-3 rounded-lg border-2 transition-all",
                                                options.grayscaleMethod === method.value
                                                    ? "bg-primary-50 dark:bg-primary-900/20 border-primary-500 shadow-sm"
                                                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 hover:border-primary-300"
                                            )}
                                        >
                                            <div className="font-semibold text-sm text-slate-900 dark:text-white mb-1">{method.label}</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">{method.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Output Quality</label>
                                <div className="flex gap-3">
                                    {['low', 'medium', 'high'].map(q => (
                                        <button
                                            key={q}
                                            onClick={() => setOptions({...options, grayscaleQuality: q})}
                                            className={clsx(
                                                "flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium transition-all capitalize",
                                                options.grayscaleQuality === q
                                                    ? "bg-primary-600 text-white border-primary-600 shadow-lg"
                                                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 hover:border-primary-400"
                                            )}
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                    {options.grayscaleQuality === 'high' && '2.5x resolution - Best for printing'}
                                    {options.grayscaleQuality === 'medium' && '2.0x resolution - Balanced quality'}
                                    {options.grayscaleQuality === 'low' && '1.5x resolution - Smaller file size'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. ROTATE PDF */}
                {tool.id === 'rotate-pdf' && (
                     <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Rotation Angle</label>
                            <div className="flex gap-4">
                                {[90, 180, 270].map(deg => (
                                    <button 
                                        key={deg} 
                                        onClick={() => setOptions({...options, rotation: deg})}
                                        className={clsx(
                                            "flex-1 py-2 rounded-lg border text-sm font-medium transition-colors",
                                            options.rotation === deg 
                                                ? "bg-primary-600 text-white border-primary-600" 
                                                : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-primary-500"
                                        )}
                                    >
                                        {deg}°
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Apply To</label>
                             <div className="flex gap-4 mb-2">
                                <button onClick={() => setOptions({...options, rotateMode: 'all'})} className={clsx("px-3 py-1 rounded text-sm", options.rotateMode === 'all' ? "bg-slate-200 dark:bg-slate-700" : "")}>All Pages</button>
                                <button onClick={() => setOptions({...options, rotateMode: 'specific'})} className={clsx("px-3 py-1 rounded text-sm", options.rotateMode === 'specific' ? "bg-slate-200 dark:bg-slate-700" : "")}>Specific Pages</button>
                             </div>
                             {options.rotateMode === 'specific' && (
                                <input 
                                    type="text" 
                                    placeholder="e.g. 1,3,5-10" 
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                                    value={options.pages}
                                    onChange={e => setOptions({...options, pages: e.target.value})}
                                />
                             )}
                        </div>
                     </div>
                )}
             </div>

             {/* Error Message */}
             {error && (
               <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
                 {error}
               </div>
             )}

             {/* Actions */}
             <div className="flex items-center gap-4">
               <button 
                 onClick={() => { setFiles([]); setResult(null); }}
                 className="px-6 py-3 rounded-xl font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
               >
                 Cancel
               </button>
               <button 
                 onClick={handleProcess}
                 disabled={isProcessing}
                 className="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold shadow-lg shadow-primary-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
               >
                 {isProcessing ? (
                   <>
                    <Loader2 className="animate-spin" /> Processing...
                   </>
                 ) : (
                   <>
                    <Settings size={18} /> {tool.id === 'scan-pdf' ? 'Create PDF' : `Process ${files.length > 1 ? 'Batch' : 'PDF'}`}
                   </>
                 )}
               </button>
             </div>
          </div>
        )}

        {/* State: Result */}
        {result && (
          <div className="flex-1 flex flex-col items-center p-8 animate-fade-in">
             <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-6">
               <CheckCircle size={40} />
             </div>
             <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Success!</h2>
             <p className="text-slate-500 mb-4">Processed {result.length} file{result.length !== 1 ? 's' : ''} successfully.</p>
             
             {/* Compression Stats */}
             {isCompressTool && files[0] && result[0] && (
               <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20 p-8 rounded-2xl border-2 border-green-200 dark:border-green-800 mb-8 max-w-lg shadow-xl">
                 <div className="flex items-center justify-between mb-6">
                   <div className="text-center flex-1">
                     <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Original</p>
                     <p className="text-3xl font-black text-slate-900 dark:text-white">{(files[0].size / 1024).toFixed(1)}</p>
                     <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">KB</p>
                   </div>
                   <div className="flex flex-col items-center px-4">
                     <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                     </svg>
                   </div>
                   <div className="text-center flex-1">
                     <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Optimized</p>
                     <p className="text-3xl font-black text-green-600 dark:text-green-400">{(result[0].data.byteLength / 1024).toFixed(1)}</p>
                     <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">KB</p>
                   </div>
                 </div>
                 <div className="text-center">
                   {result[0].data.byteLength < files[0].size ? (
                     <div className="space-y-3">
                       <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full shadow-lg">
                         <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                         <span className="text-xl font-black">
                           {((1 - result[0].data.byteLength / files[0].size) * 100).toFixed(1)}% Smaller
                         </span>
                       </div>
                       <p className="text-xs text-slate-600 dark:text-slate-400">
                         Saved {((files[0].size - result[0].data.byteLength) / 1024).toFixed(1)} KB • Zero quality loss
                       </p>
                     </div>
                   ) : (
                     <div className="inline-flex items-center gap-2 px-5 py-3 bg-blue-100 dark:bg-blue-900/40 rounded-full">
                       <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/></svg>
                       <span className="font-semibold text-blue-700 dark:text-blue-300 text-sm">
                         Already Optimized
                       </span>
                     </div>
                   )}
                 </div>
               </div>
             )}
             
             {/* Image Preview Grid for PDF to Image conversions */}
             {isPdfToImageTool ? (
               <div className="w-full max-w-6xl">
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                   {result.map((res, i) => {
                     const imageUrl = URL.createObjectURL(res.data);
                     return (
                       <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                         <div className="aspect-[3/4] bg-slate-100 dark:bg-slate-900 relative">
                           <img 
                             src={imageUrl} 
                             alt={res.name}
                             className="w-full h-full object-contain"
                             onLoad={() => URL.revokeObjectURL(imageUrl)}
                           />
                         </div>
                         <div className="p-4 space-y-3">
                           <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{res.name}</p>
                           <button 
                             onClick={() => handleDownload(res)}
                             className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors"
                           >
                             <Download size={16} /> Download
                           </button>
                         </div>
                       </div>
                     );
                   })}
                 </div>
                 <div className="flex gap-4 justify-center">
                   <button 
                     onClick={() => {
                       result.forEach(res => handleDownload(res));
                     }}
                     className="px-6 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:scale-105 transition-transform shadow-lg"
                   >
                     <Download size={18} className="inline mr-2" /> Download All ({result.length})
                   </button>
                   <button onClick={() => { setFiles([]); setResult(null); setOptions({...options, qrText: ''}) }} className="px-6 py-3 rounded-xl border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                     Start Over
                   </button>
                 </div>
               </div>
             ) : (
               /* Default download buttons for non-image conversions */
               <>
                 <div className="flex flex-wrap gap-4 justify-center max-w-2xl mb-8">
                   {result.map((res, i) => (
                     <button 
                      key={i}
                      onClick={() => handleDownload(res)}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:scale-105 transition-transform shadow-lg"
                    >
                      <Download size={18} /> Download {result.length > 1 ? `${i+1}` : ''}
                    </button>
                   ))}
                 </div>
                 <button onClick={() => { setFiles([]); setResult(null); setOptions({...options, qrText: ''}) }} className="text-primary-500 hover:underline">
                   Start Over
                 </button>
               </>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

// 5. HISTORY PAGE
const HistoryPage = () => {
  const [history, setHistory] = useState<any[]>([]);
  useEffect(() => {
    setHistory(JSON.parse(localStorage.getItem('history') || '[]'));
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 dark:text-white">Recent Activity</h1>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
        {history.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No history yet.</div>
        ) : (
          history.map((item, i) => (
            <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                  <Clock size={20} className="text-slate-500" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{item.toolName}</p>
                  <p className="text-xs text-slate-500">{item.fileName} • {new Date(item.timestamp).toLocaleString()}</p>
                </div>
              </div>
              <Link to={`/tool/${item.id}`} className="p-2 text-primary-600 hover:bg-primary-50 rounded-full">
                <ArrowRight size={18} />
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// MAIN LAYOUT
const App = () => {
  const [isDark, setIsDark] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDark]);

  return (
    <HashRouter>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans">
        <Sidebar isOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />
        
        <main className="flex-1 flex flex-col h-screen overflow-y-auto w-full relative">
          <Header 
            toggleTheme={() => setIsDark(!isDark)} 
            isDark={isDark} 
            setMobileMenuOpen={setMobileMenuOpen}
          />
          
          <div className="flex-1 overflow-x-hidden">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/category/:cat" element={<HomePage />} />
              <Route path="/tool/:id" element={<ToolWorkspace />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/favorites" element={<HistoryPage />} />
            </Routes>
          </div>


        </main>
      </div>
    </HashRouter>
  );
};

export default App;