import React from 'react';
import '../../index.css';

export const CardVote = ({ card, isSelected, onClick }) => (
  <button
    onClick={onClick}
    className={`relative aspect-[2/3] rounded-2xl border-4 transition-all transform hover:scale-105 hover:-translate-y-2 shadow-xl ${
      isSelected
        ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-orange-100 scale-105 shadow-2xl'
        : 'border-gray-300 bg-white hover:border-orange-400'
    }`}
  >

    <div className="absolute inset-0 flex items-center justify-center p-1">
      {card?.image ? (
        <img
          src={card.image}
          alt={`Card ${card.label}`}
          className="object-contain h-full w-full p-2 rounded-xl"
        />
      ) : (
        <span className={`text-5xl font-black ${isSelected ? 'text-orange-600' : 'text-orange-500'}`}>
          {card?.label || card?.value || '?'}
        </span>
      )}
    </div>

    {isSelected && (
      <div className="absolute -top-1 -right-1 p-2 bg-orange-500 rounded-full text-white text-xs font-bold shadow-lg border-2 border-white">
        ✓
      </div>
    )}
  </button>
);