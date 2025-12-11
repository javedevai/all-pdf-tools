import React, { useState, useRef, useEffect } from 'react';
import { Type, Square, Circle, Minus, Highlighter, Eraser, MousePointer, Image as ImageIcon, Save, Undo, Redo, ZoomIn, ZoomOut, Trash2, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';

const pdfJs = (pdfjsLib as any).default || pdfjsLib;
if (pdfJs.GlobalWorkerOptions) {
  pdfJs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
}

interface EditorElement {
  id: string;
  type: 'text' | 'rectangle' | 'circle' | 'line' | 'highlight' | 'image';
  x: number;
  y: number;
  width?: number;
  height?: number;
  x2?: number;
  y2?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  align?: 'left' | 'center' | 'right';
  opacity?: number;
  rotation?: number;
  imageData?: string;
}

interface PDFEditorProps {
  file: File;
  onSave: (pdfBytes: Uint8Array) => void;
  onClose: () => void;
}

export const PDFEditor: React.FC<PDFEditorProps> = ({ file, onSave, onClose }) => {
  const [pages, setPages] = useState<HTMLCanvasElement[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [tool, setTool] = useState<'select' | 'text' | 'rectangle' | 'circle' | 'line' | 'highlight' | 'eraser' | 'image'>('select');
  const [elements, setElements] = useState<Record<number, EditorElement[]>>({});
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [history, setHistory] = useState<Record<number, EditorElement[]>[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [textInput, setTextInput] = useState('');
  const [fontSize, setFontSize] = useState(16);
  const [color, setColor] = useState('#000000');
  const [backgroundColor, setBackgroundColor] = useState('#ffff00');
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);
  const [align, setAlign] = useState<'left' | 'center' | 'right'>('left');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadPDF();
  }, [file]);

  useEffect(() => {
    renderPage();
  }, [currentPage, elements, selectedElement, zoom]);

  const loadPDF = async () => {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfJs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    const canvases: HTMLCanvasElement[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext('2d');
      await page.render({ canvasContext: context!, viewport }).promise;
      canvases.push(canvas);
    }
    setPages(canvases);
    setElements(canvases.reduce((acc, _, i) => ({ ...acc, [i]: [] }), {}));
  };

  const renderPage = () => {
    if (!canvasRef.current || !pages[currentPage]) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const pageCanvas = pages[currentPage];
    
    canvas.width = pageCanvas.width * zoom;
    canvas.height = pageCanvas.height * zoom;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(pageCanvas, 0, 0, canvas.width, canvas.height);
    
    const pageElements = elements[currentPage] || [];
    pageElements.forEach(el => {
      ctx.save();
      
      if (el.rotation) {
        ctx.translate((el.x + (el.width || 0) / 2) * zoom, (el.y + (el.height || 0) / 2) * zoom);
        ctx.rotate((el.rotation * Math.PI) / 180);
        ctx.translate(-(el.x + (el.width || 0) / 2) * zoom, -(el.y + (el.height || 0) / 2) * zoom);
      }
      
      if (el.type === 'text') {
        ctx.font = `${el.italic ? 'italic ' : ''}${el.bold ? 'bold ' : ''}${(el.fontSize || 16) * zoom}px ${el.fontFamily || 'Arial'}`;
        ctx.fillStyle = el.color || '#000000';
        ctx.textAlign = el.align || 'left';
        ctx.fillText(el.text || '', el.x * zoom, el.y * zoom);
        if (el.underline) {
          const metrics = ctx.measureText(el.text || '');
          ctx.strokeStyle = el.color || '#000000';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(el.x * zoom, (el.y + 2) * zoom);
          ctx.lineTo((el.x + metrics.width / zoom) * zoom, (el.y + 2) * zoom);
          ctx.stroke();
        }
      } else if (el.type === 'rectangle') {
        ctx.fillStyle = el.backgroundColor || 'transparent';
        ctx.strokeStyle = el.color || '#000000';
        ctx.lineWidth = 2;
        ctx.fillRect(el.x * zoom, el.y * zoom, (el.width || 0) * zoom, (el.height || 0) * zoom);
        ctx.strokeRect(el.x * zoom, el.y * zoom, (el.width || 0) * zoom, (el.height || 0) * zoom);
      } else if (el.type === 'circle') {
        ctx.fillStyle = el.backgroundColor || 'transparent';
        ctx.strokeStyle = el.color || '#000000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc((el.x + (el.width || 0) / 2) * zoom, (el.y + (el.height || 0) / 2) * zoom, ((el.width || 0) / 2) * zoom, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      } else if (el.type === 'line') {
        ctx.strokeStyle = el.color || '#000000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(el.x * zoom, el.y * zoom);
        ctx.lineTo((el.x2 || 0) * zoom, (el.y2 || 0) * zoom);
        ctx.stroke();
      } else if (el.type === 'highlight') {
        ctx.fillStyle = el.backgroundColor || 'rgba(255, 255, 0, 0.3)';
        ctx.fillRect(el.x * zoom, el.y * zoom, (el.width || 0) * zoom, (el.height || 0) * zoom);
      } else if (el.type === 'image' && el.imageData) {
        const img = new Image();
        img.src = el.imageData;
        ctx.drawImage(img, el.x * zoom, el.y * zoom, (el.width || 0) * zoom, (el.height || 0) * zoom);
      }
      
      if (selectedElement === el.id) {
        ctx.strokeStyle = '#0066ff';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect((el.x - 5) * zoom, (el.y - 5) * zoom, ((el.width || 0) + 10) * zoom, ((el.height || 0) + 10) * zoom);
        ctx.setLineDash([]);
      }
      
      ctx.restore();
    });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    
    setStartPos({ x, y });
    
    if (tool === 'select') {
      const clicked = (elements[currentPage] || []).find(el => 
        x >= el.x && x <= el.x + (el.width || 0) && y >= el.y && y <= el.y + (el.height || 0)
      );
      setSelectedElement(clicked?.id || null);
      return;
    }
    
    if (tool === 'text') {
      if (!textInput.trim()) {
        alert('Please enter text first');
        return;
      }
      const newEl: EditorElement = {
        id: Date.now().toString(),
        type: 'text',
        x,
        y,
        text: textInput,
        fontSize,
        color,
        bold,
        italic,
        underline,
        align
      };
      const newElements = [...(elements[currentPage] || []), newEl];
      setElements({ ...elements, [currentPage]: newElements });
      setTimeout(() => addToHistory(), 0);
      return;
    }
    
    if (tool === 'eraser') {
      const clicked = (elements[currentPage] || []).find(el => 
        x >= el.x && x <= el.x + (el.width || 0) && y >= el.y && y <= el.y + (el.height || 0)
      );
      if (clicked) {
        const newElements = (elements[currentPage] || []).filter(el => el.id !== clicked.id);
        setElements({ ...elements, [currentPage]: newElements });
        setTimeout(() => addToHistory(), 0);
      }
      return;
    }
    
    if (['rectangle', 'circle', 'line', 'highlight'].includes(tool)) {
      setIsDrawing(true);
      const newEl: EditorElement = {
        id: 'temp',
        type: tool as any,
        x,
        y,
        width: 0,
        height: 0,
        x2: x,
        y2: y,
        color,
        backgroundColor: tool === 'highlight' ? 'rgba(255, 255, 0, 0.3)' : backgroundColor
      };
      setElements({ ...elements, [currentPage]: [...(elements[currentPage] || []), newEl] });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    
    const tempElements = [...(elements[currentPage] || [])];
    const lastEl = tempElements[tempElements.length - 1];
    
    if (lastEl && lastEl.id === 'temp') {
      if (tool === 'line') {
        lastEl.x2 = x;
        lastEl.y2 = y;
      } else {
        lastEl.width = Math.abs(x - startPos.x);
        lastEl.height = Math.abs(y - startPos.y);
        lastEl.x = Math.min(startPos.x, x);
        lastEl.y = Math.min(startPos.y, y);
      }
      setElements({ ...elements, [currentPage]: tempElements });
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    const tempElements = [...(elements[currentPage] || [])];
    const lastEl = tempElements[tempElements.length - 1];
    
    if (lastEl && lastEl.id === 'temp') {
      const hasSize = (lastEl.width && Math.abs(lastEl.width) > 5) || (lastEl.height && Math.abs(lastEl.height) > 5);
      if (hasSize || tool === 'line') {
        lastEl.id = Date.now().toString();
        setElements({ ...elements, [currentPage]: tempElements });
        setTimeout(() => addToHistory(), 0);
      } else {
        tempElements.pop();
        setElements({ ...elements, [currentPage]: tempElements });
      }
    }
  };



  const addToHistory = () => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(JSON.parse(JSON.stringify(elements)));
      setHistoryIndex(newHistory.length - 1);
      return newHistory;
    });
  };
  
  useEffect(() => {
    if (history.length === 0 && pages.length > 0) {
      setHistory([JSON.parse(JSON.stringify(elements))]);
      setHistoryIndex(0);
    }
  }, [pages]);

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setElements(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setElements(history[historyIndex + 1]);
    }
  };

  const deleteSelected = () => {
    if (!selectedElement) return;
    const filtered = (elements[currentPage] || []).filter(el => el.id !== selectedElement);
    setElements({ ...elements, [currentPage]: filtered });
    setSelectedElement(null);
    addToHistory();
  };

  const handleSave = async () => {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    for (let pageNum = 0; pageNum < pages.length; pageNum++) {
      const page = pdfDoc.getPage(pageNum);
      const { height } = page.getSize();
      const pageElements = elements[pageNum] || [];
      
      for (const el of pageElements) {
        const yPos = height - el.y;
        
        if (el.type === 'text') {
          page.drawText(el.text || '', {
            x: el.x,
            y: yPos,
            size: el.fontSize || 16,
            font: el.bold ? boldFont : font,
            color: rgb(
              parseInt(el.color?.slice(1, 3) || '00', 16) / 255,
              parseInt(el.color?.slice(3, 5) || '00', 16) / 255,
              parseInt(el.color?.slice(5, 7) || '00', 16) / 255
            )
          });
        } else if (el.type === 'rectangle') {
          page.drawRectangle({
            x: el.x,
            y: yPos - (el.height || 0),
            width: el.width || 0,
            height: el.height || 0,
            borderColor: rgb(
              parseInt(el.color?.slice(1, 3) || '00', 16) / 255,
              parseInt(el.color?.slice(3, 5) || '00', 16) / 255,
              parseInt(el.color?.slice(5, 7) || '00', 16) / 255
            ),
            borderWidth: 2
          });
        } else if (el.type === 'line') {
          page.drawLine({
            start: { x: el.x, y: yPos },
            end: { x: el.x2 || 0, y: height - (el.y2 || 0) },
            thickness: 2,
            color: rgb(
              parseInt(el.color?.slice(1, 3) || '00', 16) / 255,
              parseInt(el.color?.slice(3, 5) || '00', 16) / 255,
              parseInt(el.color?.slice(5, 7) || '00', 16) / 255
            )
          });
        }
      }
    }
    
    const pdfBytes = await pdfDoc.save();
    onSave(pdfBytes);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex">
      <div className="bg-white dark:bg-slate-900 w-full h-full flex flex-col">
        <div className="bg-slate-100 dark:bg-slate-800 p-4 flex items-center justify-between border-b">
          <h2 className="text-xl font-bold">PDF Editor - {file.name}</h2>
          <div className="flex gap-2">
            <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2">
              <Save size={18} /> Save
            </button>
            <button onClick={onClose} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Close</button>
          </div>
        </div>
        
        <div className="flex flex-1 overflow-hidden">
          <div className="w-64 bg-slate-50 dark:bg-slate-800 p-4 overflow-y-auto border-r">
            <div className="space-y-4">
              <div>
                <h3 className="font-bold mb-2">Tools</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'select', icon: MousePointer, label: 'Select' },
                    { id: 'text', icon: Type, label: 'Text' },
                    { id: 'rectangle', icon: Square, label: 'Rectangle' },
                    { id: 'circle', icon: Circle, label: 'Circle' },
                    { id: 'line', icon: Minus, label: 'Line' },
                    { id: 'highlight', icon: Highlighter, label: 'Highlight' },
                    { id: 'eraser', icon: Eraser, label: 'Eraser' },
                    { id: 'image', icon: ImageIcon, label: 'Image' }
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTool(t.id as any)}
                      className={`p-3 rounded flex flex-col items-center gap-1 ${tool === t.id ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-700 hover:bg-slate-100'}`}
                    >
                      <t.icon size={20} />
                      <span className="text-xs">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {tool === 'text' && (
                <div>
                  <h3 className="font-bold mb-2">Text Options</h3>
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Enter text..."
                    className="w-full p-2 border rounded mb-2"
                  />
                  <input
                    type="number"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full p-2 border rounded mb-2"
                    placeholder="Font size"
                  />
                  <div className="flex gap-2 mb-2">
                    <button onClick={() => setBold(!bold)} className={`p-2 rounded ${bold ? 'bg-blue-600 text-white' : 'bg-white'}`}><Bold size={18} /></button>
                    <button onClick={() => setItalic(!italic)} className={`p-2 rounded ${italic ? 'bg-blue-600 text-white' : 'bg-white'}`}><Italic size={18} /></button>
                    <button onClick={() => setUnderline(!underline)} className={`p-2 rounded ${underline ? 'bg-blue-600 text-white' : 'bg-white'}`}><Underline size={18} /></button>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setAlign('left')} className={`p-2 rounded ${align === 'left' ? 'bg-blue-600 text-white' : 'bg-white'}`}><AlignLeft size={18} /></button>
                    <button onClick={() => setAlign('center')} className={`p-2 rounded ${align === 'center' ? 'bg-blue-600 text-white' : 'bg-white'}`}><AlignCenter size={18} /></button>
                    <button onClick={() => setAlign('right')} className={`p-2 rounded ${align === 'right' ? 'bg-blue-600 text-white' : 'bg-white'}`}><AlignRight size={18} /></button>
                  </div>
                </div>
              )}
              
              <div>
                <h3 className="font-bold mb-2">Colors</h3>
                <div className="space-y-2">
                  <div>
                    <label className="text-sm">Stroke</label>
                    <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-full h-10 rounded" />
                  </div>
                  <div>
                    <label className="text-sm">Fill</label>
                    <input type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} className="w-full h-10 rounded" />
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-bold mb-2">Actions</h3>
                <div className="space-y-2">
                  <button onClick={undo} disabled={historyIndex <= 0} className="w-full p-2 bg-white dark:bg-slate-700 rounded flex items-center gap-2 justify-center hover:bg-slate-100 disabled:opacity-50">
                    <Undo size={18} /> Undo
                  </button>
                  <button onClick={redo} disabled={historyIndex >= history.length - 1} className="w-full p-2 bg-white dark:bg-slate-700 rounded flex items-center gap-2 justify-center hover:bg-slate-100 disabled:opacity-50">
                    <Redo size={18} /> Redo
                  </button>
                  <button onClick={deleteSelected} disabled={!selectedElement} className="w-full p-2 bg-red-600 text-white rounded flex items-center gap-2 justify-center hover:bg-red-700 disabled:opacity-50">
                    <Trash2 size={18} /> Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto bg-slate-200 dark:bg-slate-900 p-8" ref={containerRef}>
            <div className="flex justify-center mb-4 gap-2">
              <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="p-2 bg-white rounded"><ZoomOut size={18} /></button>
              <span className="p-2 bg-white rounded">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(3, z + 0.1))} className="p-2 bg-white rounded"><ZoomIn size={18} /></button>
            </div>
            <div className="flex justify-center">
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                className="border shadow-lg bg-white cursor-crosshair"
              />
            </div>
            <div className="flex justify-center mt-4 gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0} className="px-4 py-2 bg-white rounded disabled:opacity-50">Previous</button>
              <span className="px-4 py-2 bg-white rounded">Page {currentPage + 1} / {pages.length}</span>
              <button onClick={() => setCurrentPage(p => Math.min(pages.length - 1, p + 1))} disabled={currentPage === pages.length - 1} className="px-4 py-2 bg-white rounded disabled:opacity-50">Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
