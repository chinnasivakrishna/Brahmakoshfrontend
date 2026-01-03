import React, { useState, useEffect } from 'react';
import ChatList from '../components/ChatList';
import Chat from '../components/Chat';
import { createChat, getChats, getChat } from '../services/api';

function ChatPage({ token }) {
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      const data = await getChats(token);
      if (data.success) {
        setChats(data.data.chats);
      }
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = async () => {
    try {
      const data = await createChat(token);
      if (data.success) {
        setSelectedChatId(data.data.chatId);
        loadChats();
      }
    } catch (error) {
      console.error('Failed to create chat:', error);
    }
  };

  const handleSelectChat = (chatId) => {
    setSelectedChatId(chatId);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 40px)', gap: '20px' }}>
      <div style={{ width: '300px', borderRight: '1px solid #ddd', paddingRight: '20px' }}>
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={handleNewChat}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            + New Chat
          </button>
        </div>
        <ChatList
          chats={chats}
          selectedChatId={selectedChatId}
          onSelectChat={handleSelectChat}
        />
      </div>
      
      <div style={{ flex: 1 }}>
        {selectedChatId ? (
          <Chat chatId={selectedChatId} token={token} />
        ) : (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>Select a chat or create a new one to start chatting.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatPage;

