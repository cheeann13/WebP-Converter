
import React, { useState, useCallback } from 'react';

interface DropzoneProps {
  onFilesAdded: (files: File[]) => void;
  disabled?: boolean;
}

const Dropzone: React.FC<DropzoneProps> = ({ onFilesAdded, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    
    // Explicitly cast to File[] to fix 'unknown' type error
    const files = Array.from(e.dataTransfer.files as FileList).filter((f: File) => 
      f.type.startsWith('image/jpeg') || f.type.startsWith('image/png')
    );
    
    if (files.length > 0) {
      onFilesAdded(files);
    }
  }, [onFilesAdded, disabled]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      // Explicitly cast to File[] to fix 'unknown' type error
      const files = Array.from(e.target.files as FileList).filter((f: File) => 
        f.type.startsWith('image/jpeg') || f.type.startsWith('image/png')
      );
      onFilesAdded(files);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-2xl p-12 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer
        ${isDragging 
          ? 'border-emerald-500 bg-emerald-500/10' 
          : 'border-neutral-800 hover:border-neutral-700 bg-neutral-900/50 hover:bg-neutral-900'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <input
        type="file"
        multiple
        accept="image/png, image/jpeg"
        onChange={handleFileInput}
        disabled={disabled}
        className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
      />
      <div className="bg-neutral-800 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
        <i className={`fas fa-cloud-arrow-up text-3xl ${isDragging ? 'text-emerald-400' : 'text-neutral-400'}`}></i>
      </div>
      <h3 className="text-xl font-semibold mb-2">Drop your images here</h3>
      <p className="text-neutral-500 text-sm text-center max-w-xs">
        Support for JPG and PNG files. Your images stay in your browser — private and secure.
      </p>
    </div>
  );
};

export default Dropzone;
