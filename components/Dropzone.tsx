
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
    
    const files = Array.from(e.dataTransfer.files as FileList).filter((f: File) => 
      f.type.startsWith('image/jpeg') || f.type.startsWith('image/png')
    );
    
    if (files.length > 0) {
      onFilesAdded(files);
    }
  }, [onFilesAdded, disabled]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
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
      className={`absolute inset-0 flex flex-col items-center justify-center transition-all
        ${isDragging ? 'bg-red-50' : 'bg-white'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <input
        type="file"
        multiple
        accept="image/png, image/jpeg"
        onChange={handleFileInput}
        disabled={disabled}
        className="absolute inset-0 opacity-0 cursor-pointer z-10"
      />
      
      {/* Corner Brackets */}
      <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-black"></div>
      <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-black"></div>
      <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-black"></div>
      <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-black"></div>

      <div className="flex flex-col items-center animate-pulse">
        <i className="fas fa-upload text-5xl mb-6"></i>
        <h3 className="text-5xl font-black uppercase tracking-tighter text-center leading-[0.9]">
          Drop<br />Images<br /><span className="text-red-500 text-6xl">Here</span>
        </h3>
        <p className="mt-6 text-[10px] font-bold tracking-widest text-neutral-400 uppercase text-center">
          Supports JPG & PNG • Batch Processing
        </p>
        <div className="mt-12 border-b-4 border-black pb-2 px-4 hover:bg-black hover:text-white transition-all">
           <span className="text-sm font-black uppercase tracking-widest">Or Click to Browse &rarr;</span>
        </div>
      </div>
    </div>
  );
};

export default Dropzone;
