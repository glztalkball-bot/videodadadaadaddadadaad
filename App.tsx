
import React, { useState, useCallback, useRef } from 'react';
import { VideoSegment, VideoFile, StitchTask, GenerationSettings } from './types';
import VideoPool from './components/VideoPool';
import TaskList from './components/TaskList';
import Header from './components/Header';
import { stitchVideos } from './utils/videoUtils';

const App: React.FC = () => {
  const [openers, setOpeners] = useState<VideoFile[]>([]);
  const [contents, setContents] = useState<VideoFile[]>([]);
  const [tasks, setTasks] = useState<StitchTask[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [watermark, setWatermark] = useState<File | null>(null);
  const [watermarkPreview, setWatermarkPreview] = useState<string | null>(null);
  const watermarkInputRef = useRef<HTMLInputElement>(null);

  // Fix: Added missing useState call for generationSettings
  const [generationSettings, setGenerationSettings] = useState<GenerationSettings>({
    maxCombinations: 20,
    randomizeOrder: true,
    outputFormat: 'mp4'
  });

  const handleUpload = useCallback((segment: VideoSegment, files: File[]) => {
    const newFiles: VideoFile[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      previewUrl: URL.createObjectURL(file),
      name: file.name,
      size: file.size
    }));

    if (segment === VideoSegment.OPENER) setOpeners(prev => [...prev, ...newFiles]);
    else if (segment === VideoSegment.CONTENT) setContents(prev => [...prev, ...newFiles]);
  }, []);

  const handleWatermarkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setWatermark(file);
      if (watermarkPreview) URL.revokeObjectURL(watermarkPreview);
      setWatermarkPreview(URL.createObjectURL(file));
    }
  };

  const handleRemove = useCallback((segment: VideoSegment, id: string) => {
    const filterFn = (prev: VideoFile[]) => {
      const removed = prev.find(f => f.id === id);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter(f => f.id !== id);
    };

    if (segment === VideoSegment.OPENER) setOpeners(filterFn);
    else if (segment === VideoSegment.CONTENT) setContents(filterFn);
  }, []);

  const generateTasks = () => {
    if (openers.length === 0 || contents.length === 0) {
      alert("请确保片头和内容两个素材池都已上传视频！");
      return;
    }
    const newTasks: StitchTask[] = [];
    const usedCombinations = new Set<string>();
    let attempts = 0;
    
    const maxPossible = openers.length * contents.length;
    // Use the setting for max combinations instead of a hardcoded value
    const targetCount = Math.min(generationSettings.maxCombinations, maxPossible);

    while (newTasks.length < targetCount && attempts < 1000) {
      const oIdx = Math.floor(Math.random() * openers.length);
      const cIdx = Math.floor(Math.random() * contents.length);
      const comboKey = `${openers[oIdx].id}-${contents[cIdx].id}`;

      if (!usedCombinations.has(comboKey)) {
        usedCombinations.add(comboKey);
        newTasks.push({
          id: `task-${Math.random().toString(36).substr(2, 5)}`,
          opener: openers[oIdx],
          content: contents[cIdx],
          status: 'pending',
          progress: 0
        });
      }
      attempts++;
    }
    setTasks(newTasks);
  };

  const startProcessing = async () => {
    if (tasks.length === 0 || isProcessing) return;
    setIsProcessing(true);
    
    try {
      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        if (task.status === 'completed') continue;

        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'processing', progress: 1 } : t));
        
        try {
          const resultBlob = await stitchVideos(
            [task.opener.file, task.content.file],
            (progress) => {
              setTasks(prev => prev.map(t => t.id === task.id ? { ...t, progress: Math.floor(progress) } : t));
            },
            watermark || undefined
          );

          const resultUrl = URL.createObjectURL(resultBlob);
          setTasks(prev => prev.map(t => t.id === task.id ? { 
            ...t, 
            status: 'completed', 
            resultUrl,
            progress: 100
          } : t));
        } catch (error) {
          console.error(`任务 ${task.id} 失败:`, error);
          setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'failed', progress: 0 } : t));
        }
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-slate-50 selection:bg-indigo-100">
      <Header />
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <VideoPool 
            title="1. 片头素材池" 
            description="视频的开场片段"
            videos={openers}
            segment={VideoSegment.OPENER}
            onUpload={handleUpload}
            onRemove={handleRemove}
            accentColor="blue"
          />
          <VideoPool 
            title="2. 内容素材池" 
            description="视频的主体内容"
            videos={contents}
            segment={VideoSegment.CONTENT}
            onUpload={handleUpload}
            onRemove={handleRemove}
            accentColor="purple"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-10">
          <div className="flex flex-col xl:flex-row items-center justify-between gap-8">
            <div className="flex flex-col gap-1.5 flex-1 w-full">
              <label className="block text-sm font-semibold text-slate-700">添加全图水印图片 (尺寸不变)</label>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => watermarkInputRef.current?.click()} 
                  className={`flex items-center gap-2 px-5 py-2.5 border-2 rounded-xl text-xs font-bold transition-all ${watermark ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'}`}
                >
                  <i className={`fa-solid ${watermark ? 'fa-image' : 'fa-plus'}`}></i>
                  {watermark ? '已选择水印图' : '选择 PNG/JPG 水印'}
                </button>
                <input 
                  type="file" 
                  ref={watermarkInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleWatermarkUpload} 
                />
                {watermarkPreview && (
                  <div className="relative group">
                    <img src={watermarkPreview} className="h-10 w-10 object-contain rounded-lg border bg-slate-50 shadow-sm" />
                    <button 
                      onClick={() => {setWatermark(null); setWatermarkPreview(null);}}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <i className="fa-solid fa-x"></i>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4 w-full xl:w-auto">
              <button 
                onClick={generateTasks} 
                disabled={isProcessing} 
                className="flex-1 xl:flex-none px-8 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 transition-all active:scale-95"
              >
                生成组合
              </button>
              <button 
                onClick={startProcessing} 
                disabled={isProcessing || tasks.length === 0} 
                className="flex-1 xl:flex-none px-10 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {isProcessing ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-play"></i>}
                {isProcessing ? "合成中..." : "开始批量拼接"}
              </button>
            </div>
          </div>
        </div>

        {tasks.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm">拼接队列</h3>
              <button onClick={() => !isProcessing && setTasks([])} className="text-xs text-slate-400 hover:text-slate-600">清空队列</button>
            </div>
            <TaskList tasks={tasks} />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
