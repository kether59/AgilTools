import React, { useState } from 'react';
import { Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../index.css';

export const LoginScreen = () => {
  const [name, setName] = useState('');
  const { login } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      login(name.trim());
    }
  };

  return (
    <div className="app-centered">
      <div className="card" style={{
        maxWidth: '450px',
        width: '100%',
        background: 'white',
        border: '3px solid #DBEAFE'
      }}>
        <div className="text-center mb-8">
          <div style={{
            display: 'inline-block',
            padding: '1rem',
            background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
            borderRadius: '16px',
            marginBottom: '1rem'
          }}>
            <Users size={48} color="white" />
          </div>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '0.5rem'
          }}>
            Agile Tools
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>by Renny</p>
          <p className="text-gray-600 mt-2">Planning Poker & Decision Wheel</p>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Entrez votre nom"
            className="input mb-4"
            autoFocus
          />
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.875rem' }}
          >
            Start
          </button>
        </form>
      </div>
    </div>
  );
};