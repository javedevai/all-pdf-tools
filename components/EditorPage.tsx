import React, { useState, useEffect } from 'react';
import ProfessionalPDFEditor from './ProfessionalPDFEditor';

export const EditorPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFile = async () => {
      try {
        const fileData = sessionStorage.getItem('pdfEditorFile');
        const fileName = sessionStorage.getItem('pdfEditorFileName');
        
        if (!fileData || !fileName) {
          setError('No file found. Please upload a PDF from the Edit PDF tool.');
          return;
        }

        const res = await fetch(fileData);
        const blob = await res.blob();
        const file = new File([blob], fileName, { type: 'application/pdf' });
        setFile(file);
      } catch (err) {
        console.error('Error loading file:', err);
        setError('Failed to load PDF file.');
      }
    };
    
    loadFile();
  }, []);

  const handleSave = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file?.name.replace('.pdf', '-edited.pdf') || 'edited.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('PDF saved successfully!');
  };

  const handleClose = () => {
    sessionStorage.removeItem('pdfEditorFile');
    sessionStorage.removeItem('pdfEditorFileName');
    window.close();
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="text-center text-white">
          <p className="text-xl mb-4">{error}</p>
          <button onClick={() => window.close()} className="px-4 py-2 bg-red-600 rounded hover:bg-red-700">
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading PDF Editor...</p>
        </div>
      </div>
    );
  }

  return <ProfessionalPDFEditor file={file} onSave={handleSave} onClose={handleClose} />;
};
