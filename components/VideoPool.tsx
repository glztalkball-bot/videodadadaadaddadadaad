
import React, { useRef } from 'react';
import { VideoFile, VideoSegment } from '../types';

interface VideoPoolProps {
  title: string;
  description: string;
  videos: VideoFile[];
  segment: VideoSegment;
  onUpload: (segment: VideoSegment, files: File[]) => void;
  onRemove: (segment: VideoSegment, id: string) => void;
  maxFiles?: number;
  accentColor: 'blue' | 'purple' | 'pink';
}

const VideoPool: React.FC<VideoPoolProps> = ({ 
  title, 
  description, 
  videos, 
  segment, 
  onUpload, 
  onRemove, 
  maxFiles,
  accentColor 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const colors = {
    blue: 'border-blue-200 bg-blue-50 text-blue-600',
    purple: 'border-purple-200 bg-purple-50 text-purple-600',
    pink: 'border-pink-200 bg-pink-50 text-pink-600'
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(segment, Array.from(e.target.files));
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[400px]">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
        <p className="text-sm text-slate-500">{description}</p>
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Upload Trigger Area */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`m-4 p-6 border-2 border-dashed rounded-xl cursor-pointer hover:bg-slate-50 transition-all flex flex-col items-center justify-center gap-2 ${colors[accentColor]}`}
        >
          <i className="fa-solid fa-cloud-arrow-up text-2xl"></i>
          <span className="text-sm font-semibold">点击或拖拽上传</span>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            multiple={!maxFiles || maxFiles > 1}
            accept="video/*"
            onChange={handleFileChange}
          />
        </div>

        {/* Video List */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
          {videos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <i className="fa-solid fa-box-open text-3xl mb-2 opacity-20"></i>
              <p className="text-xs">暂无视频文件</p>
            </div>
          ) : (
            videos.map((video) => (
              <div 
                key={video.id} 
                className="group flex items-center gap-3 p-2 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-300 transition-all"
              >
                <div className="relative w-16 h-12 bg-slate-900 rounded-md overflow-hidden flex-shrink-0">
                  <video src={video.previewUrl} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/0 transition-colors">
                    <i className="fa-solid fa-play text-white text-xs opacity-0 group-hover:opacity-100"></i>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate" title={video.name}>{video.name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{(video.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
                <button 
                  onClick={() => onRemove(segment, video.id)}
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
                >
                  <i className="fa-solid fa-xmark text-sm"></i>
                </button>
              </div>
            ))
          )}
        </div>
        
        {/* Footer info */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 flex justify-between">
          <span>总计: {videos.length} 个视频</span>
          {maxFiles && <span>上限: {maxFiles}</span>}
        </div>
      </div>
    </div>
  );
};

export default VideoPool;
