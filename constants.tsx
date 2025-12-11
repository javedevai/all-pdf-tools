import {
  FileText, Layers, Scissors, Minimize2, Lock, Unlock, RefreshCw, 
  Image, Type, PenTool, Shield, FileCheck, Scan, Archive, Wand2,
  Settings, FilePlus, FileDigit, Smartphone, Share2, Printer, 
  Grid, Trash2, Eye, Layout, Download, FileJson, FileCode,
  Files, Split, ShieldCheck, Eraser, Crop, Stamp, Workflow
} from 'lucide-react';
import { Tool, ToolCategory } from './types';

// Helper to generate IDs
const createTool = (id: string, name: string, cat: ToolCategory, desc: string, icon: any, extra: Partial<Tool> = {}): Tool => ({
  id, name, category: cat, description: desc, icon, ...extra
});

// The Massive List of 100 Tools (Grouped logically)
export const ALL_TOOLS: Tool[] = [
  // --- ORGANIZE ---
  createTool('merge', 'Merge PDF', ToolCategory.ORGANIZE, 'Combine multiple PDFs into one unified document.', Files, { popular: true }),
  createTool('split', 'Split PDF', ToolCategory.ORGANIZE, 'Extract pages or split your PDF into multiple files.', Split, { popular: true }),
  createTool('remove-pages', 'Remove Pages', ToolCategory.ORGANIZE, 'Delete specific pages from your document.', Trash2),
  createTool('extract-pages', 'Extract Pages', ToolCategory.ORGANIZE, 'Get specific pages as a separate PDF file.', Layers),
  createTool('organize-pdf', 'Organize PDF', ToolCategory.ORGANIZE, 'Sort, add and delete PDF pages.', Layout),
  createTool('scan-pdf', 'Scan to PDF', ToolCategory.ORGANIZE, 'Capture document from images to PDF.', Scan),
  createTool('reorder-pages', 'Reorder Pages', ToolCategory.ORGANIZE, 'Drag and drop to reorder pages.', Grid),
  createTool('rotate-pdf', 'Rotate PDF', ToolCategory.ORGANIZE, 'Rotate your PDF pages permanently.', RefreshCw),
  createTool('add-blank', 'Add Blank Page', ToolCategory.ORGANIZE, 'Insert blank pages into your PDF.', FilePlus),
  createTool('duplicate-pages', 'Duplicate Pages', ToolCategory.ORGANIZE, 'Duplicate specific pages.', Files),
  createTool('reverse-pdf', 'Reverse PDF', ToolCategory.ORGANIZE, 'Reverse the order of pages.', RefreshCw),
  createTool('mix-pdf', 'Mix PDF', ToolCategory.ORGANIZE, 'Interleave pages from two different PDFs.', Layers),

  // --- CONVERT TO PDF ---
  createTool('jpg-to-pdf', 'JPG to PDF', ToolCategory.CONVERT_TO, 'Convert JPG images to PDF in seconds.', Image, { popular: true }),
  createTool('word-to-pdf', 'Word to PDF', ToolCategory.CONVERT_TO, 'Convert DOC/DOCX to PDF.', FileText, { popular: true }),
  createTool('powerpoint-to-pdf', 'PowerPoint to PDF', ToolCategory.CONVERT_TO, 'Convert PPT/PPTX presentations to PDF.', FileText),
  createTool('excel-to-pdf', 'Excel to PDF', ToolCategory.CONVERT_TO, 'Convert XLS/XLSX spreadsheets to PDF.', Grid),
  createTool('html-to-pdf', 'HTML to PDF', ToolCategory.CONVERT_TO, 'Convert webpages to PDF documents.', FileCode),
  createTool('png-to-pdf', 'PNG to PDF', ToolCategory.CONVERT_TO, 'Convert PNG images to PDF.', Image),
  createTool('tiff-to-pdf', 'TIFF to PDF', ToolCategory.CONVERT_TO, 'Convert TIFF images to PDF.', Image),
  createTool('txt-to-pdf', 'TXT to PDF', ToolCategory.CONVERT_TO, 'Convert plain text files to PDF.', Type),
  createTool('markdown-to-pdf', 'Markdown to PDF', ToolCategory.CONVERT_TO, 'Convert Markdown (.md) to PDF.', FileCode),
  createTool('epub-to-pdf', 'EPUB to PDF', ToolCategory.CONVERT_TO, 'Convert eBooks to PDF format.', FileText),
  createTool('djvu-to-pdf', 'DJVU to PDF', ToolCategory.CONVERT_TO, 'Convert DJVU files to PDF.', FileText),
  createTool('rtf-to-pdf', 'RTF to PDF', ToolCategory.CONVERT_TO, 'Convert Rich Text to PDF.', Type),
  createTool('odt-to-pdf', 'ODT to PDF', ToolCategory.CONVERT_TO, 'Convert OpenOffice documents to PDF.', FileText),
  createTool('ppt-to-pdf', 'PPT to PDF', ToolCategory.CONVERT_TO, 'Convert legacy PowerPoint to PDF.', FileText),
  createTool('bmp-to-pdf', 'BMP to PDF', ToolCategory.CONVERT_TO, 'Convert Bitmap images to PDF.', Image),
  createTool('svg-to-pdf', 'SVG to PDF', ToolCategory.CONVERT_TO, 'Convert Vector graphics to PDF.', Image),
  createTool('heic-to-pdf', 'HEIC to PDF', ToolCategory.CONVERT_TO, 'Convert iPhone photos to PDF.', Smartphone),
  createTool('webp-to-pdf', 'WebP to PDF', ToolCategory.CONVERT_TO, 'Convert WebP images to PDF.', Image),

  // --- CONVERT FROM PDF ---
  createTool('pdf-to-jpg', 'PDF to JPG', ToolCategory.CONVERT_FROM, 'Extract images or save pages as JPG.', Image, { popular: true }),
  createTool('pdf-to-word', 'PDF to Word', ToolCategory.CONVERT_FROM, 'Convert PDF to editable Word documents.', FileText, { popular: true }),
  createTool('pdf-to-powerpoint', 'PDF to PowerPoint', ToolCategory.CONVERT_FROM, 'Convert PDF to Powerpoint presentations.', FileText),
  createTool('pdf-to-excel', 'PDF to Excel', ToolCategory.CONVERT_FROM, 'Convert PDF data to Excel spreadsheets.', Grid),
  createTool('pdf-to-pdfa', 'PDF to PDF/A', ToolCategory.CONVERT_FROM, 'Convert for long-term archiving (ISO 19005).', Archive),
  createTool('pdf-to-png', 'PDF to PNG', ToolCategory.CONVERT_FROM, 'Save each page as a PNG image.', Image),
  createTool('pdf-to-html', 'PDF to HTML', ToolCategory.CONVERT_FROM, 'Convert PDF to HTML5.', FileCode),
  createTool('pdf-to-text', 'PDF to Text', ToolCategory.CONVERT_FROM, 'Extract plain text from PDF.', Type),
  createTool('pdf-to-rtf', 'PDF to RTF', ToolCategory.CONVERT_FROM, 'Convert PDF to Rich Text Format.', Type),
  createTool('pdf-to-epub', 'PDF to EPUB', ToolCategory.CONVERT_FROM, 'Convert PDF to eBook format.', FileText),
  createTool('pdf-to-bmp', 'PDF to BMP', ToolCategory.CONVERT_FROM, 'Convert PDF pages to BMP.', Image),
  createTool('pdf-to-tiff', 'PDF to TIFF', ToolCategory.CONVERT_FROM, 'Convert PDF pages to TIFF.', Image),
  createTool('pdf-to-svg', 'PDF to SVG', ToolCategory.CONVERT_FROM, 'Convert PDF pages to SVG vector.', Image),
  createTool('extract-images', 'Extract Images', ToolCategory.CONVERT_FROM, 'Extract all images embedded in a PDF.', Image),

  // --- SECURITY ---
  createTool('unlock-pdf', 'Unlock PDF', ToolCategory.SECURITY, 'Remove password security from PDF.', Unlock, { popular: true }),
  createTool('protect-pdf', 'Protect PDF', ToolCategory.SECURITY, 'Encrypt or decrypt PDFs with military-grade AES-256 encryption.', Lock),
  createTool('sign-pdf', 'Sign PDF', ToolCategory.SECURITY, 'Add a digital signature to your PDF.', PenTool, { popular: true }),
  createTool('watermark-pdf', 'Watermark', ToolCategory.SECURITY, 'Stamp an image or text over your PDF.', Stamp),
  createTool('redact-pdf', 'Redact PDF', ToolCategory.SECURITY, 'Permanently black out sensitive text.', Eraser),
  createTool('sanitize-pdf', 'Sanitize PDF', ToolCategory.SECURITY, 'Remove hidden metadata and comments.', ShieldCheck),
  createTool('flatten-pdf', 'Flatten PDF', ToolCategory.SECURITY, 'Merge layers and form fields.', Layers),

  // --- EDIT ---
  createTool('compress-pdf', 'Compress PDF', ToolCategory.EDIT, 'Reduce file size while maintaining quality.', Minimize2, { popular: true }),
  createTool('page-numbers', 'Page Numbers', ToolCategory.EDIT, 'Add page numbers to your PDF.', FileDigit),
  createTool('add-header-footer', 'Header & Footer', ToolCategory.EDIT, 'Add custom headers and footers.', Layout),
  createTool('crop-pdf', 'Crop PDF', ToolCategory.EDIT, 'Crop pages to a specific size.', Crop),
  createTool('rotate-pages', 'Rotate Pages', ToolCategory.EDIT, 'Rotate individual pages.', RefreshCw),
  createTool('resize-pdf', 'Resize PDF', ToolCategory.EDIT, 'Change the page size (e.g. A4 to Letter).', Maximize2),
  createTool('grayscale-pdf', 'Grayscale PDF', ToolCategory.EDIT, 'Convert PDF colors to black & white.', Eye),
  createTool('annotation-pdf', 'Annotate PDF', ToolCategory.EDIT, 'Add notes and markup.', PenTool),
  createTool('overlay-pdf', 'Overlay PDF', ToolCategory.EDIT, 'Overlay one PDF on top of another.', Layers),
  createTool('deskew-pdf', 'Deskew PDF', ToolCategory.EDIT, 'Straighten scanned PDF pages.', Crop),
  createTool('contrast-pdf', 'Adjust Contrast', ToolCategory.EDIT, 'Enhance darkness of text.', Settings),

  // --- ADVANCED & OTHERS (Filling up to 100 conceptually) ---
  createTool('repair-pdf', 'Repair PDF', ToolCategory.ADVANCED, 'Recover data from corrupted PDFs.', Wand2),
  createTool('ocr-pdf', 'OCR PDF', ToolCategory.ADVANCED, 'Make scanned PDFs searchable.', Scan, { popular: true }),
  createTool('compare-pdf', 'Compare PDF', ToolCategory.ADVANCED, 'Show differences between two PDFs.', Split),
  createTool('optimize-web', 'Optimize for Web', ToolCategory.ADVANCED, 'Linearize PDF for fast web view.', Wand2),
  createTool('meta-edit', 'Edit Metadata', ToolCategory.ADVANCED, 'Change title, author, and keywords.', FileCode),
  createTool('set-viewer', 'Viewer Prefs', ToolCategory.ADVANCED, 'Set initial view settings (zoom, layout).', Eye),
  createTool('extract-fonts', 'Extract Fonts', ToolCategory.ADVANCED, 'Professional font analysis with detailed reports, usage statistics, and health checks.', Type),
  createTool('analyze-pdf', 'Analyze PDF', ToolCategory.ADVANCED, 'Get detailed structure info.', FileCheck),
  createTool('certificate-sign', 'Certify PDF', ToolCategory.SECURITY, 'Sign with a digital certificate ID.', Shield),
  createTool('timestamp-pdf', 'Timestamp PDF', ToolCategory.SECURITY, 'Add trusted timestamp.', FileCheck),
  createTool('convert-pdf-xml', 'PDF to XML', ToolCategory.CONVERT_FROM, 'Convert structure to XML.', FileCode),
  createTool('convert-pdf-json', 'PDF to JSON', ToolCategory.CONVERT_FROM, 'Convert data to JSON.', FileJson),
  createTool('batch-process', 'Batch Process', ToolCategory.ADVANCED, 'Apply actions to many files.', Workflow),
  createTool('print-ready', 'Print Ready', ToolCategory.ADVANCED, 'Convert RGB to CMYK for printing.', Printer),
  createTool('extract-tables', 'Extract Tables', ToolCategory.CONVERT_FROM, 'Pull tables specifically.', Grid),
  createTool('delete-annotations', 'Clear Notes', ToolCategory.EDIT, 'Remove all comments/notes.', Eraser),
  createTool('image-extraction', 'Grab Images', ToolCategory.CONVERT_FROM, 'Get all images as a zip.', Archive),
  createTool('split-by-bookmark', 'Split via Bookmarks', ToolCategory.ORGANIZE, 'Use bookmarks to define split points.', Split),
  createTool('split-by-size', 'Split by Size', ToolCategory.ORGANIZE, 'Split into files of X MB.', Split),
  createTool('split-by-text', 'Split by Text', ToolCategory.ORGANIZE, 'Split when specific text changes.', Split),
  createTool('n-up', 'N-Up', ToolCategory.ORGANIZE, 'Fit multiple pages on one sheet.', Grid),
  createTool('booklet-maker', 'Booklet', ToolCategory.ORGANIZE, 'Reorder pages for booklet printing.', Layers),
  createTool('qr-to-pdf', 'QR to PDF', ToolCategory.CONVERT_TO, 'Create PDF from QR content.', Smartphone),
  createTool('barcode-pdf', 'Barcode Stamp', ToolCategory.SECURITY, 'Add barcode to pages.', Stamp),
  createTool('pdf-to-long-img', 'Long Image', ToolCategory.CONVERT_FROM, 'Convert all pages to one tall image.', Image),
  createTool('remove-password', 'Remove Pass', ToolCategory.SECURITY, 'Brute force removal (Client side limited).', Unlock),
  createTool('change-password', 'Change Pass', ToolCategory.SECURITY, 'Update existing password.', Lock),
  createTool('pdf-to-csv', 'PDF to CSV', ToolCategory.CONVERT_FROM, 'Table data to CSV.', FileText),
  createTool('xps-to-pdf', 'XPS to PDF', ToolCategory.CONVERT_TO, 'Convert XPS to PDF.', FileText),
  createTool('oxps-to-pdf', 'OXPS to PDF', ToolCategory.CONVERT_TO, 'Convert OXPS to PDF.', FileText),
  createTool('cbr-to-pdf', 'CBR to PDF', ToolCategory.CONVERT_TO, 'Comic book CBR to PDF.', Image),
  createTool('cbz-to-pdf', 'CBZ to PDF', ToolCategory.CONVERT_TO, 'Comic book CBZ to PDF.', Image),
  createTool('jb2-to-pdf', 'JB2 to PDF', ToolCategory.CONVERT_TO, 'JB2 to PDF.', Image),
  createTool('pct-to-pdf', 'PCT to PDF', ToolCategory.CONVERT_TO, 'PCT to PDF.', Image),
];

// Placeholder for tools to reach "100" visually if needed, but the list above is substantial.

import { Maximize2 } from 'lucide-react';
