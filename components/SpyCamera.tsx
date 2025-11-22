import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, Power } from 'lucide-react';
import { CameraCapture } from '../types';

interface SpyCameraProps {
  onCapture: (capture: CameraCapture) => void;
  label: string;
}

const SpyCamera: React.FC<SpyCameraProps> = ({ onCapture, label }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsActive(true);
        setError(null);
      }
    } catch (err) {
      setError("Camera Access Denied. Check permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsActive(false);
    }
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw video frame
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // ADD TIMECODE OVERLAY
        const now = new Date();
        const timeString = now.toISOString().replace('T', ' ').substring(0, 19);
        
        context.font = '20px "Share Tech Mono", monospace';
        context.fillStyle = '#00ff00'; // Hacker green
        context.shadowColor = 'black';
        context.shadowBlur = 4;
        
        // Bottom left timestamp
        context.fillText(`REC: ${timeString}`, 20, canvas.height - 20);
        
        // Top right label
        context.fillText(`// ${label.toUpperCase()}`, 20, 40);

        // Draw crosshairs
        context.strokeStyle = 'rgba(0, 255, 0, 0.5)';
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(canvas.width / 2 - 20, canvas.height / 2);
        context.lineTo(canvas.width / 2 + 20, canvas.height / 2);
        context.moveTo(canvas.width / 2, canvas.height / 2 - 20);
        context.lineTo(canvas.width / 2, canvas.height / 2 + 20);
        context.stroke();

        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        onCapture({
          preview: dataUrl,
          base64: dataUrl,
          timestamp: timeString
        });
      }
    }
  };

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500 p-6 rounded text-center text-red-400">
        <p>{error}</p>
        <button onClick={startCamera} className="mt-4 underline">Retry Connection</button>
      </div>
    );
  }

  return (
    <div className="relative w-full bg-black rounded-lg overflow-hidden border-2 border-slate-700 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
      {!isActive && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-900">
          <div className="animate-pulse text-green-500 font-mono">INITIALIZING OPTICS...</div>
        </div>
      )}
      
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted
        className="w-full h-64 object-cover opacity-80"
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* HUD Overlay */}
      <div className="absolute inset-0 pointer-events-none border-2 border-green-500/20 m-2 rounded">
        <div className="absolute top-2 left-2 text-xs text-green-500 font-mono">CAM_01</div>
        <div className="absolute top-2 right-2 flex items-center gap-2">
           <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
           <span className="text-xs text-red-500 font-bold font-mono">LIVE</span>
        </div>
        {/* Crosshair center */}
        <div className="absolute top-1/2 left-1/2 w-8 h-8 -translate-x-1/2 -translate-y-1/2 border border-green-500/30"></div>
      </div>

      <div className="absolute bottom-4 left-0 right-0 flex justify-center z-20 pointer-events-auto">
        <button 
          onClick={captureImage}
          className="w-16 h-16 rounded-full border-4 border-white/20 bg-red-600 hover:bg-red-500 active:scale-95 transition-all flex items-center justify-center shadow-lg ring-2 ring-red-500/50"
        >
          <Camera className="w-8 h-8 text-white" />
        </button>
      </div>
    </div>
  );
};

export default SpyCamera;