import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Home from '../pages/Home';
import ChatPage from '../pages/ChatPage';
import VoicePage from '../pages/VoicePage';

function Dashboard({ user, token, onLogout }) {
  const [activePage, setActivePage] = useState('home');

  const renderPage = () => {
    switch (activePage) {
      case 'home':
        return <Home user={user} />;
      case 'chat':
        return <ChatPage token={token} />;
      case 'voice':
        return <VoicePage token={token} />;
      default:
        return <Home user={user} />;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar 
        activePage={activePage} 
        setActivePage={setActivePage}
        user={user}
        onLogout={onLogout}
      />
      <main style={{ flex: 1, padding: '20px', overflow: 'auto' }}>
        {renderPage()}
      </main>
    </div>
  );
}

export default Dashboard;

