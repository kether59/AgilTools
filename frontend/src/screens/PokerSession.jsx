import React, { useState, useEffect, useRef } from 'react';
import { Eye, RefreshCw, Plus, Clock, Copy } from 'lucide-react';
import { useAPI } from '../api/useAPI';
import { useAuth } from '../context/AuthContext';
import { WS_URL } from '../constants/env';
import { CardVote } from '../components/poker/CardVote';
import '../index.css';

const POKER_CARD_VALUES = [
  { value: '1', label: '1', image: '/images/poker_cards/card-1.png' },
  { value: '2', label: '2', image: '/images/poker_cards/card-2.png' },
  { value: '3', label: '3', image: '/images/poker_cards/card-3.png' },
  { value: '5', label: '5', image: '/images/poker_cards/card-5.png' },
  { value: '8', label: '8', image: '/images/poker_cards/card-8.png' },
  { value: '13', label: '13', image: '/images/poker_cards/card-13.png' },
  { value: '21', label: '21', image: '/images/poker_cards/card-21.png' },
  { value: '34', label: '34', image: '/images/poker_cards/card-34.png' },
  { value: '?', label: '?', image: '/images/poker_cards/card-question.png' },
  { value: 'coffee', label: '☕', image: '/images/poker_cards/card-coffee.png' },
];

export const PokerSession = ({ sessionCode, onLeave, onSidebarUpdate }) => {
  const [session, setSession] = useState(null);
  const [selectedVote, setSelectedVote] = useState(null);
  const [storyTitle, setStoryTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const wsRef = useRef(null);
  const timerRef = useRef(null);
  const api = useAPI();
  const { username } = useAuth();

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const loadSession = async () => {
    try {
      const data = await api(`/poker/sessions/${sessionCode}`);
      setSession(data);
      setLoading(false);
    } catch (error) {
      alert(error.message);
      onLeave();
    }
  };

  useEffect(() => {
    loadSession();
    api(`/poker/sessions/${sessionCode}/join`, { method: 'POST' }).catch(console.error);

    const ws = new WebSocket(`${WS_URL}/poker/${sessionCode}?username=${username}`);
    wsRef.current = ws;

    ws.onopen = () => console.log('WebSocket connecté');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (['vote_cast', 'votes_revealed', 'votes_reset', 'round_completed', 'new_round', 'user_joined', 'user_left'].includes(data.type)) {
        loadSession();
      }
    };
    ws.onerror = (error) => console.error('Erreur WebSocket:', error);
    ws.onclose = () => console.log('WebSocket déconnecté');

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) ws.close();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionCode, username]);

  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  // Update sidebar content
  useEffect(() => {
    if (session && onSidebarUpdate) {
      const currentParticipant = session.participants.find(p => p.username === username);
      const isFacilitator = currentParticipant?.role === 'facilitator';
      const allVoted = session.participants.length > 0 && session.participants.every(p =>
        session.votes.some(v => v.user === p.username)
      );

      onSidebarUpdate(
        <div className="space-y-6">
          {/* Session Info */}
          <div>
            <h3>📋 Session</h3>
            <div className="card mt-4">
              <div className="text-sm text-gray-600 mb-2">Code of session</div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={sessionCode}
                  readOnly
                  className="input"
                  style={{ fontSize: '0.875rem', padding: '0.5rem' }}
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(sessionCode);
                    alert('Code copié !');
                  }}
                  className="btn btn-primary"
                  style={{ padding: '0.5rem' }}
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Timer & Status */}
          <div>
            <h3>⏱️ Timer</h3>
            <div className="card mt-4" style={{
              background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
              color: 'white',
              textAlign: 'center'
            }}>
              <div className="text-sm mb-2" style={{ opacity: 0.9 }}>
                {allVoted && !session.is_revealed ? '✅ Tous ont voté' :
                 session.is_revealed ? '👁️ Votes révélés' :
                 '⏳ En attente'}
              </div>
              <div className="flex items-center justify-center gap-2 text-3xl font-bold mb-4">
                <Clock size={32} />
                {formatTime(timer)}
              </div>

              {isFacilitator && (
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setTimer(0);
                      setIsTimerRunning(false);
                    }}
                    className="btn"
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.3)'
                    }}
                  >
                    Reset Timer
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await api(`/poker/sessions/${sessionCode}/reveal`, { method: 'POST' });
                        setIsTimerRunning(false);
                        loadSession();
                      } catch (error) {
                        alert(error.message);
                      }
                    }}
                    disabled={session.is_revealed}
                    className="btn"
                    style={{
                      width: '100%',
                      background: 'white',
                      color: '#3B82F6'
                    }}
                  >
                    <Eye size={16} />
                    Show
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await api(`/poker/sessions/${sessionCode}/reset`, { method: 'POST' });
                        setSelectedVote(null);
                        setTimer(0);
                        setIsTimerRunning(false);
                        loadSession();
                      } catch (error) {
                        alert(error.message);
                      }
                    }}
                    className="btn"
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.3)'
                    }}
                  >
                    <RefreshCw size={16} />
                    Delete Votes
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Players */}
          <div>
            <h3>👥 Players ({session.participants.length})</h3>
            <div className="space-y-3 mt-4">
              {session.participants.map((participant) => {
                const vote = session.votes.find(v => v.user === participant.username);
                const hasVoted = !!vote;

                return (
                  <div
                    key={participant.username}
                    className="card"
                    style={{
                      borderColor: hasVoted ? '#10B981' : '#E5E7EB',
                      borderWidth: '2px',
                      background: hasVoted ? '#F0FDF4' : 'white'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: hasVoted ? '#10B981' : '#D1D5DB'
                        }} />
                        <div>
                          <div className="font-semibold text-sm">
                            {participant.username}
                            {participant.role === 'facilitator' && (
                              <span style={{
                                marginLeft: '0.5rem',
                                fontSize: '0.7rem',
                                background: '#DBEAFE',
                                color: '#1E40AF',
                                padding: '0.125rem 0.5rem',
                                borderRadius: '9999px'
                              }}>
                                Animateur
                              </span>
                            )}
                          </div>
                          {hasVoted && vote && (
                            <div className="text-xs text-gray-500">
                              {formatTime(Math.floor((new Date() - new Date(vote.voted_at)) / 1000))}
                            </div>
                          )}
                        </div>
                      </div>

                      {session.is_revealed && vote && (
                        <div className="text-xl font-black" style={{ color: '#F97316' }}>
                          {vote.value}
                        </div>
                      )}

                      {!session.is_revealed && hasVoted && (
                        <div className="text-xl" style={{ color: '#10B981' }}>✓</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }
  }, [session, timer, isTimerRunning, sessionCode, username]);

  const handleVote = async (value) => {
    try {
      await api(`/poker/sessions/${sessionCode}/vote`, {
        method: 'POST',
        body: JSON.stringify({ vote_value: String(value) }),
      });
      setSelectedVote(value);
      if (!isTimerRunning) setIsTimerRunning(true);
      loadSession();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleStartRound = async () => {
    try {
      await api(`/poker/sessions/${sessionCode}/rounds`, {
        method: 'POST',
        body: JSON.stringify({ story_title: storyTitle }),
      });
      setStoryTitle('');
      setSelectedVote(null);
      setTimer(0);
      setIsTimerRunning(false);
      loadSession();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleCompleteRound = async (estimate) => {
    if (!session?.current_round) return;
    try {
      await api(`/poker/sessions/${sessionCode}/rounds/${session.current_round.round_number}/complete`, {
        method: 'POST',
        body: JSON.stringify({ final_estimate: String(estimate) }),
      });
      setTimer(0);
      setIsTimerRunning(false);
      loadSession();
    } catch (error) {
      alert(error.message);
    }
  };

  if (loading) return <div className="text-white text-center text-xl">⏳ Loading...</div>;
  if (!session) return <div className="text-white text-center text-xl">❌ Session not found</div>;

  const currentParticipant = session.participants.find(p => p.username === username);
  const isFacilitator = currentParticipant?.role === 'facilitator';
  const myVote = session.votes.find(v => v.user === username);

  return (
    <div className="space-y-6">
      {/* Story Section */}
      <div className="content-section">
        <div className="content-section-header">
          <h3 className="content-section-title">
            📖 {session.current_round?.story_title || 'Story'}
            {session.current_round && (
              <span style={{ fontSize: '1rem', fontWeight: 400, marginLeft: '1rem', color: '#6B7280' }}>
                Round {session.current_round.round_number}
              </span>
            )}
          </h3>
        </div>

        {isFacilitator && (
          <div className="mt-4">
            <input
              type="text"
              value={storyTitle}
              onChange={(e) => setStoryTitle(e.target.value)}
              placeholder="Titre de la nouvelle story"
              className="input mb-3"
            />
            <button
              onClick={handleStartRound}
              disabled={!storyTitle.trim()}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              <Plus size={18} />
              New Story
            </button>
          </div>
        )}
      </div>

      {/* Voting Cards */}
      <div className="content-section">
        <div className="content-section-header">
          <h3 className="content-section-title">🃏 Choose your card</h3>
        </div>
        <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-9 xl:grid-cols-10 gap-3">
          {POKER_CARD_VALUES.map((card) => (
            <CardVote
              key={card.value}
              card={card}
              isSelected={myVote?.value === card.value}
              onClick={() => handleVote(card.value)}
            />
          ))}
        </div>
      </div>

      {/* Results */}
      {session.is_revealed && session.votes.length > 0 && (
        <div className="content-section" style={{
          background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
          borderColor: '#3B82F6'
        }}>
          <div className="content-section-header" style={{ background: '#DBEAFE' }}>
            <h3 className="content-section-title">📊 Results</h3>
          </div>
          <div className="flex flex-wrap gap-6 mb-4">
            <div>
              <span className="text-sm text-gray-600">Average : </span>
              <span className="font-black text-3xl text-blue-600">
                {(session.votes
                  .filter(v => !isNaN(parseFloat(v.value)))
                  .reduce((sum, v) => sum + parseFloat(v.value), 0) /
                  session.votes.filter(v => !isNaN(parseFloat(v.value))).length
                ).toFixed(1)}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-600">Votes: </span>
              <span className="font-bold text-lg">{session.votes.map(v => v.value).join(', ')}</span>
            </div>
          </div>
          {isFacilitator && (
            <div>
              <p className="text-sm text-gray-700 mb-3 font-semibold">✅ Close estimation:</p>
              <div className="flex gap-2 flex-wrap">
                {POKER_CARD_VALUES
                  .filter(c => !isNaN(parseFloat(c.value)))
                  .map((card) => (
                    <button
                      key={card.value}
                      onClick={() => handleCompleteRound(card.value)}
                      className="btn btn-success"
                    >
                      {card.label}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* History */}
      {session.rounds_history && session.rounds_history.length > 0 && (
        <div className="content-section">
          <div className="content-section-header">
            <h3 className="content-section-title">📜 History </h3>
          </div>
          <div className="space-y-2">
            {session.rounds_history.map((round) => (
              <div key={round.round_number} className="card" style={{ padding: '1rem' }}>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold">Round {round.round_number}</span>
                    {round.story_title && <span className="ml-2 text-gray-600 text-sm">- {round.story_title}</span>}
                  </div>
                  <span className="font-black text-lg" style={{ color: '#F97316' }}>{round.final_estimate} pts</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};