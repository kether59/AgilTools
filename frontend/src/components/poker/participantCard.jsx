import React from 'react';
import '../../index.css';

// Added pokerCardValues to the props
export const ParticipantCard = ({ participant, vote, isRevealed, pokerCardValues }) => {
  const hasVoted = !!vote;
  const voteValue = vote?.value;

  const cardData = pokerCardValues?.find(c => String(c.value) === String(voteValue));

  return (
    <div
      className={`relative aspect-[2/3] rounded-2xl border-4 p-4 transition-all shadow-lg ${
        hasVoted
          ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50'
          : 'border-gray-300 bg-white'
      }`}
    >
      <div className="text-center h-full flex flex-col justify-between">
        <div>
          <div className="font-bold text-gray-800 text-lg mb-1">{participant.username}</div>
          {participant.role === 'facilitator' && (
            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">👑 Animateur</span>
          )}
        </div>
        
        <div className="flex-1 flex items-center justify-center p-2">
          {isRevealed && cardData?.image ? (
            <img
              src={cardData.image}
              alt={`Vote: ${cardData.label}`}
              className="object-contain h-full w-full rounded-lg"
            />
          ) : isRevealed ? (
            <span className="text-orange-600 text-6xl font-black">{voteValue || '-'}</span>
          ) : hasVoted ? (
            <span className="text-green-600 text-6xl font-black">✓</span>
          ) : (
            <span className="text-gray-300 text-6xl font-black">-</span>
          )}
        </div>
      </div>
    </div>
  );
};