import React, { useState, useRef } from 'react';

/**
 * Component for uploading transcript files
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onFileUpload - Function to call when a file is uploaded
 */
const FileUpload = ({ onFileUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef(null);

  // Prevent default drag behaviors
  const preventDefaults = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Handle drag enter event
  const handleDragEnter = (e) => {
    preventDefaults(e);
    setIsDragging(true);
  };

  // Handle drag leave event
  const handleDragLeave = (e) => {
    preventDefaults(e);
    setIsDragging(false);
  };

  // Handle drop event
  const handleDrop = (e) => {
    preventDefaults(e);
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files[0]);
    }
  };

  // Handle file input change
  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files[0]);
    }
  };

  // Process the uploaded file
  const handleFiles = (file) => {
    // Check if file is a valid transcript file (text, doc, pdf)
    const validTypes = ['text/plain', 'application/pdf', 'application/msword', 
                       'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid transcript file (.txt, .doc, .docx, .pdf)');
      return;
    }
    
    setIsUploading(true);
    setFileName(file.name);
    
    // Call the onFileUpload callback
    onFileUpload(file)
      .then(() => {
        setIsUploading(false);
      })
      .catch(error => {
        console.error('Error uploading file:', error);
        alert('Failed to upload file. Please try again.');
        setIsUploading(false);
        setFileName('');
      });
  };

  // Handle click on the upload area
  const handleClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="mb-4">
      <div 
        className={`file-drop-area ${isDragging ? 'file-drop-active' : ''}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          className="hidden" 
          onChange={handleFileInput}
          accept=".txt,.pdf,.doc,.docx"
        />
        
        {isUploading ? (
          <div className="text-primary-600">
            <i className="fas fa-spinner fa-spin mr-2"></i>
            Uploading {fileName}...
          </div>
        ) : fileName ? (
          <div className="text-green-600">
            <i className="fas fa-check-circle mr-2"></i>
            {fileName} uploaded successfully
          </div>
        ) : (
          <div>
            <i className="fas fa-file-upload text-3xl mb-2 text-gray-400"></i>
            <p className="mb-1">Drop transcript file here or click to upload</p>
            <p className="text-xs text-gray-500">Supported formats: .txt, .pdf, .doc, .docx</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
