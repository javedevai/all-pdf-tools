# 🔧 UltraPDF Tools

> **A comprehensive, privacy-first PDF toolbox with 100+ tools for merging, splitting, converting, and editing PDFs entirely in your browser.**

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-Visit_Website-blue?style=for-the-badge)](https://allpdftools.vercel.app/#/)
[![React](https://img.shields.io/badge/React-19.2.1-61DAFB?style=flat&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2.0-646CFF?style=flat&logo=vite)](https://vitejs.dev/)

## ✨ Features

- **🔒 100% Privacy-First** - All processing happens in your browser, no files uploaded to servers
- **🛠️ 100+ PDF Tools** - Complete toolkit for all your PDF needs
- **⚡ Lightning Fast** - Client-side processing with modern web technologies
- **🎨 Modern UI** - Clean, responsive design with dark/light mode
- **📱 Mobile Friendly** - Works seamlessly on all devices
- **🔍 Smart Search** - Find tools instantly with intelligent search

## 🚀 Tool Categories

### 📋 Organize PDF
- Merge multiple PDFs
- Split PDFs by pages/size
- Reorder, rotate, and remove pages
- Extract specific pages
- Add blank pages and duplicates

### 🔄 Convert to PDF
- **Images**: JPG, PNG, BMP, WebP, SVG, HEIC → PDF
- **Documents**: Word, PowerPoint, Excel → PDF
- **Text**: TXT, Markdown, HTML → PDF
- **QR Codes**: Generate QR code PDFs

### 📤 Convert from PDF
- PDF → Images (JPG, PNG, BMP, TIFF)
- PDF → Documents (Word, Excel, PowerPoint)
- PDF → Text formats (TXT, HTML, RTF)
- Extract embedded images and tables

### 🔐 Security & Protection
- Password protect/unlock PDFs
- Digital signatures and certificates
- Watermarks and redaction
- Metadata sanitization

### ✏️ Edit & Enhance
- Compress PDFs
- Crop and resize pages
- Add headers, footers, page numbers
- OCR for scanned documents
- Annotations and markup

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **PDF Processing**: pdf-lib, pdfjs-dist
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **Additional**: QRCode, Marked, Mammoth

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/javedevai/all-pdf-tools.git

# Navigate to project directory
cd all-pdf-tools

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

## 🌐 Live Demo

**🔗 [Try UltraPDF Tools Now](https://allpdftools.vercel.app/#/)**

Experience all features instantly in your browser - no installation required!

## 📁 Project Structure

```
all-pdf-tools/
├── components/          # React components
│   └── Sidebar.tsx     # Navigation sidebar
├── services/           # Core business logic
│   └── pdfService.ts   # PDF processing functions
├── App.tsx            # Main application component
├── constants.tsx      # Tool definitions and categories
├── types.ts          # TypeScript type definitions
├── index.tsx         # Application entry point
├── index.html        # HTML template
└── vite.config.ts    # Vite configuration
```

## 🔧 Key Features Implementation

### Client-Side PDF Processing
- Uses `pdf-lib` for PDF manipulation
- `pdfjs-dist` for rendering and extraction
- Canvas API for image processing
- No server dependencies

### Privacy-First Architecture
- All operations in browser memory
- No file uploads to external servers
- Local storage for preferences only
- Zero data collection

### Modern Development
- ES modules with import maps
- TypeScript for type safety
- Vite for fast development
- Responsive Tailwind CSS design

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [pdf-lib](https://pdf-lib.js.org/) - PDF creation and modification
- [PDF.js](https://mozilla.github.io/pdf.js/) - PDF rendering
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Lucide](https://lucide.dev/) - Beautiful icons
- [Vercel](https://vercel.com/) - Deployment platform

---

<div align="center">

**[🌐 Visit UltraPDF Tools](https://allpdftools.vercel.app/#/) | [📧 Report Issues](https://github.com/javedevai/all-pdf-tools/issues) | [⭐ Star on GitHub](https://github.com/javedevai/all-pdf-tools)**

Made with ❤️ for the PDF community

</div>