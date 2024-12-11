import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { X, FileText, FileUp } from 'lucide-react';

interface PDFUploadProps {
  customerId: string;
  onPDFUploaded?: (url: string) => void;
}

const PDFUpload: React.FC<PDFUploadProps> = ({ customerId, onPDFUploaded }) => {
  const [existingPDF, setExistingPDF] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    // Fetch existing PDF for the customer
    const fetchExistingPDF = async () => {
      try {
        const { data, error } = await supabase
          .from('Customer')
          .select('network_diagram_url')
          .eq('customer_id', customerId)
          .single();

        if (error) {
          console.warn('No existing PDF found:', error);
          return;
        }

        if (data?.network_diagram_url) {
          setExistingPDF(data.network_diagram_url);
        }
      } catch (err) {
        console.error('Error fetching existing PDF:', err);
      }
    };

    fetchExistingPDF();
  }, [customerId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type and size
      if (file.type !== 'application/pdf') {
        setError('Only PDF files are allowed');
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('File size should not exceed 10MB');
        return;
      }

      setSelectedFile(file);
      setError(null);
    }
  };

  const uploadPDF = async () => {
    if (!selectedFile) return;
  
    setIsUploading(true);
    setError(null);
  
    try {
      // Generate a unique filename
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${customerId}_${Date.now()}.${fileExt}`;
      const filePath = `network-diagrams/${fileName}`;
  
      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('customer-documents')
        .upload(filePath, selectedFile);
  
      if (uploadError) throw uploadError;
  
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('customer-documents')
        .getPublicUrl(filePath);
  
      // Update Customer table with new PDF URL
      const { error: dbError } = await supabase
        .from('Customer')
        .update({ network_diagram_url: urlData.publicUrl })
        .eq('customer_id', customerId);
  
      if (dbError) throw dbError;
  
      // Update state and notify parent
      setExistingPDF(urlData.publicUrl);
      setSelectedFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('pdf-upload-input') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = ''; // Clear the file input
      }
  
      onPDFUploaded?.(urlData.publicUrl);
    } catch (err) {
      console.error('PDF Upload Error:', err);
      setError('Failed to upload PDF. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const removePDF = async () => {
    if (!existingPDF) return;

    try {
      // Remove from storage
      const fileName = existingPDF.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('customer-documents')
          .remove([`network-diagrams/${fileName}`]);
      }

      // Remove from database
      const { error } = await supabase
        .from('Customer')
        .delete()
        .eq('customer_id', customerId);

      if (error) throw error;

      // Reset state
      setExistingPDF(null);
    } catch (err) {
      console.error('Error removing PDF:', err);
      setError('Failed to remove PDF. Please try again.');
    }
  };

  const openPDF = () => {
    if (existingPDF) {
      window.open(existingPDF, '_blank');
    }
  };

  return (
    <div className="pdf-upload-container p-4 border rounded-lg">
      <div className="flex items-center space-x-4">
        {existingPDF ? (
          <>
            <Button 
              variant="outline" 
              onClick={openPDF}
              className="flex items-center space-x-2"
            >
              <FileText className="w-5 h-5" />
              <span>View Existing PDF</span>
            </Button>
            <Button 
              variant="destructive" 
              onClick={removePDF}
              className="flex items-center space-x-2"
            >
              <X className="w-5 h-5" />
              <span>Remove PDF</span>
            </Button>
          </>
        ) : (
          <p className="text-muted-foreground">No PDF uploaded</p>
        )}
      </div>

      <div className="mt-4 flex items-center space-x-4">
        <input 
          type="file" 
          accept=".pdf"
          onChange={handleFileSelect}
          className="hidden"
          id="pdf-upload-input"
        />
        <label 
          htmlFor="pdf-upload-input" 
          className="cursor-pointer flex items-center space-x-2 text-primary hover:underline"
        >
          <FileUp className="w-5 h-5" />
          <span>{existingPDF ? 'Replace PDF' : 'Upload PDF'}</span>
        </label>

        {selectedFile && (
          <div className="flex items-center space-x-2">
            <span>{selectedFile.name}</span>
            <Button 
              variant="default" 
              onClick={uploadPDF} 
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        )}
      </div>

      {error && (
        <p className="text-destructive mt-2">{error}</p>
      )}
    </div>
  );
};

export default PDFUpload;