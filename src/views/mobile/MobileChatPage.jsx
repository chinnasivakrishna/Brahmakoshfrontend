import { ref, onMounted } from 'vue';
import { useAuth } from '../../store/auth.js';
import api from '../../services/api.js';

export default {
  name: 'MobileChatPage',
  setup() {
    const { token, getTokenForRole } = useAuth();
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
        // CRITICAL: Mobile endpoints MUST use user token ONLY
        // Get token explicitly for user role - never use other roles
        const userToken = getTokenForRole('user') || localStorage.getItem('token_user');
        
        // Verify token is actually a user token
        if (userToken) {
          try {
            const payload = JSON.parse(atob(userToken.split('.')[1]));
            if (payload.role !== 'user') {
              console.error('[MobileChatPage] Wrong token role detected:', {
                tokenRole: payload.role,
                requiredRole: 'user',
                message: 'Rejecting non-user token'
              });
              throw new Error('Invalid token. Please login as a user.');
            }
          } catch (e) {
            if (e.message.includes('Invalid token')) throw e;
            console.warn('[MobileChatPage] Could not verify token:', e);
          }
        }
        
        // Debug logging
        console.log('[MobileChatPage] Loading chats:', {
          hasUserToken: !!userToken,
          tokenLength: userToken ? userToken.length : 0,
          tokenPreview: userToken ? userToken.substring(0, 20) + '...' : 'none',
          localStorageToken: localStorage.getItem('token_user'),
          otherTokensPresent: {
            admin: !!localStorage.getItem('token_admin'),
            client: !!localStorage.getItem('token_client'),
            superAdmin: !!localStorage.getItem('token_super_admin')
          }
        });
        
        if (!userToken) {
          console.error('[MobileChatPage] No user token available');
          const otherRoles = [];
          if (localStorage.getItem('token_admin')) otherRoles.push('admin');
          if (localStorage.getItem('token_client')) otherRoles.push('client');
          if (localStorage.getItem('token_super_admin')) otherRoles.push('super_admin');
          
          if (otherRoles.length > 0) {
            throw new Error(`You are logged in as ${otherRoles.join('/')}, but this feature requires user login. Please logout and login as a user.`);
          }
          throw new Error('Authentication required. Please login as a user.');
        }
        
        const data = await api.getChats(userToken);
        if (data.success) {
          chats.value = data.data.chats;
        }
      } catch (error) {
        console.error('[MobileChatPage] Failed to load chats:', {
          error: error.message,
          hasUserToken: !!localStorage.getItem('token_user')
        });
      } finally {
        chatLoading.value = false;
      }
    };

    const loadChat = async (chatId) => {
      try {
        const userToken = getTokenForRole('user') || localStorage.getItem('token_user');
        if (!userToken) throw new Error('User token required');
        const data = await api.getChat(chatId, userToken);
        if (data.success) {
          messages.value = data.data.messages || [];
        }
      } catch (error) {
        console.error('Failed to load chat:', error);
      }
    };

    const handleNewChat = async () => {
      try {
        const userToken = getTokenForRole('user') || localStorage.getItem('token_user');
        if (!userToken) throw new Error('User token required');
        const data = await api.createChat(userToken);
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
        const userToken = getTokenForRole('user') || localStorage.getItem('token_user');
        if (!userToken) throw new Error('User token required');
        const data = await api.sendChatMessage(selectedChatId.value, messageText, userToken);
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

