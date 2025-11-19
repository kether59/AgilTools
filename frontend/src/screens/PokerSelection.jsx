import React, { useState } from 'react';
import { History } from 'lucide-react';
import { useAPI } from '../api/useAPI';
import '../index.css';

export const PokerSelection = ({ onCreateSession, onJoinSession, onViewHistory }) => {
  const [sessionCode, setSessionCode] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [createdSessionCode, setCreatedSessionCode] = useState('');
  const api = useAPI();

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const session = await api('/poker/sessions', {
        method: 'POST',
        body: JSON.stringify({ title, description }),
      });
      setCreatedSessionCode(session.session_code);
      setTitle('');
      setDescription('');
      setIsCreating(false);
      setTimeout(() => {
        onCreateSession(session.session_code);
      }, 100);
    } catch (error) {
      setError(error.message);
      alert(error.message);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setError('');
    if (sessionCode.trim()) {
      try {
        await api(`/poker/sessions/${sessionCode.trim()}`);
        onJoinSession(sessionCode.trim());
      } catch (error) {
        setError(`Session "${sessionCode.trim()}" introuvable. Vérifiez le code.`);
      }
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Code copié dans le presse-papier !');
  };

  return (
    <div className="max-w-4xl mx-auto px-4">
      <h2 className="text-4xl font-bold text-white mb-10 drop-shadow-lg text-center">Planning Poker 🃏</h2>

      {createdSessionCode && (
        <div className="bg-gradient-to-r from-green-400 to-emerald-500 border-2 border-white rounded-2xl p-6 mb-6 shadow-2xl">
          <h3 className="text-2xl font-bold text-white mb-3 text-center">✅ Session created !</h3>
          <p className="text-white/90 mb-4 text-center">Share code to let us join :</p>
          <div className="flex items-center gap-3 max-w-md mx-auto">
            <code className="flex-1 bg-white px-6 py-4 rounded-xl text-2xl font-bold text-gray-800 text-center shadow-lg">
              {createdSessionCode}
            </code>
            <button
              onClick={() => copyToClipboard(createdSessionCode)}
              className="bg-white text-green-600 px-6 py-4 rounded-xl hover:bg-green-50 transition shadow-lg font-semibold"
            >
              📋 Copy
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border-2 border-red-500 rounded-2xl p-4 mb-6 max-w-2xl mx-auto">
          <p className="text-red-800 font-semibold text-center">❌ {error}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20">
          <h3 className="text-2xl font-bold mb-6 text-gray-800 text-center">Join an existing session</h3>
          <form onSubmit={handleJoin} className="space-y-4">
            <input
              type="text"
              value={sessionCode}
              onChange={(e) => {
                setSessionCode(e.target.value);
                setError('');
              }}
              placeholder="Code de session"
              className="w-full px-6 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-semibold transition"
            />
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg font-semibold text-lg"
            >
              🚀 Join
            </button>
          </form>
          <p className="text-sm text-gray-500 mt-4 text-center">
            💡 Code is case sensitive
          </p>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-800">Create a session</h3>
            <button
              onClick={() => {
                setIsCreating(!isCreating);
                setError('');
                setCreatedSessionCode('');
              }}
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              {isCreating ? '✕ Annuler' : '➕ Nouvelle'}
            </button>
          </div>

          {isCreating && (
            <form onSubmit={handleCreate} className="space-y-4">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titre de la session"
                className="w-full px-6 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                required
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optionnelle)"
                className="w-full px-6 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                rows="3"
              />
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg font-semibold text-lg"
              >
                ✨ Create Session
              </button>
            </form>
          )}

          {!isCreating && (
            <div className="text-center py-8 text-gray-400">
              <p className="text-lg">Click on New to create a nes wession</p>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={onViewHistory}
        className="w-full max-w-md mx-auto block bg-white/20 backdrop-blur-sm text-white py-4 rounded-xl hover:bg-white/30 transition-all flex items-center justify-center gap-3 border border-white/20 shadow-lg font-semibold"
      >
        <History size={22} />
        View history
      </button>
    </div>
  );
};