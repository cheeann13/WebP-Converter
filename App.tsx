
import React, { useState, useCallback } from 'react';
import JSZip from 'jszip';
import Dropzone from './components/Dropzone';
import ImageItem from './components/ImageItem';
import { ImageFile } from './types';
import { convertToWebP } from './services/imageProcessor';

const App: React.FC = () => {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);

  const handleFilesAdded = (files: File[]) => {
    const newImages: ImageFile[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'pending',
      progress: 0
    }));
    setImages(prev => [...prev, ...newImages]);
    setZipBlob(null);
  };

  const removeImage = (id: string) => {
    setImages(prev => {
      const removed = prev.find(img => img.id === id);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter(img => img.id !== id);
    });
    setZipBlob(null);
  };

  const clearAll = () => {
    images.forEach(img => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    setZipBlob(null);
  };

  const processImages = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);
    setZipBlob(null);
    
    // Process images sequentially
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      if (img.status === 'completed') continue;

      setImages(prev => prev.map(item => 
        item.id === img.id ? { ...item, status: 'processing', progress: 30 } : item
      ));

      try {
        const result = await convertToWebP(img.file);
        setImages(prev => prev.map(item => 
          item.id === img.id ? { 
            ...item, 
            status: 'completed', 
            progress: 100, 
            resultBlob: result.blob, 
            resultName: result.fileName 
          } : item
        ));
      } catch (err) {
        console.error("Conversion error for " + img.file.name, err);
        setImages(prev => prev.map(item => 
          item.id === img.id ? { ...item, status: 'error', progress: 100 } : item
        ));
      }
    }

    setIsProcessing(false);
    // After loop, the state update is queued. ZIP is created on demand or triggered here.
    await generateAndSetZip();
  };

  const generateAndSetZip = async (currentImages?: ImageFile[]) => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const list = currentImages || images;
      const completedImages = list.filter(img => img.status === 'completed' && img.resultBlob);
      
      if (completedImages.length === 0) {
        setIsZipping(false);
        return null;
      }

      completedImages.forEach(img => {
        if (img.resultBlob && img.resultName) {
          zip.file(img.resultName, img.resultBlob);
        }
      });

      const content = await zip.generateAsync({ type: "blob" });
      setZipBlob(content);
      setIsZipping(false);
      return content;
    } catch (err) {
      console.error("ZIP generation error", err);
      setIsZipping(false);
      return null;
    }
  };

  const downloadZip = async () => {
    let targetBlob = zipBlob;
    
    // Fallback: If zipBlob isn't ready but we have completed images, generate it now
    if (!targetBlob) {
      targetBlob = await generateAndSetZip();
    }

    if (!targetBlob) {
      alert("No converted images ready to download.");
      return;
    }

    const url = URL.createObjectURL(targetBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `converted_images_${new Date().getTime()}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Slight delay before revoking to ensure the browser handles the download stream
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const allCompleted = images.length > 0 && images.every(img => img.status === 'completed' || img.status === 'error');
  const hasCompleted = images.some(img => img.status === 'completed');

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <header className="mb-12 text-center">
        <div className="inline-flex items-center justify-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-6">
          <i className="fas fa-bolt"></i>
          <span>Client-Side Optimization</span>
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight mb-4 text-white">
          WebP Bulk Converter
        </h1>
        <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
          Lightning fast image conversion. Drag, drop, and convert to optimized WebP 
          instantly without uploading a single byte to any server.
        </p>
      </header>

      <main className="space-y-8">
        <Dropzone onFilesAdded={handleFilesAdded} disabled={isProcessing || isZipping} />

        {images.length > 0 && (
          <div className="bg-neutral-900/30 border border-neutral-800 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-neutral-200">
                <i className="fas fa-list text-neutral-500"></i>
                Queue ({images.length})
              </h2>
              <div className="flex gap-3">
                <button 
                  onClick={clearAll}
                  disabled={isProcessing || isZipping}
                  className="px-4 py-2 text-sm text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-all disabled:opacity-30"
                >
                  Clear All
                </button>
                
                {allCompleted && hasCompleted ? (
                   <button 
                    onClick={downloadZip}
                    disabled={isZipping}
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all disabled:bg-neutral-700"
                  >
                    {isZipping ? (
                      <><i className="fas fa-spinner fa-spin"></i> Zipping...</>
                    ) : (
                      <><i className="fas fa-download"></i> Download ZIP</>
                    )}
                  </button>
                ) : (
                  <button 
                    onClick={processImages}
                    disabled={isProcessing || isZipping || images.length === 0}
                    className={`px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-all
                      ${(isProcessing || isZipping) ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {isProcessing ? (
                      <><i className="fas fa-spinner fa-spin"></i> Converting...</>
                    ) : (
                      <><i className="fas fa-play"></i> Start Conversion</>
                    )}
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {images.map(img => (
                <ImageItem key={img.id} image={img} onRemove={removeImage} />
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="mt-20 border-t border-neutral-900 pt-8 flex flex-col items-center text-neutral-500 text-sm">
        <div className="flex gap-6 mb-4">
          <span className="flex items-center gap-2">
            <i className="fas fa-shield-halved text-emerald-500/50"></i>
            Private
          </span>
          <span className="flex items-center gap-2">
            <i className="fas fa-gauge-high text-emerald-500/50"></i>
            Fast
          </span>
          <span className="flex items-center gap-2">
            <i className="fas fa-check text-emerald-500/50"></i>
            Free
          </span>
        </div>
        <p>&copy; {new Date().getFullYear()} WebP Bulk Converter. All processing happens in your browser.</p>
      </footer>
    </div>
  );
};

export default App;
