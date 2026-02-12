import React, { useRef, useEffect } from 'react';

interface NoiseOverlayProps {
  opacity?: number;
}

export const NoiseOverlay: React.FC<NoiseOverlayProps> = ({ opacity = 0.03 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    canvas.width = 256;
    canvas.height = 256;
    const imageData = ctx.createImageData(256, 256);
    for (let i = 0; i < imageData.data.length; i += 4) {
      const v = Math.random() * 255;
      imageData.data[i] = v;
      imageData.data[i + 1] = v;
      imageData.data[i + 2] = v;
      imageData.data[i + 3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[9999] w-full h-full"
      style={{
        opacity,
        mixBlendMode: 'overlay',
        width: '100%',
        height: '100%',
        objectFit: 'cover',
      }}
    />
  );
};
