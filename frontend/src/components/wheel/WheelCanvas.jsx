import React, { useEffect, useRef } from 'react';
import { WHEEL_COLORS } from '../../constants/pokerValues';
import '../../index.css';

export const WheelCanvas = ({ items, rotation }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!items || items.length === 0 || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const anglePerItem = (Math.PI * 2) / items.length;
    
    items.forEach((item, index) => {
      const startAngle = index * anglePerItem - Math.PI / 2;
      const endAngle = startAngle + anglePerItem;
      
      // Dessiner la tranche
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = WHEEL_COLORS[index % WHEEL_COLORS.length];
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Ajouter le texte
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + anglePerItem / 2);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px Arial';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.fillText(item, radius * 0.65, 0);
      ctx.restore();
    });
    
    // Cercle central
    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;
    ctx.stroke();
  }, [items, rotation]);

  return (
    <canvas
      ref={canvasRef}
      width={500}
      height={500}
      className="rounded-full shadow-2xl"
      style={{
        transform: `rotate(${rotation}deg)`,
        transition: 'none'
      }}
    />
  );
};
