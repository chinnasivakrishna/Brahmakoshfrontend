import React from 'react';

function Home({ user }) {
  return (
    <div>
      <h1>Welcome, {user?.email || 'User'}!</h1>
      <p>This is your dashboard home page.</p>
      
      <div style={{ marginTop: '40px' }}>
        <h2>Quick Actions</h2>
        <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
          <div style={{
            padding: '20px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            flex: 1
          }}>
            <h3>💬 Text Chat</h3>
            <p>Start a conversation with AI using text messages.</p>
          </div>
          
          <div style={{
            padding: '20px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            flex: 1
          }}>
            <h3>🎤 Voice Chat</h3>
            <p>Have a voice-to-voice conversation with AI.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;

