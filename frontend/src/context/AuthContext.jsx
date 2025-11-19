import React, { useState, createContext, useContext } from 'react';
import '../index.css';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [username, setUsername] = useState(localStorage.getItem('username') || '');

  const login = (name) => {
    setUsername(name);
    localStorage.setItem('username', name);
  };

  const logout = () => {
    setUsername('');
    localStorage.removeItem('username');
  };

  return (
    <AuthContext.Provider value={{ username, login, logout, isAuthenticated: !!username }}>
      {children}
    </AuthContext.Provider>
  );
};
