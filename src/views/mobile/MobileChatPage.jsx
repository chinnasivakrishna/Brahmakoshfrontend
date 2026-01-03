import { ref, onMounted } from 'vue';
import { useAuth } from '../../store/auth.js';
import api from '../../services/api.js';

export default {
  name: 'MobileChatPage',
  setup() {
    const { token } = useAuth();
    const chats = ref([]);
    const selectedChatId = ref(null);
    const messages = ref([]);
    const input = ref('');
    const loading = ref(false);
    const chatLoading = ref(true);

    onMounted(async () => {
      await loadChats();
    });

    const loadChats = async () => {
      try {
        const data = await api.getChats(token.value);
        if (data.success) {
          chats.value = data.data.chats;
        }
      } catch (error) {
        console.error('Failed to load chats:', error);
      } finally {
        chatLoading.value = false;
      }
    };

    const loadChat = async (chatId) => {
      try {
        const data = await api.getChat(chatId, token.value);
        if (data.success) {
          messages.value = data.data.messages || [];
        }
      } catch (error) {
        console.error('Failed to load chat:', error);
      }
    };

    const handleNewChat = async () => {
      try {
        const data = await api.createChat(token.value);
        if (data.success) {
          selectedChatId.value = data.data.chatId;
          messages.value = [];
          await loadChats();
        }
      } catch (error) {
        console.error('Failed to create chat:', error);
      }
    };

    const handleSelectChat = async (chatId) => {
      selectedChatId.value = chatId;
      await loadChat(chatId);
    };

    const handleSend = async () => {
      if (!input.value.trim() || loading.value || !selectedChatId.value) return;

      const userMessage = { role: 'user', content: input.value };
      messages.value.push(userMessage);
      const messageText = input.value;
      input.value = '';
      loading.value = true;

      try {
        const data = await api.sendChatMessage(selectedChatId.value, messageText, token.value);
        if (data.success) {
          messages.value.push(data.data.assistantMessage);
          await loadChats(); // Refresh chat list
        }
      } catch (error) {
        console.error('Failed to send message:', error);
        messages.value = messages.value.filter(m => m !== userMessage);
      } finally {
        loading.value = false;
      }
    };

    return () => (
      <div style={{ display: 'flex', height: 'calc(100vh - 40px)', gap: '20px' }}>
        {/* Chat List Sidebar */}
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
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              + New Chat
            </button>
          </div>
          
          {chatLoading.value ? (
            <div>Loading chats...</div>
          ) : chats.value.length === 0 ? (
            <p style={{ color: '#7f8c8d', fontSize: '14px' }}>No chats yet. Create a new chat to start!</p>
          ) : (
            <div style={{ maxHeight: 'calc(100vh - 150px)', overflowY: 'auto' }}>
              {chats.value.map(chat => (
                <div
                  key={chat.chatId}
                  onClick={() => handleSelectChat(chat.chatId)}
                  style={{
                    padding: '12px',
                    marginBottom: '8px',
                    backgroundColor: selectedChatId.value === chat.chatId ? '#e8f4f8' : 'transparent',
                    border: selectedChatId.value === chat.chatId ? '2px solid #3498db' : '1px solid #ddd',
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
              ))}
            </div>
          )}
        </div>
        
        {/* Chat Messages */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {selectedChatId.value ? (
            <>
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px',
                backgroundColor: '#f5f5f5'
              }}>
                {messages.value.map((msg, i) => (
                  <div
                    key={i}
                    style={{
                      marginBottom: '15px',
                      display: 'flex',
                      justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <div style={{
                      maxWidth: '70%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      backgroundColor: msg.role === 'user' ? '#3498db' : '#ecf0f1',
                      color: msg.role === 'user' ? 'white' : '#2c3e50'
                    }}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {loading.value && (
                  <div style={{ textAlign: 'center', color: '#7f8c8d' }}>
                    AI is thinking...
                  </div>
                )}
              </div>

              <div style={{
                padding: '20px',
                borderTop: '1px solid #ddd',
                display: 'flex',
                gap: '10px',
                background: 'white'
              }}>
                <input
                  type="text"
                  value={input.value}
                  onInput={(e) => input.value = e.target.value}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type your message..."
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                  disabled={loading.value}
                />
                <button
                  onClick={handleSend}
                  disabled={loading.value || !input.value.trim()}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#3498db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: loading.value ? 'not-allowed' : 'pointer',
                    opacity: loading.value ? 0.6 : 1
                  }}
                >
                  Send
                </button>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
              <p>Select a chat or create a new one to start chatting.</p>
            </div>
          )}
        </div>
      </div>
    );
  }
};

