
export enum VideoSegment {
  OPENER = 'opener',
  CONTENT = 'content'
}

export interface VideoFile {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  size: number;
  duration?: number;
}

export interface StitchTask {
  id: string;
  opener: VideoFile;
  content: VideoFile;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  resultUrl?: string;
  progress: number;
}

export interface GenerationSettings {
  maxCombinations: number;
  randomizeOrder: boolean;
  outputFormat: 'mp4' | 'webm';
}
