import React from 'react';

function ChatList({ chats, selectedChatId, onSelectChat }) {
  return (
    <div>
      <h3 style={{ marginBottom: '15px' }}>Chats</h3>
      <div style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
        {chats.length === 0 ? (
          <p style={{ color: '#7f8c8d', fontSize: '14px' }}>No chats yet</p>
        ) : (
          chats.map(chat => (
            <div
              key={chat.chatId}
              onClick={() => onSelectChat(chat.chatId)}
              style={{
                padding: '12px',
                marginBottom: '8px',
                backgroundColor: selectedChatId === chat.chatId ? '#e8f4f8' : 'transparent',
                border: selectedChatId === chat.chatId ? '2px solid #3498db' : '1px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                {chat.title}
              </div>
              {chat.lastMessage && (
                <div style={{
                  fontSize: '12px',
                  color: '#7f8c8d',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {chat.lastMessage}
                </div>
              )}
              <div style={{ fontSize: '10px', color: '#95a5a6', marginTop: '4px' }}>
                {new Date(chat.updatedAt).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ChatList;

