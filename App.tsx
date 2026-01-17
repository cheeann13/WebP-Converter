
import React, { useState } from 'react';
import JSZip from 'jszip';
import Dropzone from './components/Dropzone';
import { ImageFile } from './types';
import { convertToWebP } from './services/imageProcessor';

const App: React.FC = () => {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  const handleFilesAdded = (files: File[]) => {
    const newImages: ImageFile[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'pending',
      progress: 0
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const processBatch = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);
    
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      if (img.status === 'completed') continue;

      setImages(prev => prev.map(item => 
        item.id === img.id ? { ...item, status: 'processing' } : item
      ));

      try {
        // Explicitly use 0.6 for high-efficiency lossy compression
        const result = await convertToWebP(img.file, 0.6);
        setImages(prev => prev.map(item => 
          item.id === img.id ? { 
            ...item, 
            status: 'completed', 
            resultBlob: result.blob, 
            resultName: result.fileName 
          } : item
        ));
      } catch (err) {
        setImages(prev => prev.map(item => 
          item.id === img.id ? { ...item, status: 'error' } : item
        ));
      }
    }
    setIsProcessing(false);
  };

  const downloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const completed = images.filter(img => img.status === 'completed' && img.resultBlob);
      if (completed.length === 0) {
        setIsZipping(false);
        return;
      }
      completed.forEach(img => {
        zip.file(img.resultName!, img.resultBlob!);
      });
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `format_shift_export_${Date.now()}.zip`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    }
    setIsZipping(false);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const calculateSavings = (original: number, current: number) => {
    const diff = original - current;
    const ratio = (diff / original) * 100;
    return (ratio > 0 ? '-' : '+') + Math.abs(ratio).toFixed(0) + '%';
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header Bar */}
      <header className="flex border-b-4 border-black bg-white sticky top-0 z-50">
        <div className="bg-black text-white px-8 py-4 flex items-center">
          <h1 className="text-2xl font-black tracking-tighter">FORMAT<span className="text-red-500">.</span>SHIFT</h1>
        </div>
        <div className="flex-grow flex items-center justify-end px-8 gap-8 text-[10px] font-bold tracking-widest text-neutral-500 uppercase">
          <span>Client-Side Processing</span>
          <span>•</span>
          <span>Secure</span>
          <span>•</span>
          <span>Fast</span>
        </div>
        <div className="border-l-4 border-black px-8 py-4 flex items-center font-black">
          V.1.0
        </div>
      </header>

      <main className="flex-grow flex flex-col lg:flex-row">
        {/* Left Pane */}
        <div className="w-full lg:w-[45%] p-12 lg:p-20 flex flex-col justify-between border-b-4 lg:border-b-0 lg:border-r-4 border-black">
          <div>
            <h2 className="text-7xl lg:text-9xl font-black leading-[0.85] tracking-tighter mb-8 uppercase">
              WebP<br />Converter
            </h2>
            <div className="w-20 h-2 bg-red-500 mb-10"></div>
            <p className="text-2xl font-medium leading-tight max-w-md mb-12">
              Transform your image library into high-performance WebP assets. Drag, drop, and deploy.
            </p>

            <div className="grid grid-cols-2 gap-12 border-t-2 border-black pt-8 mb-16">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold mb-2 block">Compression</span>
                <span className="text-4xl font-black">~80%</span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold mb-2 block">Quality</span>
                <span className="text-4xl font-black">Lossy</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <button 
              onClick={images.some(i => i.status === 'completed') ? downloadZip : processBatch}
              disabled={isProcessing || isZipping || images.length === 0}
              className="w-full bg-black text-white py-6 text-xl font-black uppercase tracking-widest brutalist-shadow active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isZipping ? <i className="fas fa-spinner fa-spin"></i> : <i className={`fas ${images.some(i => i.status === 'completed') ? 'fa-download' : 'fa-bolt'}`}></i>}
              {images.some(i => i.status === 'completed') ? 'Download ZIP Archive' : (isProcessing ? 'Processing...' : 'Start Batch Process')}
            </button>
            <button 
              onClick={() => { setImages([]); }}
              className="w-full border-4 border-black py-6 text-xl font-black uppercase tracking-widest hover:bg-black hover:text-white transition-colors flex items-center justify-center gap-3"
            >
              <i className="fas fa-rotate"></i>
              Process New Batch
            </button>
          </div>
        </div>

        {/* Right Pane */}
        <div className="w-full lg:w-[55%] p-12 bg-white overflow-y-auto">
          {images.length === 0 ? (
            <div className="h-full border-4 border-black relative flex flex-col items-center justify-center brutalist-shadow bg-white p-12 group cursor-pointer">
              <Dropzone onFilesAdded={handleFilesAdded} />
            </div>
          ) : (
            <div className="brutalist-border brutalist-shadow p-8 min-h-full">
              <div className="flex justify-between items-end mb-8 border-b-4 border-black pb-4">
                <div>
                  <h3 className="text-3xl font-black uppercase tracking-tight">Processing Queue</h3>
                  <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest">
                    {images.filter(i => i.status === 'completed').length} / {images.length} Completed
                  </p>
                </div>
              </div>

              <div className="w-full">
                <div className="grid grid-cols-[1fr,80px,80px,80px,40px] gap-4 mb-4 text-[10px] font-bold uppercase tracking-widest text-neutral-400 px-4">
                  <span>Filename</span>
                  <span className="text-right">Original</span>
                  <span className="text-right">WebP</span>
                  <span className="text-right">Saved</span>
                  <span className="text-center">Status</span>
                </div>
                
                <div className="space-y-4">
                  {images.map(img => (
                    <div key={img.id} className="grid grid-cols-[1fr,80px,80px,80px,40px] gap-4 items-center bg-white border-2 border-black p-4 brutalist-shadow-sm hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform">
                      <div className="flex items-center gap-4 min-w-0">
                        <img src={img.previewUrl} className="w-10 h-10 object-cover border-2 border-black flex-shrink-0" />
                        <span className="font-bold truncate text-sm">{img.file.name}</span>
                      </div>
                      <span className="text-[10px] text-right text-neutral-500 font-bold uppercase">{formatSize(img.file.size)}</span>
                      <span className="text-[10px] text-right font-black uppercase">
                        {img.resultBlob ? formatSize(img.resultBlob.size) : '--'}
                      </span>
                      <span className={`text-[10px] text-right font-black ${img.resultBlob && img.resultBlob.size > img.file.size ? 'text-red-500' : 'text-emerald-500'}`}>
                        {img.resultBlob ? calculateSavings(img.file.size, img.resultBlob.size) : '--'}
                      </span>
                      <div className="flex justify-center">
                        {img.status === 'completed' ? (
                          <div className={`w-6 h-6 ${img.resultBlob && img.resultBlob.size > img.file.size ? 'bg-orange-500' : 'bg-red-500'} text-white flex items-center justify-center border-2 border-black`}>
                            <i className="fas fa-check text-[10px]"></i>
                          </div>
                        ) : img.status === 'processing' ? (
                          <i className="fas fa-spinner fa-spin text-neutral-400"></i>
                        ) : (
                          <div className="w-6 h-6 border-2 border-black"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer Info */}
      <footer className="border-t-4 border-black p-4 flex justify-between bg-white text-[10px] font-bold tracking-widest uppercase text-neutral-400">
        <div>System Ready • Forced Lossy Mode</div>
        <div>&copy; {new Date().getFullYear()} FORMAT.SHIFT</div>
      </footer>
    </div>
  );
};

export default App;
