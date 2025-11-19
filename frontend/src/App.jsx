import React, { useState } from 'react';
import { Home, Users } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginScreen } from './screens/LoginScreen';
import { HomeScreen } from './screens/HomeScreen';
import { PokerSelection } from './screens/PokerSelection';
import { DecisionWheel } from './screens/DecisionWheel';
import { PokerSession } from './screens/PokerSession';
import './index.css'

const AppHeader = ({ currentView, onNavigateHome, username }) => {
  const getPageTitle = () => {
    switch (currentView) {
      case 'home':
        return 'Accueil';
      case 'poker':
        return 'Planning Poker';
      case 'wheel':
        return 'Roue de Décision';
      default:
        return 'Agile Tools';
    }
  };

  return (
    <div className="app-header">
      <div className="app-header-left">
        <div className="app-logo">
          <div className="app-logo-icon">🎯</div>
          <span>Agile Tools <span style={{ fontSize: '0.8rem', fontWeight: 400, color: '#6B7280' }}>by Renny</span></span>
        </div>
        <div className="app-current-page">
          {getPageTitle()}
        </div>
      </div>

      <div className="app-header-right">
        <div className="app-user-info">
          <Users size={18} />
          {username}
        </div>
        {currentView !== 'home' && (
          <button onClick={onNavigateHome} className="app-btn-home">
            <Home size={18} />
            Home
          </button>
        )}
      </div>
    </div>
  );
};

const AppContent = () => {
  const [currentView, setCurrentView] = useState('home');
  const [pokerSessionCode, setPokerSessionCode] = useState(null);
  const [sidebarContent, setSidebarContent] = useState(null);
  const { isAuthenticated, username } = useAuth();

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const handleNavigateHome = () => {
    setCurrentView('home');
    setPokerSessionCode(null);
    setSidebarContent(null);
  };

  const renderSidebar = () => {
    return sidebarContent;
  };

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HomeScreen onNavigate={setCurrentView} />;

      case 'poker':
        if (pokerSessionCode) {
          return (
            <PokerSession
              sessionCode={pokerSessionCode}
              onLeave={() => {
                setPokerSessionCode(null);
                setCurrentView('poker');
              }}
              onSidebarUpdate={setSidebarContent}
            />
          );
        }
        return (
          <PokerSelection
            onCreateSession={(code) => setPokerSessionCode(code)}
            onJoinSession={(code) => setPokerSessionCode(code)}
            onViewHistory={() => console.log('History feature coming soon!')}
          />
        );

      case 'wheel':
        return <DecisionWheel onSidebarUpdate={setSidebarContent} />;

      default:
        return <HomeScreen onNavigate={setCurrentView} />;
    }
  };

  const showSidebar = currentView === 'poker' && pokerSessionCode;

  return (
    <div className="app-container">
      <AppHeader
        currentView={currentView}
        onNavigateHome={handleNavigateHome}
        username={username}
      />

      <div className="app-main">
        <div className="app-content">
          <div className="app-content-inner">
            {renderView()}
          </div>
        </div>

        {showSidebar && (
          <div className="app-sidebar">
            {renderSidebar()}
          </div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}