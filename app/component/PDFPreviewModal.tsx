import React, { useState } from 'react';
import { X, Download, Maximize2, Minimize2 } from 'lucide-react';

interface PDFPreviewModalProps {
  pdfUrl: string | null;
  onClose: () => void;
}

const PDFPreviewModal: React.FC<PDFPreviewModalProps> = ({ pdfUrl, onClose }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!pdfUrl) return null;

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const downloadPDF = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = 'document.pdf';
    link.click();
  };

  return (
    <div 
      className={`
        fixed inset-0 z-50 flex items-center justify-center 
        bg-black/60 backdrop-blur-sm 
        transition-all duration-300 ease-in-out
        ${isFullscreen ? 'p-0' : 'p-4'}
      `}
    >
      <div 
        className={`
          bg-white rounded-xl shadow-2xl 
          flex flex-col 
          w-full max-w-5xl 
          h-[90vh] 
          transition-all duration-300 ease-in-out
          ${isFullscreen ? 'w-screen h-screen rounded-none' : 'max-h-[90vh]'}
        `}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">PDF Preview</h2>
          <div className="flex items-center space-x-2">
            <button 
              onClick={downloadPDF}
              className="
                p-2 rounded-md 
                hover:bg-gray-100 
                transition-colors 
                focus:outline-none 
                focus:ring-2 
                focus:ring-blue-500
              "
              aria-label="Download PDF"
              title="Download PDF"
            >
              <Download className="w-5 h-5 text-gray-600" />
            </button>
            <button 
              onClick={toggleFullscreen}
              className="
                p-2 rounded-md 
                hover:bg-gray-100 
                transition-colors 
                focus:outline-none 
                focus:ring-2 
                focus:ring-blue-500
              "
              aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5 text-gray-600" />
              ) : (
                <Maximize2 className="w-5 h-5 text-gray-600" />
              )}
            </button>
            <button 
              onClick={onClose}
              className="
                p-2 rounded-md 
                hover:bg-red-100 
                transition-colors 
                focus:outline-none 
                focus:ring-2 
                focus:ring-red-500
              "
              aria-label="Close"
              title="Close"
            >
              <X className="w-5 h-5 text-red-600" />
            </button>
          </div>
        </div>

        {/* PDF Iframe */}
        <div className="flex-grow overflow-hidden rounded-b-xl">
          <iframe
            src={pdfUrl}
            className="
              w-full h-full 
              border-none 
              transition-all 
              duration-300 
              ease-in-out
            "
            title="PDF Preview"
          />
        </div>
      </div>
    </div>
  );
};

export default PDFPreviewModal;