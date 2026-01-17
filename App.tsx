
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
      link.download = `format_shift_${Date.now()}.zip`;
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

  const hasCompleted = images.some(i => i.status === 'completed');

  return (
    <div className="flex flex-col min-h-screen bg-white text-black font-sans selection:bg-red-500 selection:text-white">
      {/* Brutalist Header */}
      <header className="flex border-b-4 border-black bg-white sticky top-0 z-50">
        <div className="bg-black text-white px-8 py-4 flex items-center">
          <h1 className="text-2xl font-black tracking-tighter uppercase italic">Format<span className="text-red-500">.</span>Shift</h1>
        </div>
        <div className="flex-grow flex items-center justify-end px-8 gap-8 text-[10px] font-bold tracking-widest text-neutral-400 uppercase">
          <span>Local Processing</span>
          <span className="text-black">•</span>
          <span>Private</span>
          <span className="text-black">•</span>
          <span>Lossy WebP</span>
        </div>
        <div className="border-l-4 border-black px-8 py-4 flex items-center font-black">
          V.1.2
        </div>
      </header>

      <main className="flex-grow flex flex-col lg:flex-row">
        {/* Hero & Controls Section */}
        <div className="w-full lg:w-[45%] p-10 lg:p-20 flex flex-col justify-between border-b-4 lg:border-b-0 lg:border-r-4 border-black bg-[#f4f4f4]">
          <div>
            <h2 className="text-8xl lg:text-[10rem] font-black leading-[0.8] tracking-tighter mb-10 uppercase">
              WebP<br />Shift
            </h2>
            <div className="w-24 h-3 bg-red-500 mb-10"></div>
            <p className="text-3xl font-bold leading-tight max-w-md mb-12">
              Aggressive lossy compression for lightning-fast websites.
            </p>

            <div className="grid grid-cols-2 gap-12 border-t-4 border-black pt-10 mb-16">
              <div>
                <span className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 font-black mb-3 block">Reduction Target</span>
                <span className="text-5xl font-black">~80%</span>
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 font-black mb-3 block">Encoding</span>
                <span className="text-5xl font-black">Lossy</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <button 
              onClick={hasCompleted ? downloadZip : processBatch}
              disabled={isProcessing || isZipping || images.length === 0}
              style={{ boxShadow: '8px 8px 0px 0px rgba(0,0,0,1)' }}
              className="w-full bg-black text-white py-8 text-2xl font-black uppercase tracking-widest hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-4 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {isZipping || isProcessing ? (
                <i className="fas fa-spinner fa-spin"></i>
              ) : (
                <i className={`fas ${hasCompleted ? 'fa-download' : 'fa-bolt'}`}></i>
              )}
              {hasCompleted ? 'Download All' : (isProcessing ? 'Processing' : 'Convert Batch')}
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="w-full border-4 border-black py-6 text-xl font-black uppercase tracking-widest hover:bg-black hover:text-white transition-colors flex items-center justify-center gap-4"
            >
              <i className="fas fa-rotate"></i>
              New Batch
            </button>
          </div>
        </div>

        {/* Queue & Progress Section */}
        <div className="w-full lg:w-[55%] p-10 lg:p-16 bg-white overflow-y-auto">
          {images.length === 0 ? (
            <div className="h-full border-4 border-black border-dashed flex flex-col items-center justify-center p-12 bg-neutral-50 hover:bg-white transition-colors group cursor-pointer">
               <Dropzone onFilesAdded={handleFilesAdded} />
            </div>
          ) : (
            <div className="border-4 border-black p-8 bg-white" style={{ boxShadow: '12px 12px 0px 0px rgba(0,0,0,0.1)' }}>
              <div className="flex justify-between items-baseline mb-10 border-b-4 border-black pb-6">
                <h3 className="text-4xl font-black uppercase italic">The Queue</h3>
                <span className="font-black text-neutral-400 uppercase tracking-widest text-sm">
                  {images.filter(i => i.status === 'completed').length} / {images.length} Finished
                </span>
              </div>

              <div className="space-y-6">
                {/* Table Header */}
                <div className="grid grid-cols-[1fr,100px,100px,100px,50px] gap-4 px-4 text-[11px] font-black uppercase tracking-widest text-neutral-400">
                  <span>Asset</span>
                  <span className="text-right">Original</span>
                  <span className="text-right">WebP</span>
                  <span className="text-right">Saved</span>
                  <span className="text-center">State</span>
                </div>

                {images.map(img => (
                  <div key={img.id} className="grid grid-cols-[1fr,100px,100px,100px,50px] gap-4 items-center bg-white border-4 border-black p-5 hover:bg-neutral-50 transition-colors">
                    <div className="flex items-center gap-5 min-w-0">
                      <div className="w-12 h-12 bg-neutral-200 border-2 border-black flex-shrink-0 overflow-hidden">
                        <img src={img.previewUrl} className="w-full h-full object-cover" alt="" />
                      </div>
                      <span className="font-black truncate text-sm uppercase italic">{img.file.name}</span>
                    </div>
                    
                    <span className="font-bold text-right text-xs text-neutral-500">{formatSize(img.file.size)}</span>
                    
                    <span className="font-black text-right text-xs">
                      {img.resultBlob ? formatSize(img.resultBlob.size) : '---'}
                    </span>
                    
                    <span className={`font-black text-right text-xs ${img.resultBlob && img.resultBlob.size < img.file.size ? 'text-emerald-500' : 'text-red-500'}`}>
                      {img.resultBlob ? calculateSavings(img.file.size, img.resultBlob.size) : '---'}
                    </span>

                    <div className="flex justify-center">
                      {img.status === 'completed' ? (
                        <div className="w-8 h-8 bg-black text-white flex items-center justify-center">
                          <i className="fas fa-check text-xs"></i>
                        </div>
                      ) : img.status === 'processing' ? (
                        <i className="fas fa-spinner fa-spin"></i>
                      ) : (
                        <div className="w-8 h-8 border-2 border-black"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t-4 border-black p-6 bg-black text-white flex justify-between items-center text-[10px] font-bold tracking-[0.3em] uppercase">
        <div className="flex items-center gap-4">
          <span className="text-red-500">Live Status:</span>
          {isProcessing ? 'Encoding Stream Active' : 'Waiting for Payload'}
        </div>
        <div>Format.Shift &copy; {new Date().getFullYear()}</div>
      </footer>
    </div>
  );
};

export default App;
