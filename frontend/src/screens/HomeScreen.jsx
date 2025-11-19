import React from 'react';
import { Users, Target } from 'lucide-react';
import '../index.css';

export const HomeScreen = ({ onNavigate }) => {
  return (
    <div className="space-y-8" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
          Welcome on Agile Tools
        </h1>
        <p className="text-white/90 text-xl">
          Choose your tools to start
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Planning Poker Card */}
        <div
          onClick={() => onNavigate('poker')}
          className="card card-hover"
          style={{
            background: 'linear-gradient(135deg, #EFF6FF 0%, white 100%)',
            border: '3px solid #DBEAFE',
            cursor: 'pointer'
          }}
        >
          <div className="flex items-center gap-4 mb-6">
            <div style={{
              background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
              padding: '1rem',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Users size={48} color="white" />
            </div>
            <h2 className="text-3xl font-bold" style={{
              background: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Planning Poker
            </h2>
          </div>
          <p className="text-gray-700 leading-relaxed mb-6">
            Estimez vos user stories en équipe avec le Planning Poker.
            Créez une session ou rejoignez-en une existante pour collaborer en temps réel.
          </p>
          <div className="text-blue-600 font-semibold flex items-center gap-2" style={{ fontSize: '1.125rem' }}>
            Démarrer <span style={{ fontSize: '1.5rem' }}>→</span>
          </div>
        </div>

        {/* Decision Wheel Card */}
        <div
          onClick={() => onNavigate('wheel')}
          className="card card-hover"
          style={{
            background: 'linear-gradient(135deg, #F3E8FF 0%, white 100%)',
            border: '3px solid #E9D5FF',
            cursor: 'pointer'
          }}
        >
          <div className="flex items-center gap-4 mb-6">
            <div style={{
              background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
              padding: '1rem',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Target size={48} color="white" />
            </div>
            <h2 className="text-3xl font-bold" style={{
              background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Decision Wheel
            </h2>
          </div>
          <p className="text-gray-700 leading-relaxed mb-6">
            Utilisez la roue pour sélectionner aléatoirement un membre de l'équipe
            ou un élément d'une liste personnalisée de manière ludique.
          </p>
          <div className="text-purple-600 font-semibold flex items-center gap-2" style={{ fontSize: '1.125rem' }}>
            Démarrer <span style={{ fontSize: '1.5rem' }}>→</span>
          </div>
        </div>
      </div>
    </div>
  );
};