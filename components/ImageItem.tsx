
import React from 'react';
import { ImageFile } from '../types';

interface ImageItemProps {
  image: ImageFile;
  onRemove: (id: string) => void;
}

const ImageItem: React.FC<ImageItemProps> = ({ image, onRemove }) => {
  return (
    <div className="flex items-center gap-4 p-3 bg-neutral-900 rounded-xl border border-neutral-800">
      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-800">
        <img src={image.previewUrl} alt="preview" className="w-full h-full object-cover" />
      </div>
      
      <div className="flex-grow min-w-0">
        <div className="flex justify-between items-start mb-1">
          <p className="text-sm font-medium truncate pr-4">{image.file.name}</p>
          <button 
            onClick={() => onRemove(image.id)}
            className="text-neutral-500 hover:text-red-400 transition-colors"
          >
            <i className="fas fa-times text-xs"></i>
          </button>
        </div>
        
        <div className="relative h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
          <div 
            className={`absolute top-0 left-0 h-full transition-all duration-300 ${
              image.status === 'completed' ? 'bg-emerald-500' : 
              image.status === 'error' ? 'bg-red-500' : 'bg-blue-500'
            }`}
            style={{ width: `${image.progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] uppercase tracking-wider text-neutral-500">
            {image.status === 'pending' && 'Waiting...'}
            {image.status === 'processing' && 'Converting...'}
            {image.status === 'completed' && 'Done'}
            {image.status === 'error' && 'Failed'}
          </span>
          <span className="text-[10px] text-neutral-500">
            {(image.file.size / 1024).toFixed(1)} KB
          </span>
        </div>
      </div>
    </div>
  );
};

export default ImageItem;
