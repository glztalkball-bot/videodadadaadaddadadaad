
/**
 * 视频拼接工具 - 尺寸保持版
 */

let sharedAudioCtx: AudioContext | null = null;

const initAudio = async () => {
  if (!sharedAudioCtx) {
    sharedAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 44100 });
  }
  if (sharedAudioCtx.state === 'suspended') await sharedAudioCtx.resume();
  return sharedAudioCtx;
};

const loadImage = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("图片加载失败"));
    img.src = url;
  });
};

export const stitchVideos = async (
  videoFiles: File[],
  onProgress: (progress: number) => void,
  watermarkFile?: File
): Promise<Blob> => {
  const FRAME_RATE = 30;
  
  // 1. 获取第一段视频的分辨率作为基准（尺寸不变）
  const firstVideo = document.createElement('video');
  firstVideo.src = URL.createObjectURL(videoFiles[0]);
  await new Promise(r => {
    firstVideo.onloadedmetadata = r;
    setTimeout(r, 5000);
  });

  const CANVAS_WIDTH = firstVideo.videoWidth || 720;
  const CANVAS_HEIGHT = firstVideo.videoHeight || 1280;
  
  console.log(`[Stitcher] 基准尺寸: ${CANVAS_WIDTH}x${CANVAS_HEIGHT}`);

  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error("Canvas Context Failed");
  
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  let watermarkImg: HTMLImageElement | null = null;
  if (watermarkFile) {
    watermarkImg = await loadImage(watermarkFile);
  }

  const audioCtx = await initAudio();
  const mixedDest = audioCtx?.createMediaStreamDestination();

  const videoStream = canvas.captureStream(FRAME_RATE);
  const tracks: MediaStreamTrack[] = [...videoStream.getVideoTracks()];
  if (mixedDest) tracks.push(...mixedDest.stream.getAudioTracks());
  const combinedStream = new MediaStream(tracks);

  const mimeType = ['video/mp4;codecs=avc1', 'video/webm;codecs=h264', 'video/webm'].find(type => MediaRecorder.isTypeSupported(type)) || '';
  const chunks: Blob[] = [];
  const recorder = new MediaRecorder(combinedStream, {
    mimeType,
    videoBitsPerSecond: 6000000 // 提升至 6Mbps 保证画质
  });

  recorder.ondataavailable = e => e.data.size > 0 && chunks.push(e.data);

  return new Promise(async (resolve, reject) => {
    const videoElements: HTMLVideoElement[] = [];
    
    recorder.onstop = () => {
      videoElements.forEach(v => { URL.revokeObjectURL(v.src); v.remove(); });
      resolve(new Blob(chunks, { type: 'video/mp4' }));
    };

    try {
      let totalDuration = 0;
      for (const file of videoFiles) {
        const v = document.createElement('video');
        v.src = URL.createObjectURL(file);
        v.crossOrigin = "anonymous";
        await new Promise(res => {
          v.onloadedmetadata = () => { totalDuration += v.duration; res(null); };
          v.onerror = () => res(null);
        });
        videoElements.push(v);
      }

      recorder.start();

      let offset = 0;
      for (let i = 0; i < videoElements.length; i++) {
        const video = videoElements[i];
        if (video.readyState < 3) await new Promise(r => { video.oncanplay = r; setTimeout(r, 3000); });

        let source = audioCtx && mixedDest ? audioCtx.createMediaElementSource(video) : null;
        if (source) source.connect(mixedDest!);

        await new Promise(res => {
          let active = true;
          const finish = () => {
            if (!active) return;
            active = false;
            if (source) source.disconnect();
            res(null);
          };

          video.onended = finish;
          video.play();

          const render = () => {
            if (!active) return;
            
            // 保持比例绘制视频
            const vW = video.videoWidth || CANVAS_WIDTH;
            const vH = video.videoHeight || CANVAS_HEIGHT;
            const scale = Math.max(CANVAS_WIDTH / vW, CANVAS_HEIGHT / vH);
            const drawW = vW * scale;
            const drawH = vH * scale;
            const drawX = (CANVAS_WIDTH - drawW) / 2;
            const drawY = (CANVAS_HEIGHT - drawH) / 2;

            ctx.drawImage(video, drawX, drawY, drawW, drawH);

            // 绘制水印：尺寸不变（使用图片原始宽高）并居中
            if (watermarkImg) {
              const x = (CANVAS_WIDTH - watermarkImg.width) / 2;
              const y = (CANVAS_HEIGHT - watermarkImg.height) / 2;
              ctx.drawImage(watermarkImg, x, y, watermarkImg.width, watermarkImg.height);
            }

            onProgress(Math.min(99, ((offset + video.currentTime) / totalDuration) * 100));
            if (video.currentTime >= video.duration - 0.1) finish();
            else requestAnimationFrame(render);
          };
          render();
        });
        offset += video.duration;
      }

      onProgress(100);
      setTimeout(() => recorder.stop(), 500);
    } catch (err) {
      reject(err);
    }
  });
};
