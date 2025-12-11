import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Save, X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Type } from 'lucide-react';

const pdfJs = (pdfjsLib as any).default || pdfjsLib;
if (pdfJs.GlobalWorkerOptions) {
  pdfJs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
}

interface TextBox {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  page: number;
}

interface SimplePDFEditorProps {
  file: File;
  onSave: (pdfBytes: Uint8Array) => void;
  onClose: () => void;
}

export const SimplePDFEditor: React.FC<SimplePDFEditorProps> = ({ file, onSave, onClose }) => {
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [zoom, setZoom] = useState(1.5);
  const [textBoxes, setTextBoxes] = useState<TextBox[]>([]);
  const [selectedBox, setSelectedBox] = useState<string | null>(null);
  const [isAddingText, setIsAddingText] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (file) {
      loadPDF().catch(err => {
        console.error('Failed to load PDF:', err);
        alert('Failed to load PDF: ' + err.message);
      });
    }
  }, [file]);

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
    
    // Extract text positions
    const boxes: TextBox[] = [];
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const viewport = page.getViewport({ scale: 1.5 });
      
      textContent.items.forEach((item: any, idx: number) => {
        if (item.str.trim()) {
          const transform = item.transform;
          boxes.push({
            id: `${pageNum}-${idx}`,
            text: item.str,
            x: transform[4],
            y: viewport.height - transform[5],
            width: item.width,
            height: item.height,
            fontSize: Math.abs(transform[0]),
            page: pageNum
          });
        }
      });
    }
      setTextBoxes(boxes);
    } catch (err) {
      console.error('Error loading PDF:', err);
      throw err;
    }
  };

  const renderPage = async () => {
    if (!pdfDoc || !canvasRef.current) return;
    
    const page = await pdfDoc.getPage(currentPage);
    const viewport = page.getViewport({ scale: zoom });
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d')!;
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    await page.render({ canvasContext: context, viewport }).promise;
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAddingText) return;
    
    const rect = containerRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left);
    const y = (e.clientY - rect.top);
    
    const newBox: TextBox = {
      id: `new-${Date.now()}`,
      text: 'Click to edit',
      x,
      y,
      width: 150,
      height: 20,
      fontSize: 16,
      page: currentPage
    };
    
    setTextBoxes([...textBoxes, newBox]);
    setSelectedBox(newBox.id);
    setIsAddingText(false);
  };

  const handleTextChange = (id: string, newText: string) => {
    setTextBoxes(textBoxes.map(box => 
      box.id === id ? { ...box, text: newText } : box
    ));
  };

  const handleSave = async () => {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    // Group text boxes by page
    const boxesByPage: Record<number, TextBox[]> = {};
    textBoxes.forEach(box => {
      if (!boxesByPage[box.page]) boxesByPage[box.page] = [];
      boxesByPage[box.page].push(box);
    });
    
    // Draw text boxes on each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = pdfDoc.getPage(pageNum - 1);
      const { height } = page.getSize();
      const boxes = boxesByPage[pageNum] || [];
      
      boxes.forEach(box => {
        page.drawText(box.text, {
          x: box.x / zoom,
          y: height - (box.y / zoom),
          size: box.fontSize,
          font,
          color: rgb(0, 0, 0)
        });
      });
    }
    
    const pdfBytes = await pdfDoc.save();
    onSave(pdfBytes);
  };

  const pageBoxes = textBoxes.filter(box => box.page === currentPage);

  return (
    <div className="fixed inset-0 bg-slate-900 flex flex-col">
      {/* Toolbar */}
      <div className="bg-slate-800 border-b border-slate-700 p-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-white font-semibold">{file.name}</h2>
          <button
            onClick={() => setIsAddingText(!isAddingText)}
            className={`px-4 py-2 rounded flex items-center gap-2 ${isAddingText ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            <Type size={18} /> Add Text
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className="p-2 bg-slate-700 text-white rounded hover:bg-slate-600">
            <ZoomOut size={18} />
          </button>
          <span className="text-white px-3">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="p-2 bg-slate-700 text-white rounded hover:bg-slate-600">
            <ZoomIn size={18} />
          </button>
          
          <div className="w-px h-6 bg-slate-600 mx-2" />
          
          <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2">
            <Save size={18} /> Save
          </button>
          <button onClick={onClose} className="p-2 bg-slate-700 text-white rounded hover:bg-slate-600">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex-1 overflow-auto bg-slate-800 p-8">
        <div className="max-w-5xl mx-auto">
          <div 
            ref={containerRef}
            className="relative bg-white shadow-2xl mx-auto"
            style={{ width: 'fit-content' }}
            onClick={handleCanvasClick}
          >
            <canvas ref={canvasRef} className="block" />
            
            {/* Editable Text Overlays */}
            {pageBoxes.map(box => (
              <div
                key={box.id}
                className={`absolute cursor-text bg-yellow-100 bg-opacity-20 hover:bg-opacity-40 ${selectedBox === box.id ? 'ring-2 ring-blue-500 bg-opacity-60' : ''}`}
                style={{
                  left: box.x,
                  top: box.y,
                  width: Math.max(box.width, 100),
                  minHeight: box.height,
                  fontSize: box.fontSize,
                  lineHeight: `${box.height}px`
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedBox(box.id);
                }}
              >
                <input
                  type="text"
                  value={box.text}
                  onChange={(e) => handleTextChange(box.id, e.target.value)}
                  className="w-full h-full bg-transparent border-none outline-none px-1 text-black"
                  style={{ fontSize: box.fontSize }}
                  autoFocus={selectedBox === box.id}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Page Navigation */}
      <div className="bg-slate-800 border-t border-slate-700 p-3 flex items-center justify-center gap-4">
        <button 
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="p-2 bg-slate-700 text-white rounded hover:bg-slate-600 disabled:opacity-50"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-white">
          Page {currentPage} of {numPages}
        </span>
        <button 
          onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
          disabled={currentPage === numPages}
          className="p-2 bg-slate-700 text-white rounded hover:bg-slate-600 disabled:opacity-50"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};
