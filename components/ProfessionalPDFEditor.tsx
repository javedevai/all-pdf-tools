import React, { useState, useRef, useEffect } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { Type, Square, Circle, Minus, Highlighter, Eraser, MousePointer, ZoomIn, ZoomOut, Download, Undo, Redo } from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

type Tool = 'select' | 'text' | 'rectangle' | 'circle' | 'line' | 'highlight' | 'eraser';

interface Annotation {
  id: string;
  type: Tool;
  page: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  x2?: number;
  y2?: number;
  text?: string;
  fontSize?: number;
  color: string;
  strokeWidth?: number;
}

interface ProfessionalPDFEditorProps {
  file: File;
  onSave: (blob: Blob) => void;
  onClose: () => void;
}

const ProfessionalPDFEditor: React.FC<ProfessionalPDFEditorProps> = ({ file, onSave, onClose }) => {
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pdfLibDoc, setPdfLibDoc] = useState<PDFDocument | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pageHeight, setPageHeight] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [tool, setTool] = useState<Tool>('text');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [history, setHistory] = useState<Annotation[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const [color, setColor] = useState('#FF0000');
  const [fontSize, setFontSize] = useState(20);
  const [strokeWidth, setStrokeWidth] = useState(3);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const loadPDF = async () => {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      
      const pdfLibDocument = await PDFDocument.load(arrayBuffer);
      setPdfLibDoc(pdfLibDocument);
    };
    loadPDF();
  }, [file]);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    
    const renderPage = async () => {
      const page = await pdfDoc.getPage(currentPage);
      const viewport = page.getViewport({ scale: zoom });
      
      const canvas = canvasRef.current!;
      const context = canvas.getContext('2d')!;
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      setPageHeight(viewport.height / zoom);
      
      await page.render({ canvasContext: context, viewport }).promise;
      renderAnnotations();
    };
    
    renderPage();
  }, [pdfDoc, currentPage, zoom]);

  const renderAnnotations = () => {
    if (!overlayRef.current || !canvasRef.current) return;
    
    const canvas = overlayRef.current;
    const ctx = canvas.getContext('2d')!;
    canvas.width = canvasRef.current.width;
    canvas.height = canvasRef.current.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    annotations.filter(ann => ann.page === currentPage).forEach(ann => {
      ctx.strokeStyle = ann.color;
      ctx.fillStyle = ann.color;
      ctx.lineWidth = (ann.strokeWidth || 2) * zoom;
        
      if (selectedAnnotation === ann.id) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = ((ann.strokeWidth || 2) + 2) * zoom;
      }
        
      switch (ann.type) {
        case 'text':
          ctx.font = `${ann.fontSize! * zoom}px Arial`;
          ctx.fillText(ann.text || '', ann.x * zoom, ann.y * zoom);
          break;
        case 'rectangle':
          ctx.strokeRect(ann.x * zoom, ann.y * zoom, ann.width! * zoom, ann.height! * zoom);
          break;
        case 'circle':
          ctx.beginPath();
          ctx.ellipse((ann.x + ann.width! / 2) * zoom, (ann.y + ann.height! / 2) * zoom, (ann.width! / 2) * zoom, (ann.height! / 2) * zoom, 0, 0, 2 * Math.PI);
          ctx.stroke();
          break;
        case 'line':
          ctx.beginPath();
          ctx.moveTo(ann.x * zoom, ann.y * zoom);
          ctx.lineTo(ann.x2! * zoom, ann.y2! * zoom);
          ctx.stroke();
          break;
        case 'highlight':
          ctx.globalAlpha = 0.3;
          ctx.fillRect(ann.x * zoom, ann.y * zoom, ann.width! * zoom, ann.height! * zoom);
          ctx.globalAlpha = 1;
          break;
      }
    });
  };

  useEffect(() => {
    renderAnnotations();
  }, [annotations, selectedAnnotation, zoom, currentPage]);

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = overlayRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    
    if (tool === 'select') {
      const clicked = annotations.find(ann => 
        ann.page === currentPage &&
        pos.x >= ann.x && pos.x <= ann.x + (ann.width || 0) &&
        pos.y >= ann.y && pos.y <= ann.y + (ann.height || 0)
      );
      setSelectedAnnotation(clicked?.id || null);
      return;
    }
    
    if (tool === 'eraser') {
      const toRemove = annotations.find(ann => 
        ann.page === currentPage &&
        pos.x >= ann.x && pos.x <= ann.x + (ann.width || 0) &&
        pos.y >= ann.y && pos.y <= ann.y + (ann.height || 0)
      );
      if (toRemove) {
        const newAnnotations = annotations.filter(a => a.id !== toRemove.id);
        setAnnotations(newAnnotations);
        addToHistory(newAnnotations);
      }
      return;
    }
    
    if (tool === 'text') {
      const text = prompt('Enter text:');
      if (text) {
        const newAnnotation: Annotation = {
          id: Date.now().toString(),
          type: 'text',
          page: currentPage,
          x: pos.x,
          y: pos.y,
          text,
          fontSize,
          color,
        };
        const newAnnotations = [...annotations, newAnnotation];
        setAnnotations(newAnnotations);
        addToHistory(newAnnotations);
      }
      return;
    }
    
    setStartPos(pos);
    setIsDrawing(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const pos = getMousePos(e);
    renderAnnotations();
    
    const ctx = overlayRef.current!.getContext('2d')!;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = strokeWidth * zoom;
    
    switch (tool) {
      case 'rectangle':
        ctx.strokeRect(startPos.x * zoom, startPos.y * zoom, (pos.x - startPos.x) * zoom, (pos.y - startPos.y) * zoom);
        break;
      case 'circle':
        const rx = Math.abs(pos.x - startPos.x) / 2;
        const ry = Math.abs(pos.y - startPos.y) / 2;
        ctx.beginPath();
        ctx.ellipse((startPos.x + rx) * zoom, (startPos.y + ry) * zoom, rx * zoom, ry * zoom, 0, 0, 2 * Math.PI);
        ctx.stroke();
        break;
      case 'line':
        ctx.beginPath();
        ctx.moveTo(startPos.x * zoom, startPos.y * zoom);
        ctx.lineTo(pos.x * zoom, pos.y * zoom);
        ctx.stroke();
        break;
      case 'highlight':
        ctx.globalAlpha = 0.3;
        ctx.fillRect(startPos.x * zoom, startPos.y * zoom, (pos.x - startPos.x) * zoom, (pos.y - startPos.y) * zoom);
        ctx.globalAlpha = 1;
        break;
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const pos = getMousePos(e);
    const newAnnotation: Annotation = {
      id: Date.now().toString(),
      type: tool,
      page: currentPage,
      x: Math.min(startPos.x, pos.x),
      y: Math.min(startPos.y, pos.y),
      width: Math.abs(pos.x - startPos.x),
      height: Math.abs(pos.y - startPos.y),
      x2: pos.x,
      y2: pos.y,
      color,
      strokeWidth,
    };
    
    const newAnnotations = [...annotations, newAnnotation];
    setAnnotations(newAnnotations);
    addToHistory(newAnnotations);
    setIsDrawing(false);
  };

  const addToHistory = (newAnnotations: Annotation[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newAnnotations);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setAnnotations(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setAnnotations(history[historyIndex + 1]);
    }
  };

  const handleSave = async () => {
    if (!pdfLibDoc) return;
    
    const pages = pdfLibDoc.getPages();
    const font = await pdfLibDoc.embedFont(StandardFonts.Helvetica);
    
    for (const ann of annotations) {
      const page = pages[ann.page - 1];
      const { height } = page.getSize();
      
      const r = parseInt(ann.color.slice(1, 3), 16) / 255;
      const g = parseInt(ann.color.slice(3, 5), 16) / 255;
      const b = parseInt(ann.color.slice(5, 7), 16) / 255;
      
      switch (ann.type) {
        case 'text':
          page.drawText(ann.text || '', {
            x: ann.x,
            y: height - ann.y,
            size: ann.fontSize || 16,
            font,
            color: rgb(r, g, b),
          });
          break;
        case 'rectangle':
          page.drawRectangle({
            x: ann.x,
            y: height - ann.y - ann.height!,
            width: ann.width!,
            height: ann.height!,
            borderColor: rgb(r, g, b),
            borderWidth: ann.strokeWidth || 2,
          });
          break;
        case 'circle':
          page.drawEllipse({
            x: ann.x + ann.width! / 2,
            y: height - ann.y - ann.height! / 2,
            xScale: ann.width! / 2,
            yScale: ann.height! / 2,
            borderColor: rgb(r, g, b),
            borderWidth: ann.strokeWidth || 2,
          });
          break;
        case 'line':
          page.drawLine({
            start: { x: ann.x, y: height - ann.y },
            end: { x: ann.x2!, y: height - ann.y2! },
            color: rgb(r, g, b),
            thickness: ann.strokeWidth || 2,
          });
          break;
        case 'highlight':
          page.drawRectangle({
            x: ann.x,
            y: height - ann.y - ann.height!,
            width: ann.width!,
            height: ann.height!,
            color: rgb(r, g, b),
            opacity: 0.3,
          });
          break;
      }
    }
    
    const pdfBytes = await pdfLibDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    onSave(blob);
  };

  const tools: { id: Tool; icon: any; label: string }[] = [
    { id: 'select', icon: MousePointer, label: 'Select' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'rectangle', icon: Square, label: 'Rectangle' },
    { id: 'circle', icon: Circle, label: 'Circle' },
    { id: 'line', icon: Minus, label: 'Line' },
    { id: 'highlight', icon: Highlighter, label: 'Highlight' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
  ];

  return (
    <div className="h-screen flex flex-col bg-slate-900 text-white">
      <div className="bg-slate-800 border-b border-slate-700 p-3 flex items-center gap-4 flex-wrap">
        <div className="flex gap-1 bg-slate-900 rounded-lg p-1">
          {tools.map(t => (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              className={`p-2 rounded transition-colors ${tool === t.id ? 'bg-blue-600' : 'hover:bg-slate-700'}`}
              title={t.label}
            >
              <t.icon size={18} />
            </button>
          ))}
        </div>

        <div className="flex gap-2 items-center">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-10 h-10 rounded cursor-pointer"
          />
          {tool === 'text' && (
            <input
              type="number"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-16 px-2 py-1 bg-slate-900 rounded text-white"
              min="8"
              max="72"
            />
          )}
          {(tool === 'rectangle' || tool === 'circle' || tool === 'line') && (
            <input
              type="number"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="w-16 px-2 py-1 bg-slate-900 rounded text-white"
              min="1"
              max="20"
            />
          )}
        </div>

        <div className="flex gap-1">
          <button onClick={undo} disabled={historyIndex === 0} className="p-2 hover:bg-slate-700 rounded disabled:opacity-30" title="Undo">
            <Undo size={18} />
          </button>
          <button onClick={redo} disabled={historyIndex === history.length - 1} className="p-2 hover:bg-slate-700 rounded disabled:opacity-30" title="Redo">
            <Redo size={18} />
          </button>
        </div>

        <div className="flex gap-1 items-center">
          <button onClick={() => setZoom(Math.max(0.5, zoom - 0.25))} className="p-2 hover:bg-slate-700 rounded" title="Zoom Out">
            <ZoomOut size={18} />
          </button>
          <span className="px-2 text-sm min-w-[60px] text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(Math.min(3, zoom + 0.25))} className="p-2 hover:bg-slate-700 rounded" title="Zoom In">
            <ZoomIn size={18} />
          </button>
        </div>

        <div className="flex gap-2 items-center ml-auto">
          <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="px-3 py-1 bg-slate-900 rounded hover:bg-slate-700 disabled:opacity-30">
            Prev
          </button>
          <span className="text-sm min-w-[80px] text-center">{currentPage} / {totalPages}</span>
          <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="px-3 py-1 bg-slate-900 rounded hover:bg-slate-700 disabled:opacity-30">
            Next
          </button>
        </div>

        <button onClick={handleSave} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium flex items-center gap-2">
          <Download size={18} /> Save
        </button>
        <button onClick={onClose} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg">
          Close
        </button>
      </div>

      <div className="flex-1 overflow-auto bg-slate-950 flex items-center justify-center p-8">
        <div className="relative shadow-2xl">
          <canvas ref={canvasRef} className="block" />
          <canvas
            ref={overlayRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className="absolute top-0 left-0 cursor-crosshair"
          />
        </div>
      </div>
    </div>
  );
};

export default ProfessionalPDFEditor;
