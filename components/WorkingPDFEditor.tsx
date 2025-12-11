import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Save, X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Type, Trash2 } from 'lucide-react';

const pdfJs = (pdfjsLib as any).default || pdfjsLib;
if (pdfJs.GlobalWorkerOptions) {
  pdfJs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
}

interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  page: number;
}

interface WorkingPDFEditorProps {
  file: File;
  onSave: (pdfBytes: Uint8Array) => void;
  onClose: () => void;
}

export const WorkingPDFEditor: React.FC<WorkingPDFEditorProps> = ({ file, onSave, onClose }) => {
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [zoom, setZoom] = useState(1.2);
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAddingText, setIsAddingText] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadPDF();
  }, []);

  useEffect(() => {
    if (pdfDoc) renderPage();
  }, [pdfDoc, currentPage, zoom]);

  const loadPDF = async () => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfJs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
      setNumPages(pdf.numPages);
    } catch (err) {
      console.error('Error loading PDF:', err);
      alert('Failed to load PDF');
    }
  };

  const renderPage = async () => {
    if (!pdfDoc || !canvasRef.current) return;
    
    try {
      const page = await pdfDoc.getPage(currentPage);
      const viewport = page.getViewport({ scale: zoom });
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d')!;
      
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      await page.render({ canvasContext: context, viewport }).promise;
    } catch (err) {
      console.error('Error rendering page:', err);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!isAddingText || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newElement: TextElement = {
      id: Date.now().toString(),
      text: 'New Text',
      x,
      y,
      fontSize: 16,
      page: currentPage
    };
    
    setTextElements([...textElements, newElement]);
    setSelectedId(newElement.id);
    setIsAddingText(false);
  };

  const updateText = (id: string, newText: string) => {
    setTextElements(textElements.map(el => 
      el.id === id ? { ...el, text: newText } : el
    ));
  };

  const deleteElement = (id: string) => {
    setTextElements(textElements.filter(el => el.id !== id));
    setSelectedId(null);
  };

  const handleSave = async () => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = pdfDoc.getPage(pageNum - 1);
        const { height } = page.getSize();
        const pageElements = textElements.filter(el => el.page === pageNum);
        
        pageElements.forEach(el => {
          page.drawText(el.text, {
            x: el.x / zoom,
            y: height - (el.y / zoom),
            size: el.fontSize,
            font,
            color: rgb(0, 0, 0)
          });
        });
      }
      
      const pdfBytes = await pdfDoc.save();
      onSave(pdfBytes);
    } catch (err) {
      console.error('Error saving PDF:', err);
      alert('Failed to save PDF: ' + (err as Error).message);
    }
  };

  const currentPageElements = textElements.filter(el => el.page === currentPage);

  return (
    <div className="fixed inset-0 bg-slate-900 flex flex-col z-50">
      {/* Toolbar */}
      <div className="bg-slate-800 border-b border-slate-700 p-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-white font-semibold text-sm">{file.name}</h2>
          <button
            onClick={() => setIsAddingText(!isAddingText)}
            className={`px-3 py-1.5 rounded text-sm flex items-center gap-2 ${
              isAddingText ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Type size={16} /> {isAddingText ? 'Click PDF to add' : 'Add Text'}
          </button>
          {selectedId && (
            <button
              onClick={() => deleteElement(selectedId)}
              className="px-3 py-1.5 rounded text-sm flex items-center gap-2 bg-red-600 text-white hover:bg-red-700"
            >
              <Trash2 size={16} /> Delete
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={() => setZoom(z => Math.max(0.5, z - 0.2))} className="p-1.5 bg-slate-700 text-white rounded hover:bg-slate-600">
            <ZoomOut size={16} />
          </button>
          <span className="text-white text-sm px-2">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(3, z + 0.2))} className="p-1.5 bg-slate-700 text-white rounded hover:bg-slate-600">
            <ZoomIn size={16} />
          </button>
          
          <div className="w-px h-6 bg-slate-600 mx-2" />
          
          <button onClick={handleSave} className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2 text-sm">
            <Save size={16} /> Save
          </button>
          <button onClick={onClose} className="p-1.5 bg-slate-700 text-white rounded hover:bg-slate-600">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-auto bg-slate-800 p-4">
        <div className="flex justify-center">
          <div 
            ref={containerRef}
            className="relative bg-white shadow-2xl"
            style={{ width: 'fit-content', cursor: isAddingText ? 'crosshair' : 'default' }}
            onClick={handleCanvasClick}
          >
            <canvas ref={canvasRef} className="block" />
            
            {/* Text Overlays */}
            {currentPageElements.map(el => (
              <div
                key={el.id}
                className={`absolute border-2 ${
                  selectedId === el.id ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:border-blue-300 hover:bg-blue-50'
                } cursor-pointer`}
                style={{
                  left: el.x - 2,
                  top: el.y - 2,
                  minWidth: 100,
                  padding: '2px 4px'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedId(el.id);
                }}
              >
                <input
                  type="text"
                  value={el.text}
                  onChange={(e) => updateText(el.id, e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-black"
                  style={{ fontSize: el.fontSize }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Page Navigation */}
      <div className="bg-slate-800 border-t border-slate-700 p-2 flex items-center justify-center gap-3 flex-shrink-0">
        <button 
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="p-1.5 bg-slate-700 text-white rounded hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-white text-sm">
          Page {currentPage} of {numPages}
        </span>
        <button 
          onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
          disabled={currentPage === numPages}
          className="p-1.5 bg-slate-700 text-white rounded hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
