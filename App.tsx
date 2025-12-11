import React, { useState, useEffect, useMemo, useRef } from 'react';
import { HashRouter, Routes, Route, useNavigate, useParams, Link, useSearchParams, useLocation } from 'react-router-dom';
import { ALL_TOOLS } from './constants';
import Sidebar from './components/Sidebar';

import { Search, Sun, Moon, Upload, FileText, ArrowRight, X, Heart, Loader2, CheckCircle, Download, Menu, Clock, Settings, MoveUp, MoveDown, Trash, RefreshCw, Grid2X2, QrCode, FileType, LayoutTemplate, Unlock } from 'lucide-react';
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

  // Levenshtein distance for fuzzy matching
  const levenshtein = (a: string, b: string): number => {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        matrix[i][j] = b.charAt(i - 1) === a.charAt(j - 1)
          ? matrix[i - 1][j - 1]
          : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
      }
    }
    return matrix[b.length][a.length];
  };

  const filteredTools = useMemo(() => {
     if (!query) return [];
     const lowerQ = query.toLowerCase();
     
     return ALL_TOOLS.filter(t => {
       const name = t.name.toLowerCase();
       const desc = t.description.toLowerCase();
       
       // Exact match or contains
       if (name.includes(lowerQ) || desc.includes(lowerQ)) return true;
       
       // Fuzzy match on name words (allow 1-2 character difference)
       const nameWords = name.split(' ');
       const queryWords = lowerQ.split(' ');
       
       for (const qWord of queryWords) {
         if (qWord.length < 3) continue; // Skip very short words
         for (const nWord of nameWords) {
           const distance = levenshtein(qWord, nWord);
           const threshold = qWord.length <= 4 ? 1 : 2; // Allow 1 typo for short words, 2 for longer
           if (distance <= threshold) return true;
         }
       }
       
       return false;
     }).slice(0, 8); // Limit to 8 results for dropdown
  }, [query]);

  const clearSearch = () => {
    setQuery('');
    setIsOpen(false);
    if (location.pathname === '/') setSearchParams({}, { replace: true });
  };

  const handleResultClick = () => {
      setQuery('');
      setIsOpen(false);
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && filteredTools.length === 1) {
      const tool = filteredTools[0];
      navigate(`/tool/${tool.id}`);
      handleResultClick();
    }
  };

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 px-4 lg:px-8 flex items-center justify-between gap-3">
      <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-2 text-slate-600 dark:text-slate-300 flex-shrink-0">
        <Menu size={24} />
      </button>
      
      {/* Smart Search Bar */}
      <div className="relative flex-1 max-w-md" ref={wrapperRef}>
          <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={16} />
              <input 
                  type="text" 
                  placeholder="Search tools..." 
                  value={query}
                  onChange={handleSearchChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                      if (query && location.pathname !== '/') setIsOpen(true);
                  }}
                  className="w-full pl-9 pr-9 py-2 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-transparent focus:border-primary-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all dark:text-white shadow-sm text-sm"
              />
              {query && (
                  <button onClick={clearSearch} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                      <X size={14} />
                  </button>
              )}
          </div>

          {/* Dropdown Results (Not on Home) */}
          {isOpen && location.pathname !== '/' && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl md:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-fade-in z-50 max-h-[70vh] md:max-h-[60vh]">
                  {filteredTools.length > 0 ? (
                      <>
                          <div className="overflow-y-auto py-2">
                              <div className="px-3 md:px-4 py-2 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Jump</div>
                              {filteredTools.map(tool => (
                                  <Link 
                                      key={tool.id} 
                                      to={`/tool/${tool.id}`} 
                                      onClick={handleResultClick}
                                      className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group border-l-2 md:border-l-4 border-transparent hover:border-primary-500"
                                  >
                                      <div className="p-1.5 md:p-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 rounded-lg group-hover:scale-110 transition-transform flex-shrink-0">
                                          <tool.icon size={16} className="md:w-[18px] md:h-[18px]" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                          <h4 className="font-medium text-slate-900 dark:text-white text-xs md:text-sm truncate group-hover:text-primary-600 transition-colors">{tool.name}</h4>
                                          <p className="text-[10px] md:text-xs text-slate-500 truncate hidden sm:block">{tool.description}</p>
                                      </div>
                                      <ArrowRight size={14} className="text-slate-300 group-hover:text-primary-500 -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all hidden md:block" />
                                  </Link>
                              ))}
                          </div>
                          <Link 
                              to={`/?search=${query}`} 
                              onClick={handleResultClick}
                              className="block w-full text-center py-2.5 md:py-3 text-[10px] md:text-xs font-bold text-primary-600 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                              See all results
                          </Link>
                      </>
                  ) : (
                      <div className="p-6 md:p-8 text-center text-slate-500">
                          <Search size={20} className="md:w-6 md:h-6 mx-auto mb-2 opacity-20" />
                          <p className="text-xs md:text-sm">No tools found</p>
                      </div>
                  )}
              </div>
          )}
      </div>
      
      <div className="flex items-center gap-2 flex-shrink-0">
        <button className="hidden sm:flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary-600 px-3 py-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs">A</div>
            <span>Account</span>
        </button>
        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300 flex-shrink-0">
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </header>
  );
};

// 2. TOOL CARD
const ToolCard: React.FC<{ tool: Tool }> = ({ tool }) => (
  <Link to={`/tool/${tool.id}`} className="group relative bg-white dark:bg-slate-800 p-4 md:p-6 rounded-xl md:rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-start gap-3 md:gap-4 h-full active:scale-95">
    {tool.popular && (
      <span className="absolute top-3 right-3 md:top-4 md:right-4 bg-amber-100 text-amber-700 text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded-full uppercase tracking-wide">
        Hot
      </span>
    )}
    <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform duration-300">
      <tool.icon size={24} className="md:w-7 md:h-7" strokeWidth={1.5} />
    </div>
    <div>
      <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-100 mb-1 group-hover:text-primary-600 transition-colors leading-tight">
        {tool.name}
      </h3>
      <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
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
  
  // Levenshtein distance for fuzzy matching
  const levenshtein = (a: string, b: string): number => {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        matrix[i][j] = b.charAt(i - 1) === a.charAt(j - 1)
          ? matrix[i - 1][j - 1]
          : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
      }
    }
    return matrix[b.length][a.length];
  };

  const filteredTools = useMemo(() => {
    let tools = ALL_TOOLS;
    if (cat) tools = tools.filter(t => t.category === cat);
    if (query) {
      const q = query.toLowerCase();
      tools = tools.filter(t => {
        const name = t.name.toLowerCase();
        const desc = t.description.toLowerCase();
        
        // Exact match or contains
        if (name.includes(q) || desc.includes(q)) return true;
        
        // Fuzzy match on name words (allow 1-2 character difference)
        const nameWords = name.split(' ');
        const queryWords = q.split(' ');
        
        for (const qWord of queryWords) {
          if (qWord.length < 3) continue;
          for (const nWord of nameWords) {
            const distance = levenshtein(qWord, nWord);
            const threshold = qWord.length <= 4 ? 1 : 2;
            if (distance <= threshold) return true;
          }
        }
        
        return false;
      });
    }
    return tools;
  }, [query, cat]);

  const categories = Object.values(ToolCategory);

  return (
    <div className="p-4 md:p-6 lg:p-10 max-w-7xl mx-auto space-y-8 md:space-y-12 animate-fade-in">
      {!query && !cat && (
        <div className="text-center space-y-4 md:space-y-6 py-8 md:py-12 px-2">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Every PDF Tool <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-indigo-600">You Need.</span>
          </h1>
          <p className="text-base md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Merge, split, compress, convert, rotate, unlock and watermark PDFs with just a few clicks. 100% Client-side privacy.
          </p>
        </div>
      )}

      {(query || cat) ? (
         <>
           <div className="mb-4 md:mb-6 flex items-center gap-2 text-sm md:text-lg text-slate-600 dark:text-slate-400 px-1">
             {query ? (
                <><span className="text-xs md:text-base">Found {filteredTools.length} tools for</span> "<span className="font-bold text-slate-900 dark:text-white">{query}</span>"</>
             ) : (
                <>
                  <Link to="/" className="hover:text-primary-500 transition-colors text-sm md:text-base">All Tools</Link> 
                  <span>/</span> 
                  <span className="font-bold text-slate-900 dark:text-white text-sm md:text-base">{cat}</span>
                </>
             )}
           </div>
           
           {filteredTools.length > 0 ? (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                 {filteredTools.map(tool => <ToolCard key={tool.id} tool={tool} />)}
               </div>
           ) : (
               <div className="flex flex-col items-center justify-center py-16 md:py-20 text-slate-500 dark:text-slate-400 px-4">
                   <div className="p-3 md:p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-3 md:mb-4">
                       <Search size={28} className="md:w-8 md:h-8" />
                   </div>
                   <p className="text-base md:text-lg font-medium">No tools found for "{query}"</p>
                   <button onClick={() => window.location.href='/'} className="mt-3 md:mt-4 text-sm md:text-base text-primary-600 hover:underline">View all tools</button>
               </div>
           )}
         </>
      ) : (
        categories.map(categoryName => {
          const catTools = ALL_TOOLS.filter(t => t.category === categoryName);
          if (catTools.length === 0) return null;
          return (
            <div key={categoryName} className="space-y-4 md:space-y-6">
              <div className="flex items-center gap-3 md:gap-4 px-1">
                <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-200">{categoryName}</h2>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
                <Link to={`/category/${categoryName}`} className="text-xs md:text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 whitespace-nowrap">
                  View All
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
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
    qrSize: 600,
    qrErrorCorrection: 'H',
    qrIncludeText: true,
    qrColor: '#000000',
    qrBgColor: '#ffffff',
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

      // Auto-detect encrypt/decrypt mode for protect-pdf tool
      if (tool?.id === 'protect-pdf' && newFiles[0]) {
        if (newFiles[0].name.endsWith('.aes256')) {
          setEncryptMode('decrypt');
          setOptions({...options, password: ''}); // Clear password when switching to decrypt
        } else {
          setEncryptMode('encrypt');
          setOptions({...options, password: ''}); // Clear password when switching to encrypt
        }
      }

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
      // Use decrypt-pdf for decrypt mode in protect-pdf tool
      const toolId = (id === 'protect-pdf' && encryptMode === 'decrypt') ? 'decrypt-pdf' : id;
      const res = await processPDF(toolId, files, finalOptions);
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
    URL.revokeObjectURL(url);
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.pdf')) return '📄';
    if (fileName.match(/\.(jpg|jpeg|png|bmp|tiff|webp)$/i)) return '🖼️';
    if (fileName.match(/\.(txt|csv|json|html|xml)$/i)) return '📝';
    if (fileName.match(/\.(doc|docx|ppt|pptx|xls|xlsx)$/i)) return '📊';
    if (fileName.endsWith('.aes256')) return '🔒';
    return '📦';
  };

  const getFileExtension = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toUpperCase();
    return ext || 'FILE';
  };

  if (!tool) return <div className="p-10 text-center">Tool not found</div>;

  const isImageTool = tool.id.includes('to-pdf') && (tool.id.includes('jpg') || tool.id.includes('png') || tool.id.includes('bmp') || tool.id.includes('webp') || tool.id.includes('svg') || tool.id.includes('heic'));
  const isQRTool = tool.id === 'qr-to-pdf';
  const isTextTool = tool.id === 'txt-to-pdf' || tool.id === 'markdown-to-pdf' || tool.id === 'html-to-pdf';
  const isPdfToImageTool = tool.id === 'pdf-to-jpg' || tool.id === 'pdf-to-png' || tool.id === 'pdf-to-bmp' || tool.id === 'pdf-to-tiff';
  const isCompressTool = tool.id === 'compress-pdf';
  const isUnlockTool = tool.id === 'unlock-pdf';
  const isProtectTool = tool.id === 'protect-pdf';
  const [encryptMode, setEncryptMode] = useState<'encrypt' | 'decrypt'>('encrypt');
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
    <div className="max-w-5xl mx-auto p-4 md:p-6 lg:p-12 animate-slide-up">
      {/* Tool Header */}
      <div className="flex items-start justify-between mb-6 md:mb-8 gap-3">
        <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
          <div className="p-3 md:p-4 bg-primary-100 dark:bg-primary-900/40 rounded-xl md:rounded-2xl text-primary-600 dark:text-primary-400 flex-shrink-0">
            <tool.icon size={28} className="md:w-8 md:h-8" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl md:text-3xl font-bold text-slate-900 dark:text-white mb-1 md:mb-2 leading-tight">{tool.name}</h1>
            <p className="text-xs md:text-base text-slate-500 dark:text-slate-400 line-clamp-2">{tool.description}</p>
          </div>
        </div>
        <button onClick={toggleFav} className="p-2 md:p-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0">
          <Heart className={clsx("transition-colors", isFavorite ? "fill-red-500 text-red-500" : "text-slate-400")} />
        </button>
      </div>

      {/* Workspace Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl md:rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-slate-100 dark:border-slate-700 overflow-hidden min-h-[400px] md:min-h-[500px] flex flex-col">
        
        {/* State: Initial Upload OR Input */}
        {!files.length && !isQRTool && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 m-3 md:m-4 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer relative active:scale-[0.99]">
            <input 
              type="file" 
              multiple 
              onChange={handleFileChange} 
              className="absolute inset-0 opacity-0 cursor-pointer" 
              accept={
                 isImageTool ? 'image/jpeg,image/jpg,image/png,image/bmp,image/webp,image/svg+xml,image/heic' :
                 tool.id === 'word-to-pdf' ? '.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
                 tool.id === 'powerpoint-to-pdf' ? '.ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation' :
                 tool.id === 'excel-to-pdf' ? '.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
                 tool.id === 'txt-to-pdf' ? '.txt,text/plain' :
                 tool.id === 'markdown-to-pdf' ? '.md,text/markdown' :
                 tool.id === 'html-to-pdf' ? '.html,.htm,text/html' :
                 isProtectTool ? '.pdf,.aes256,application/pdf,application/octet-stream' :
                 '.pdf,application/pdf'
              } 
            />
            <div className="w-16 h-16 md:w-20 md:h-20 bg-white dark:bg-slate-800 rounded-full shadow-lg flex items-center justify-center mb-4 md:mb-6 text-primary-500">
              <Upload size={28} className="md:w-8 md:h-8" />
            </div>
            <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-2 px-4">Drop files here or tap to upload</h3>
            <p className="text-slate-500 text-xs md:text-sm px-4">Supports multiple files for batch operations</p>
          </div>
        )}

        {/* QR Tool Specific Input */}
        {isQRTool && !result && (
            <div className="flex-1 p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 rounded-3xl border-2 border-indigo-200 dark:border-indigo-800 p-8 shadow-2xl">
                        <div className="flex items-start gap-4 mb-8">
                            <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-xl">
                                <QrCode className="w-10 h-10 text-white" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">QR Code Generator</h2>
                                <p className="text-slate-600 dark:text-slate-300">Create professional QR codes embedded in PDF format</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Input Section */}
                            <div className="space-y-6">
                                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 border border-indigo-200 dark:border-indigo-700 shadow-lg">
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wide">Enter Content</label>
                                    <textarea 
                                        value={options.qrText}
                                        onChange={e => setOptions({...options, qrText: e.target.value})}
                                        className="w-full h-40 p-4 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono text-sm resize-none"
                                        placeholder="Enter URL, text, or any content...\n\nExamples:\n• https://example.com\n• Contact: +1-234-567-8900\n• WiFi:T:WPA;S:NetworkName;P:password;;\n• mailto:hello@example.com"
                                    />
                                    <div className="flex items-center justify-between mt-3">
                                        <span className="text-xs text-slate-500 dark:text-slate-400">{options.qrText.length} characters</span>
                                        {options.qrText && (
                                            <button onClick={() => setOptions({...options, qrText: ''})} className="text-xs text-red-500 hover:text-red-600 font-medium">Clear</button>
                                        )}
                                    </div>
                                </div>

                                {/* Generate Button - Mobile Only (appears after Enter Content) */}
                                <div className="lg:hidden">
                                    <button 
                                        onClick={handleProcess}
                                        disabled={!options.qrText || isProcessing}
                                        className="w-full py-5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white font-black text-lg shadow-2xl hover:shadow-3xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-3 hover:-translate-y-1"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <Loader2 className="animate-spin w-6 h-6" />
                                                Generating QR PDF...
                                            </>
                                        ) : (
                                            <>
                                                <QrCode className="w-6 h-6" />
                                                Generate QR Code PDF
                                            </>
                                        )}
                                    </button>
                                </div>

                                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 border border-indigo-200 dark:border-indigo-700 shadow-lg">
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wide">Smart Templates</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={() => setOptions({...options, qrText: 'https://'})} className="px-3 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-semibold hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">🌐 Website</button>
                                        <button onClick={() => setOptions({...options, qrText: 'mailto:email@example.com?subject=Hello&body=Message'})} className="px-3 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-xs font-semibold hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors">📧 Email</button>
                                        <button onClick={() => setOptions({...options, qrText: 'tel:+1234567890'})} className="px-3 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-semibold hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors">📞 Phone</button>
                                        <button onClick={() => setOptions({...options, qrText: 'SMSTO:+1234567890:Hello!'})} className="px-3 py-2 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded-lg text-xs font-semibold hover:bg-pink-200 dark:hover:bg-pink-900/50 transition-colors">💬 SMS</button>
                                        <button onClick={() => setOptions({...options, qrText: 'https://wa.me/1234567890?text=Hello'})} className="px-3 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-semibold hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors">💚 WhatsApp</button>
                                        <button onClick={() => setOptions({...options, qrText: 'WIFI:T:WPA;S:NetworkName;P:password;;'})} className="px-3 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-lg text-xs font-semibold hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors">📶 WiFi</button>
                                        <button onClick={() => setOptions({...options, qrText: 'BEGIN:VCARD\nVERSION:3.0\nFN:John Doe\nTEL:+1234567890\nEMAIL:john@example.com\nEND:VCARD'})} className="px-3 py-2 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded-lg text-xs font-semibold hover:bg-cyan-200 dark:hover:bg-cyan-900/50 transition-colors">👤 vCard</button>
                                        <button onClick={() => setOptions({...options, qrText: 'geo:37.7749,-122.4194?q=San Francisco'})} className="px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-xs font-semibold hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">📍 Location</button>
                                        <button onClick={() => setOptions({...options, qrText: 'BEGIN:VEVENT\nSUMMARY:Meeting\nDTSTART:20240101T100000\nDTEND:20240101T110000\nLOCATION:Office\nEND:VEVENT'})} className="px-3 py-2 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-lg text-xs font-semibold hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors">📅 Event</button>
                                        <button onClick={() => setOptions({...options, qrText: 'https://www.paypal.me/username/50'})} className="px-3 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg text-xs font-semibold hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors">💳 Payment</button>
                                        <button onClick={() => setOptions({...options, qrText: 'https://twitter.com/username'})} className="px-3 py-2 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 rounded-lg text-xs font-semibold hover:bg-sky-200 dark:hover:bg-sky-900/50 transition-colors">🐦 Twitter</button>
                                        <button onClick={() => setOptions({...options, qrText: 'https://instagram.com/username'})} className="px-3 py-2 bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-300 rounded-lg text-xs font-semibold hover:bg-fuchsia-200 dark:hover:bg-fuchsia-900/50 transition-colors">📸 Instagram</button>
                                    </div>
                                </div>

                                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 border border-indigo-200 dark:border-indigo-700 shadow-lg space-y-4">
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wide">QR Options</label>
                                    
                                    <div>
                                        <label className="block text-xs text-slate-600 dark:text-slate-400 mb-2">Error Correction</label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {['L', 'M', 'Q', 'H'].map(level => (
                                                <button key={level} onClick={() => setOptions({...options, qrErrorCorrection: level})} className={`py-2 rounded-lg text-xs font-semibold transition-colors ${options.qrErrorCorrection === level ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>{level}</button>
                                            ))}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">Higher = more damage resistant</p>
                                    </div>

                                    <div>
                                        <label className="block text-xs text-slate-600 dark:text-slate-400 mb-2">QR Size: {options.qrSize}px</label>
                                        <input type="range" min="200" max="800" step="50" value={options.qrSize} onChange={e => setOptions({...options, qrSize: parseInt(e.target.value)})} className="w-full" />
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" checked={options.qrIncludeText} onChange={e => setOptions({...options, qrIncludeText: e.target.checked})} className="w-4 h-4" />
                                        <label className="text-xs text-slate-700 dark:text-slate-300">Include text below QR code</label>
                                    </div>
                                </div>
                            </div>

                            {/* Preview Section */}
                            <div className="space-y-6">
                                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 border border-indigo-200 dark:border-indigo-700 shadow-lg">
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-wide">Live Preview - Scan This!</label>
                                    <div className="aspect-square bg-white rounded-xl flex items-center justify-center border-2 border-slate-200 dark:border-slate-600 p-4">
                                        {options.qrText ? (
                                            <div className="text-center w-full">
                                                <div className="w-full aspect-square bg-white rounded-lg shadow-xl flex items-center justify-center p-4">
                                                    <canvas 
                                                        ref={(canvas) => {
                                                            if (canvas && options.qrText) {
                                                                import('qrcode').then(QRCode => {
                                                                    QRCode.toCanvas(canvas, options.qrText, {
                                                                        width: 300,
                                                                        margin: 2,
                                                                        errorCorrectionLevel: options.qrErrorCorrection || 'H',
                                                                        color: { dark: '#000000', light: '#FFFFFF' }
                                                                    }).catch(err => console.error('QR Error:', err));
                                                                });
                                                            }
                                                        }}
                                                        className="w-full h-full"
                                                    />
                                                </div>
                                                <p className="text-xs text-green-600 dark:text-green-400 mt-3 font-semibold">✓ Scan this with your phone!</p>
                                            </div>
                                        ) : (
                                            <div className="text-center p-8">
                                                <QrCode className="w-20 h-20 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                                                <p className="text-sm text-slate-400 dark:text-slate-500">Enter content to preview</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                                    <div className="flex items-start gap-3">
                                        <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/></svg>
                                        <div>
                                            <p className="text-xs font-semibold text-amber-900 dark:text-amber-200 mb-1">Pro Tips:</p>
                                            <ul className="text-xs text-amber-800 dark:text-amber-300 space-y-1">
                                                <li>• Keep URLs short for better scanning</li>
                                                <li>• Test QR code before printing</li>
                                                <li>• High contrast works best</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Generate Button - Desktop Only (appears at bottom) */}
                        <div className="mt-8 hidden lg:block">
                            <button 
                                onClick={handleProcess}
                                disabled={!options.qrText || isProcessing}
                                className="w-full py-5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white font-black text-lg shadow-2xl hover:shadow-3xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-3 hover:-translate-y-1"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="animate-spin w-6 h-6" />
                                        Generating QR PDF...
                                    </>
                                ) : (
                                    <>
                                        <QrCode className="w-6 h-6" />
                                        Generate QR Code PDF
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* State: Selected Files & Options */}
        {files.length > 0 && !result && (
          <div className="flex-1 p-4 md:p-6 flex flex-col items-center w-full">
             
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
                             <input type="file" multiple onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/jpeg,image/jpg,image/png,image/bmp,image/webp,image/svg+xml,image/heic" />
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

                {/* PROTECT PDF - Smart Mode Selection */}
                {isProtectTool && (
                  <>
                    {/* Mode Toggle */}
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 mb-6">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Mode</label>
                      <div className="flex gap-3">
                        <button
                          onClick={() => { setEncryptMode('encrypt'); setOptions({...options, password: ''}); }}
                          className={clsx(
                            "flex-1 py-3 px-4 rounded-lg border-2 font-semibold transition-all flex items-center justify-center gap-2",
                            encryptMode === 'encrypt'
                              ? "bg-green-600 text-white border-green-600 shadow-lg"
                              : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-green-400"
                          )}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          Encrypt PDF
                        </button>
                        <button
                          onClick={() => { setEncryptMode('decrypt'); setOptions({...options, password: ''}); }}
                          className={clsx(
                            "flex-1 py-3 px-4 rounded-lg border-2 font-semibold transition-all flex items-center justify-center gap-2",
                            encryptMode === 'decrypt'
                              ? "bg-blue-600 text-white border-blue-600 shadow-lg"
                              : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-blue-400"
                          )}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                          </svg>
                          Decrypt PDF
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
                        {encryptMode === 'encrypt' ? '🔒 Secure your PDF with AES-256 encryption' : '🔓 Decrypt .aes256 or password-protected PDFs'}
                      </p>
                    </div>

                    {/* Encrypt Mode UI */}
                    {encryptMode === 'encrypt' && (
                   <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20 p-8 rounded-2xl border-2 border-green-200 dark:border-green-800 space-y-6">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">🔒 Military-Grade AES-256 Encryption</h3>
                          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">Same encryption used by banks, military, and government agencies worldwide.</p>
                        </div>
                      </div>
                      
                      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm p-6 rounded-xl border border-green-200 dark:border-green-700">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Set Encryption Password</label>
                        <input 
                          type="password" 
                          value={options.password}
                          onChange={e => setOptions({...options, password: e.target.value})}
                          className="w-full px-4 py-3 rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none dark:text-white font-mono text-lg"
                          placeholder="Enter a strong password (min 8 characters)"
                        />
                        {options.password && (
                          <div className="mt-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Password Strength</span>
                              <span className={clsx(
                                "text-xs font-bold",
                                options.password.length < 6 ? "text-red-600" :
                                options.password.length < 8 ? "text-yellow-600" :
                                options.password.length < 12 ? "text-blue-600" : "text-green-600"
                              )}>
                                {options.password.length < 6 ? "Weak" :
                                 options.password.length < 8 ? "Fair" :
                                 options.password.length < 12 ? "Strong" : "Very Strong"}
                              </span>
                            </div>
                            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div className={clsx(
                                "h-full transition-all duration-300 rounded-full",
                                options.password.length < 6 ? "w-1/4 bg-red-500" :
                                options.password.length < 8 ? "w-2/4 bg-yellow-500" :
                                options.password.length < 12 ? "w-3/4 bg-blue-500" : "w-full bg-green-500"
                              )} />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm p-4 rounded-xl border border-green-200 dark:border-green-700">
                          <div className="flex items-center gap-2 mb-2">
                            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                            <span className="font-semibold text-slate-900 dark:text-white text-sm">Security Features</span>
                          </div>
                          <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 ml-7">
                            <li>• AES-256-GCM encryption</li>
                            <li>• Random IV generation</li>
                            <li>• SHA-256 key derivation</li>
                            <li>• Dual-layer protection</li>
                          </ul>
                        </div>
                        
                        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm p-4 rounded-xl border border-green-200 dark:border-green-700">
                          <div className="flex items-center gap-2 mb-2">
                            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/></svg>
                            <span className="font-semibold text-slate-900 dark:text-white text-sm">Password Tips</span>
                          </div>
                          <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 ml-7">
                            <li>• Use 12+ characters</li>
                            <li>• Mix letters, numbers, symbols</li>
                            <li>• Avoid dictionary words</li>
                            <li>• Store in password manager</li>
                          </ul>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                          <div>
                            <p className="text-xs font-semibold text-amber-900 dark:text-amber-200 mb-1">⚠️ CRITICAL WARNING:</p>
                            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                              <strong>Without your password, the file CANNOT be recovered.</strong> AES-256 encryption is unbreakable - even with supercomputers. Save your password securely!
                            </p>
                          </div>
                        </div>
                      </div>
                   </div>
                    )}

                    {/* Decrypt Mode UI */}
                    {encryptMode === 'decrypt' && (
                   <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 p-8 rounded-2xl border-2 border-blue-200 dark:border-blue-800 space-y-6">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">🔓 Decrypt AES-256 Protected PDF</h3>
                          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">Decrypt files protected with military-grade AES-256 encryption or standard PDF passwords.</p>
                        </div>
                      </div>
                      
                      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm p-6 rounded-xl border border-blue-200 dark:border-blue-700">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Enter Decryption Password</label>
                        <input 
                          type="password" 
                          value={options.password}
                          onChange={e => setOptions({...options, password: e.target.value})}
                          className="w-full px-4 py-3 rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:text-white font-mono text-lg"
                          placeholder="Enter the password used to encrypt"
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">💡 Works with both .aes256 encrypted files and standard password-protected PDFs</p>
                      </div>
                      
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/></svg>
                          <div>
                            <p className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-1">Supported Formats:</p>
                            <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
                              <li>• <strong>.aes256</strong> files (AES-256-GCM encrypted)</li>
                              <li>• <strong>.pdf</strong> files (Standard PDF password protection)</li>
                              <li>• Automatically detects encryption type</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                   </div>
                    )}
                  </>
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
             <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4 w-full sm:w-auto">
               <button 
                 onClick={() => { setFiles([]); setResult(null); }}
                 className="px-6 py-3 rounded-xl font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors active:scale-95 order-2 sm:order-1"
               >
                 Cancel
               </button>
               <button 
                 onClick={handleProcess}
                 disabled={isProcessing}
                 className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold shadow-lg shadow-primary-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 order-1 sm:order-2"
               >
                 {isProcessing ? (
                   <>
                    <Loader2 className="animate-spin" size={18} /> <span className="text-sm md:text-base">Processing...</span>
                   </>
                 ) : (
                   <>
                    <Settings size={18} /> <span className="text-sm md:text-base">{tool.id === 'scan-pdf' ? 'Create PDF' : `Process ${files.length > 1 ? 'Batch' : 'PDF'}`}</span>
                   </>
                 )}
               </button>
             </div>
          </div>
        )}

        {/* State: Result */}
        {result && (
          <div className="flex-1 flex flex-col items-center p-6 md:p-8 animate-fade-in">
             <div className="w-16 h-16 md:w-20 md:h-20 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-4 md:mb-6">
               <CheckCircle size={36} className="md:w-10 md:h-10" />
             </div>
             <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-2">Success!</h2>
             <p className="text-sm md:text-base text-slate-500 mb-4 text-center px-4">Processed {result.length} file{result.length !== 1 ? 's' : ''} successfully.</p>
             
             {/* Encrypted File Download - Material Design */}
             {isProtectTool && encryptMode === 'encrypt' && result && result.length > 0 && (
               <div className="w-full max-w-2xl mb-8">
                 <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20 rounded-2xl border-2 border-green-200 dark:border-green-700 overflow-hidden shadow-xl">
                   {/* Header */}
                   <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
                     <div className="flex items-center gap-3 mb-2">
                       <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                         <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                         </svg>
                       </div>
                       <div>
                         <h3 className="text-xl font-bold">Encryption Complete</h3>
                         <p className="text-green-100 text-sm">Your file is now protected with AES-256 encryption</p>
                       </div>
                     </div>
                   </div>
                   
                   {/* File Info */}
                   <div className="p-6 space-y-4">
                     <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-green-200 dark:border-green-700">
                       <div className="flex items-center gap-3 mb-3">
                         <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                           <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                           </svg>
                         </div>
                         <div className="flex-1 min-w-0">
                           <p className="font-semibold text-slate-900 dark:text-white truncate">{result[0].name}</p>
                           <p className="text-xs text-slate-500 dark:text-slate-400">{(result[0].data.byteLength / 1024).toFixed(2)} KB • AES-256-GCM</p>
                         </div>
                       </div>
                       
                       {/* Download Button */}
                       <button
                         onClick={() => handleDownload(result[0])}
                         className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                       >
                         <Download size={20} />
                         Download Encrypted File
                       </button>
                     </div>
                     
                     {/* Security Info */}
                     <div className="grid grid-cols-2 gap-3">
                       <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm p-3 rounded-lg border border-green-200 dark:border-green-700">
                         <div className="flex items-center gap-2 mb-1">
                           <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                           <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Encryption</span>
                         </div>
                         <p className="text-xs text-slate-600 dark:text-slate-400">AES-256-GCM</p>
                       </div>
                       <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm p-3 rounded-lg border border-green-200 dark:border-green-700">
                         <div className="flex items-center gap-2 mb-1">
                           <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                           <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Security</span>
                         </div>
                         <p className="text-xs text-slate-600 dark:text-slate-400">Military Grade</p>
                       </div>
                     </div>
                     
                     {/* Decrypt Instructions */}
                     <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-700">
                       <div className="flex items-start gap-3">
                         <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                         </svg>
                         <div className="flex-1">
                           <h4 className="font-semibold text-blue-900 dark:text-blue-200 text-sm mb-2">To Decrypt This File:</h4>
                           <ol className="text-xs text-blue-800 dark:text-blue-300 space-y-1 mb-3">
                             <li>1. Keep the <strong>.aes256</strong> file safe</li>
                             <li>2. Remember your password (cannot be recovered)</li>
                             <li>3. Use Decrypt mode in this tool</li>
                           </ol>
                           <button
                             onClick={() => { setFiles([]); setResult(null); setEncryptMode('decrypt'); setOptions({...options, password: ''}); }}
                             className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
                           >
                             <Unlock size={14} /> Switch to Decrypt Mode
                           </button>
                         </div>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
             )}
             
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
             
             {/* Universal Material Design Download UI */}
             {result.length > 0 && (
               <div className="w-full max-w-4xl mb-8">
                 <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden shadow-xl">
                   {/* Header */}
                   <div className="bg-gradient-to-r from-primary-600 to-indigo-600 p-6 text-white">
                     <div className="flex items-center gap-3">
                       <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                         <CheckCircle size={24} />
                       </div>
                       <div>
                         <h3 className="text-xl font-bold">Processing Complete</h3>
                         <p className="text-primary-100 text-sm">{result.length} file{result.length > 1 ? 's' : ''} ready to download</p>
                       </div>
                     </div>
                   </div>
                   
                   {/* Files Grid */}
                   <div className="p-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                       {result.map((res, i) => {
                         const isImage = res.type.startsWith('image/');
                         const previewUrl = isImage ? URL.createObjectURL(new Blob([res.data], { type: res.type })) : null;
                         
                         return (
                           <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-shadow">
                             {/* Preview/Icon */}
                             {isImage && previewUrl ? (
                               <div className="aspect-video bg-slate-100 dark:bg-slate-900 relative overflow-hidden">
                                 <img src={previewUrl} alt={res.name} className="w-full h-full object-contain" onLoad={() => URL.revokeObjectURL(previewUrl)} />
                               </div>
                             ) : (
                               <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
                                 <div className="text-center">
                                   <div className="text-6xl mb-2">{getFileIcon(res.name)}</div>
                                   <div className="px-3 py-1 bg-white dark:bg-slate-700 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300">
                                     {getFileExtension(res.name)}
                                   </div>
                                 </div>
                               </div>
                             )}
                             
                             {/* File Info */}
                             <div className="p-4">
                               <p className="font-semibold text-slate-900 dark:text-white truncate mb-1" title={res.name}>{res.name}</p>
                               <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                                 {res.data instanceof Blob ? (res.data.size / 1024).toFixed(2) : (res.data.byteLength / 1024).toFixed(2)} KB
                               </p>
                               
                               {/* Download Button */}
                               <button
                                 onClick={() => handleDownload(res)}
                                 className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                               >
                                 <Download size={16} />
                                 Download
                               </button>
                             </div>
                           </div>
                         );
                       })}
                     </div>
                     
                     {/* Download All Button (if multiple files) */}
                     {result.length > 1 && (
                       <button
                         onClick={() => result.forEach(res => handleDownload(res))}
                         className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl hover:scale-[1.02] transition-transform shadow-lg"
                       >
                         <Download size={20} />
                         Download All ({result.length} files)
                       </button>
                     )}
                   </div>
                 </div>
               </div>
             )}
             
             {/* Start Over Button */}
             <button onClick={() => { setFiles([]); setResult(null); setOptions({...options, qrText: '', password: ''}) }} className="px-6 py-3 text-primary-600 hover:text-primary-700 font-semibold hover:underline transition-colors">
               ← Start Over
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

// 5. HISTORY PAGE
const HistoryPage = () => {
  const location = useLocation();
  const [items, setItems] = useState<any[]>([]);
  const [isHistory, setIsHistory] = useState(location.pathname === '/history');
  
  useEffect(() => {
    const newIsHistory = location.pathname === '/history';
    setIsHistory(newIsHistory);
    
    try {
      if (newIsHistory) {
        const history = JSON.parse(localStorage.getItem('history') || '[]');
        setItems(history);
      } else {
        const favs = JSON.parse(localStorage.getItem('favs') || '[]');
        const favoriteTools = favs.map((id: string) => ALL_TOOLS.find(t => t.id === id)).filter(Boolean);
        setItems(favoriteTools);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setItems([]);
    }
  }, [location.pathname]);

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          {isHistory ? '🕐 Recent Activity' : '❤️ Favorite Tools'}
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          {isHistory ? 'Your recently used tools' : 'Quick access to your favorite tools'}
        </p>
      </div>

      {/* Content */}
      {isHistory ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700 shadow-sm">
          {items.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock size={32} className="text-slate-400" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">No history yet</p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Start using tools to see your activity here</p>
            </div>
          ) : (
            items.map((item, i) => (
              <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 transition-colors">
                    <Clock size={20} className="text-slate-500 group-hover:text-primary-600 transition-colors" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{item.toolName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.fileName} • {new Date(item.timestamp).toLocaleString()}</p>
                  </div>
                </div>
                <Link to={`/tool/${item.id}`} className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-full transition-colors">
                  <ArrowRight size={18} />
                </Link>
              </div>
            ))
          )}
        </div>
      ) : (
        items.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart size={32} className="text-slate-400" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">No favorites yet</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Click the heart icon on any tool to add it here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((tool: any) => tool && <ToolCard key={tool.id} tool={tool} />)}
          </div>
        )
      )}
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