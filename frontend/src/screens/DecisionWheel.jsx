import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useAPI } from '../api/useAPI';
import { WHEEL_COLORS } from '../constants/pokerValues';
import { WheelCanvas } from '../components/wheel/WheelCanvas';
import '../index.css';

export const DecisionWheel = ({ onSidebarUpdate }) => {
  const [configs, setConfigs] = useState([]);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newConfigName, setNewConfigName] = useState('');
  const [newConfigItems, setNewConfigItems] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const audioContextRef = useRef(null);
  const api = useAPI();

  useEffect(() => {
    loadConfigs();
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
  }, []);

  // Update sidebar when configs or selected config changes
  useEffect(() => {
    if (onSidebarUpdate) {
      onSidebarUpdate(
        <div className="space-y-6">
          <div>
            <h3>⚙️ Configurations</h3>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="btn btn-success mt-4"
              style={{ width: '100%' }}
            >
              <Plus size={18} />
              New
            </button>

            {showCreateForm && (
              <form onSubmit={handleCreateConfig} className="card mt-4">
                <input
                  type="text"
                  value={newConfigName}
                  onChange={(e) => setNewConfigName(e.target.value)}
                  placeholder="Nom de la configuration"
                  className="input mb-3"
                  required
                />
                <textarea
                  value={newConfigItems}
                  onChange={(e) => setNewConfigItems(e.target.value)}
                  placeholder="Éléments (un par ligne)"
                  className="input mb-3"
                  rows="5"
                  required
                />
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-success" style={{ flex: 1 }}>
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2 mt-4">
              {configs.map((config) => (
                <div
                  key={config.id}
                  onClick={() => {
                    setSelectedConfig(config);
                    setWinner(null);
                    setShowConfetti(false);
                  }}
                  className="card card-hover"
                  style={{
                    borderColor: selectedConfig?.id === config.id ? '#3B82F6' : '#E5E7EB',
                    borderWidth: '2px',
                    background: selectedConfig?.id === config.id ? '#EFF6FF' : 'white',
                    cursor: 'pointer'
                  }}
                >
                  <div className="font-bold text-sm">{config.name}</div>
                  <div className="text-xs text-gray-600">{config.items.length} elements</div>
                </div>
              ))}
            </div>
          </div>

          {selectedConfig && (
            <div>
              <h3>📋 Elements</h3>
              <div className="space-y-2 mt-4">
                {selectedConfig.items.map((item, idx) => (
                  <div key={idx} className="card" style={{ padding: '0.75rem' }}>
                    <div className="flex items-center gap-2">
                      <div
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: WHEEL_COLORS[idx % WHEEL_COLORS.length]
                        }}
                      />
                      <span className="text-sm font-medium">{item}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }
  }, [configs, selectedConfig, showCreateForm, newConfigName, newConfigItems]);

  const loadConfigs = async () => {
    try {
      const data = await api('/wheel/configs');
      setConfigs(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateConfig = async (e) => {
    e.preventDefault();
    try {
      const items = newConfigItems.split('\n').filter(item => item.trim());
      await api('/wheel/configs', {
        method: 'POST',
        body: JSON.stringify({
          name: newConfigName,
          items: items
        }),
      });
      setNewConfigName('');
      setNewConfigItems('');
      setShowCreateForm(false);
      loadConfigs();
    } catch (error) {
      alert(error.message);
    }
  };

  const playTickSound = () => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'square';

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);
  };

  const handleSpin = () => {
    if (!selectedConfig || isSpinning) return;

    setIsSpinning(true);
    setWinner(null);
    setShowConfetti(false);

    const items = selectedConfig.items;
    const randomIndex = Math.floor(Math.random() * items.length);
    const anglePerItem = 360 / items.length;

    const targetAngle = 360 * 5 + (360 - (randomIndex * anglePerItem + anglePerItem / 2));
    const finalRotation = rotation + targetAngle;

    let currentRotation = rotation;
    const duration = 4000;
    const startTime = Date.now();
    let lastTickRotation = currentRotation;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easeOut = 1 - Math.pow(1 - progress, 3);
      currentRotation = rotation + (targetAngle * easeOut);

      setRotation(currentRotation);

      if (Math.floor(currentRotation / 30) > Math.floor(lastTickRotation / 30)) {
        playTickSound();
        lastTickRotation = currentRotation;
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setWinner(items[randomIndex]);
        setIsSpinning(false);
        setShowConfetti(true);

        api('/wheel/results', {
          method: 'POST',
          body: JSON.stringify({
            config_id: selectedConfig.id,
            selected_item: items[randomIndex]
          }),
        }).catch(console.error);

        setTimeout(() => setShowConfetti(false), 3000);
      }
    };

    animate();
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10%',
                width: '10px',
                height: '10px',
                backgroundColor: WHEEL_COLORS[Math.floor(Math.random() * WHEEL_COLORS.length)],
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}

      {!selectedConfig ? (
        <div className="content-section text-center">
          <div className="content-section-header">
            <h3 className="content-section-title">🎡 Decision Wheel</h3>
          </div>
          <p className="text-gray-600 text-lg">
            Select a configration in the right panel to start
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="content-section">
            <div className="content-section-header">
              <h3 className="content-section-title">
                🎡 {selectedConfig.name}
              </h3>
            </div>

            <div className="relative flex justify-center items-center mb-8">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-6 z-20">
                <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[40px] border-t-red-600 filter drop-shadow-lg" />
              </div>

              <WheelCanvas items={selectedConfig.items} rotation={rotation} />
            </div>

            <div className="text-center">
              <button
                onClick={handleSpin}
                disabled={isSpinning}
                className="btn"
                style={{
                  background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
                  color: 'white',
                  padding: '1rem 3rem',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  opacity: isSpinning ? 0.5 : 1,
                  cursor: isSpinning ? 'not-allowed' : 'pointer'
                }}
              >
                {isSpinning ? '🎡 Tournage...' : '🎯 Lancer la roue !'}
              </button>

              {winner && !isSpinning && (
                <div className="mt-8 p-8 rounded-2xl border-4 animate-bounce-in" style={{
                  background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                  borderColor: '#F59E0B'
                }}>
                  <div className="text-2xl mb-3 font-semibold" style={{ color: '#92400E' }}>
                    🎉 Congratulations ! 🎉
                  </div>
                  <div className="text-5xl font-black" style={{
                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    {winner}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotateZ(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotateZ(720deg);
            opacity: 0;
          }
        }
        
        @keyframes bounce-in {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .animate-confetti {
          animation: confetti linear forwards;
        }
        
        .animate-bounce-in {
          animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
      `}</style>
    </div>
  );
};