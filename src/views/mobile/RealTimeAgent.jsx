import { ref, onMounted, onUnmounted, provide, inject, watch, nextTick, markRaw, computed } from 'vue';
import DailyIframe from '@daily-co/daily-js';
import { useAuth } from '../../store/auth.js';
import api from '../../services/api.js';
import HomeScreen from '../../components/realtime-agent/HomeScreen.jsx';

const STATE_IDLE = 'STATE_IDLE';
const STATE_JOINING = 'STATE_JOINING';
const STATE_JOINED = 'STATE_JOINED';
const STATE_ERROR = 'STATE_ERROR';

// Create a simple state provider for agent state
const createAgentState = () => {
  const hasAgentJoinedRoom = ref(false);
  const isAgentReady = ref(false);
  return {
    hasAgentJoinedRoom,
    isAgentReady,
    setHasAgentJoinedRoom: (value) => { hasAgentJoinedRoom.value = value; },
    setIsAgentReady: (value) => { isAgentReady.value = value; }
  };
};

export default {
  name: 'RealTimeAgent',
  setup() {
    const { getTokenForRole } = useAuth();
    const callObjectRef = ref(null);
    const appState = ref(STATE_IDLE);
    const hasError = ref(false);
    const errorMessage = ref('');
    const showChat = ref(false);
    const meetingState = ref('left-meeting');
    const messages = ref([]);
    const inputValue = ref('');
    const remoteParticipantIds = ref([]);
    const agentId = ref(null);
    const localAudioTrack = ref(null);
    const mutedAudio = ref(false);
    
    // Agent state
    const agentState = createAgentState();
    provide('agentState', agentState);

    // Create call object
    const createCallObject = () => {
      if (!callObjectRef.value) {
        // Create call object - mark as raw to prevent Vue reactivity
        // This prevents DataCloneError when Daily.co tries to serialize
        const callObject = DailyIframe.createCallObject();
        callObjectRef.value = markRaw(callObject);
        
        setupEventListeners();
      }
      return callObjectRef.value;
    };

    // Setup event listeners
    const setupEventListeners = () => {
      const callObject = callObjectRef.value;
      if (!callObject) return;

      // Handle participant updates
      callObject.on('participant-joined', (ev) => {
        if (!ev || !ev.participant) return;
        
        if (ev.participant.local) {
          localAudioTrack.value = ev.participant;
        } else {
          const sessionId = ev.participant.session_id;
          if (sessionId && !remoteParticipantIds.value.includes(sessionId)) {
            remoteParticipantIds.value.push(sessionId);
            agentId.value = sessionId;
            agentState.setHasAgentJoinedRoom(true);
            
            // Send initial greeting - use plain object, not reactive
            try {
              callObject.sendAppMessage({
                event: 'chat-msg',
                message: 'hello',
                name: 'User',
              }, '*');
            } catch (err) {
              console.error('Error sending app message:', err);
            }
          }
        }
      });

      // Handle video track started
      callObject.on('track-started', (ev) => {
        if (ev.participant && !ev.participant.local && ev.track.kind === 'video') {
          nextTick(() => {
            const videoElement = document.getElementById(`daily-video-${ev.participant.session_id}`);
            if (videoElement && ev.track) {
              videoElement.srcObject = new MediaStream([ev.track]);
            }
          });
        }
      });

      callObject.on('participant-left', (ev) => {
        remoteParticipantIds.value = remoteParticipantIds.value.filter(
          id => id !== ev.participant.session_id
        );
        if (ev.participant.local === false) {
          hasError.value = true;
          errorMessage.value = 'Agent left the call';
        }
      });

      // Handle app messages (Lemon Slice events)
      callObject.on('app-message', (ev) => {
        if (!ev || !ev.data) return;
        
        const data = ev.data;
        if (data.type === 'bot_ready') {
          agentState.setIsAgentReady(true);
        }
        if (data.type === 'idle_timeout') {
          hasError.value = true;
          errorMessage.value = 'Agent has hit idle timeout';
        }
        if (data.type === 'daily_error') {
          hasError.value = true;
          const errorMsg = data.error || 'Unknown error';
          const fatal = data.fatal ? String(data.fatal) : 'false';
          errorMessage.value = `A pipeline error occurred. ${errorMsg} fatal:${fatal}`;
        }
        if (data.type === 'video_generation_error') {
          hasError.value = true;
          errorMessage.value = 'A video generation error occurred.';
        }
        
        // Handle chat messages from agent
        if (data.event === 'chat-msg' && data.name !== 'User') {
          messages.value.push({
            msg: String(data.message || ''),
            name: String(data.name || 'Agent'),
          });
        }
      });

      // Handle errors
      callObject.on('error', (ev) => {
        hasError.value = true;
        errorMessage.value = 'An error occurred. Please try again.';
      });

      // Handle meeting state changes
      callObject.on('joined-meeting', () => {
        console.log('Joined meeting event fired');
        meetingState.value = 'joined-meeting';
        appState.value = STATE_JOINED;
        console.log('App state updated to STATE_JOINED:', appState.value);
        console.log('Current appState value:', appState.value === STATE_JOINED);
      });

      callObject.on('left-meeting', () => {
        meetingState.value = 'left-meeting';
        resetDailyState();
      });

      callObject.on('error', (ev) => {
        console.error('Daily.co error:', ev);
        meetingState.value = 'error';
        appState.value = STATE_ERROR;
        hasError.value = true;
        errorMessage.value = ev?.errorMsg || 'Daily call error';
      });
      
      // Also listen to meeting-state event
      callObject.on('meeting-state', (ev) => {
        console.log('Meeting state changed:', ev.meetingState);
        meetingState.value = ev.meetingState;
      });
    };

    // Reset state
    const resetDailyState = () => {
      if (callObjectRef.value) {
        try {
          const currentState = callObjectRef.value.meetingState();
          if (currentState === 'joined-meeting' || currentState === 'joining-meeting') {
            // Use plain object for sendAppMessage
            callObjectRef.value.sendAppMessage({ event: 'force-end' }, '*');
          }
        } catch (error) {
          // Ignore errors
        }
      }
      agentState.setIsAgentReady(false);
      agentState.setHasAgentJoinedRoom(false);
      appState.value = STATE_IDLE;
      hasError.value = false;
      remoteParticipantIds.value = [];
      agentId.value = null;
      messages.value = [];
    };

    // Create call
    const createCall = async () => {
      appState.value = STATE_JOINING;
      try {
        const userToken = getTokenForRole('user') || localStorage.getItem('token_user');
        if (!userToken) {
          throw new Error('User authentication required');
        }

        const room = await api.createRealtimeAgentRoom(userToken);
        // Handle different response structures
        let roomUrl;
        if (room.success && room.data) {
          roomUrl = room.data.room_url;
        } else if (room.room_url) {
          roomUrl = room.room_url;
        } else if (room.data?.room_url) {
          roomUrl = room.data.room_url;
        } else {
          throw new Error('Invalid room URL response from server');
        }
        
        if (!roomUrl) {
          throw new Error('Room URL not found in response');
        }

        const callObject = createCallObject();
        
        // Join with minimal, serializable options only
        // Ensure all values are primitives, not reactive refs
        const joinOptions = {
          url: String(roomUrl),
          userName: 'User',
          startAudioOff: true,
          startVideoOff: true,
        };
        
        await callObject.join(joinOptions);

        // Set state after successful join
        agentState.setHasAgentJoinedRoom(true);
        
        // Update app state immediately to show call view
        // The meeting state event will also fire, but set it here too
        // to ensure UI updates immediately
        const currentMeetingState = callObject.meetingState();
        console.log('Current meeting state after join:', currentMeetingState);
        
        // Force update to show call view - set to JOINED immediately
        // The event will confirm it, but we want to show the UI right away
        appState.value = STATE_JOINED;
        meetingState.value = currentMeetingState || 'joined-meeting';
        console.log('Set appState to JOINED immediately after join');
      } catch (error) {
        console.error('Error creating or joining room', error);
        appState.value = STATE_IDLE;
        hasError.value = true;
        
        // Extract error message from API response if available
        let errorMsg = 'Error creating room. Please check your configuration.';
        if (error.message) {
          errorMsg = error.message;
        } else if (error.response?.data?.message) {
          errorMsg = error.response.data.message;
        } else if (error.response?.data?.error) {
          errorMsg = error.response.data.error;
        }
        
        errorMessage.value = errorMsg;
        console.error('Error message set to:', errorMsg);
      }
    };

    // Leave call
    const leaveCall = () => {
      resetDailyState();
      if (callObjectRef.value && appState.value !== STATE_ERROR) {
        callObjectRef.value.leave();
      }
    };

    // Toggle audio
    const toggleAudio = () => {
      if (callObjectRef.value) {
        const newMuteState = !mutedAudio.value;
        callObjectRef.value.setLocalAudio(newMuteState);
        mutedAudio.value = newMuteState;
      }
    };

    // Send chat message
    const sendMessage = (message) => {
      if (!callObjectRef.value || !message || !String(message).trim()) return;
      
      const messageText = String(message).trim();
      
      try {
        // Use plain object, ensure all values are serializable
        callObjectRef.value.sendAppMessage({
          event: 'chat-msg',
          message: messageText,
          name: 'User',
        }, '*');

        messages.value.push({
          msg: messageText,
          name: 'User',
        });
        inputValue.value = '';
      } catch (error) {
        console.error('Error sending message:', error);
      }
    };

    // Watch meeting state
    watch(meetingState, (newState) => {
      if (!newState) return;

      switch (newState) {
        case 'joined-meeting':
          appState.value = STATE_JOINED;
          break;
        case 'left-meeting':
          resetDailyState();
          break;
        case 'error':
          appState.value = STATE_ERROR;
          hasError.value = true;
          errorMessage.value = 'Daily call error';
          break;
        default:
          break;
      }
    });

    // Watch for participant updates to update audio state
    watch(remoteParticipantIds, () => {
      if (callObjectRef.value) {
        const participants = callObjectRef.value.participants();
        const localParticipant = participants?.local;
        if (localParticipant) {
          mutedAudio.value = localParticipant.audio === false;
        }
      }
    });

    // Setup video rendering when agent joins and element is ready
    watch([agentId, () => agentState.isAgentReady.value], async ([newAgentId, isReady]) => {
      if (newAgentId && isReady && callObjectRef.value) {
        await nextTick();
        const videoElement = document.getElementById(`daily-video-${newAgentId}`);
        if (videoElement && callObjectRef.value) {
          try {
            // Try to get existing video track
            const participants = callObjectRef.value.participants();
            const participant = participants[newAgentId];
            if (participant && participant.videoTrack) {
              videoElement.srcObject = new MediaStream([participant.videoTrack]);
            }
          } catch (error) {
            console.error('Error attaching video:', error);
          }
        }
      }
    });

    onMounted(() => {
      createCallObject();
      
      // Cleanup on beforeunload
      const handleBeforeUnload = () => {
        resetDailyState();
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    });

    onUnmounted(() => {
      resetDailyState();
      if (callObjectRef.value) {
        try {
          const currentState = callObjectRef.value.meetingState();
          if (currentState === 'joined-meeting' || currentState === 'joining-meeting') {
            callObjectRef.value.leave();
          }
        } catch (error) {
          console.error('Error leaving call object:', error);
        }

        try {
          callObjectRef.value.destroy();
        } catch (error) {
          console.error('Error destroying call object:', error);
        } finally {
          callObjectRef.value = null;
        }
      }
    });

    // Show call view if joined or if agent has joined room (even if state is still joining)
    const showCallView = computed(() => {
      const shouldShow = !hasError.value && (
        appState.value === STATE_JOINED || 
        appState.value === STATE_ERROR ||
        (appState.value === STATE_JOINING && agentState.hasAgentJoinedRoom.value)
      );
      console.log('showCallView computed:', {
        hasError: hasError.value,
        appState: appState.value,
        hasAgentJoinedRoom: agentState.hasAgentJoinedRoom.value,
        shouldShow
      });
      return shouldShow;
    });

    return () => {
      console.log('Render function called, appState:', appState.value, 'showCallView:', showCallView.value);
      
      // Error state
      if (hasError.value) {
        return (
          <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ backgroundColor: '#1f2d3d', maxWidth: '480px', width: '100%', padding: '48px', borderRadius: '8px', textAlign: 'center' }}>
              <h1 style={{ color: '#1bebb9', margin: '0 0 16px 0', fontSize: '24px', fontWeight: '600' }}>
                Notification
              </h1>
              <p style={{ color: '#f7f9fa', marginBottom: '24px' }}>{errorMessage.value}</p>
              <button
                onClick={leaveCall}
                style={{
                  backgroundColor: '#1bebb9',
                  color: '#121a24',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Close
              </button>
            </div>
          </div>
        );
      }

      // Call state
      if (showCallView.value) {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            <div style={{ flex: showChat.value ? '0 0 50%' : '1', transition: 'all 0.3s' }}>
              {/* Video area */}
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                {agentId.value && agentState.hasAgentJoinedRoom.value && agentState.isAgentReady.value ? (
                  <div style={{ height: '100%', maxHeight: '560px', maxWidth: '368px', width: '100%', overflow: 'hidden', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', position: 'relative' }}>
                    <video
                      id={`daily-video-${agentId.value}`}
                      autoplay
                      playsinline
                      style={{ height: '100%', width: '100%', objectFit: 'cover' }}
                    ></video>
                  </div>
                ) : (
                  <div style={{ backgroundColor: '#1f2d3d', maxHeight: '560px', maxWidth: '368px', width: '100%', height: '100%', padding: '48px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                    <h1 style={{ color: '#1bebb9', marginBottom: '8px', fontSize: '24px', fontWeight: '600' }}>
                      Waiting for agent
                    </h1>
                    <p style={{ color: '#95a5a6', marginTop: '8px', fontSize: '14px' }}>
                      The agent will join shortly...
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Chat sidebar */}
            <aside
              style={{
                display: showChat.value ? 'flex' : 'none',
                flexDirection: 'column',
                height: '50%',
                width: '100%',
                backgroundColor: '#1f2d3d',
                borderTop: '1px solid #2b3f56',
                position: 'relative'
              }}
            >
              <div style={{ borderBottom: '1px solid #2b3f56', padding: '12px 16px' }}>
                <h2 style={{ color: '#1bebb9', margin: 0, fontSize: '18px', fontWeight: '600' }}>Messages</h2>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                {messages.value.map((message, index) => (
                  <div key={`message-${index}`} style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ color: '#1bebb9', fontSize: '14px', fontWeight: '600' }}>
                        {message?.name}
                      </span>
                      <p style={{ color: '#f7f9fa', margin: 0, textAlign: 'left', fontSize: '14px', lineHeight: '1.5' }}>
                        {message?.msg}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '16px', borderTop: '1px solid #2b3f56' }}>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (inputValue.value.trim()) {
                      sendMessage(inputValue.value);
                    }
                  }}
                  style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
                >
                  <input
                    type="text"
                    placeholder="Message"
                    value={inputValue.value}
                    onInput={(e) => { inputValue.value = e.target.value; }}
                    style={{
                      flex: 1,
                      backgroundColor: '#f7f9fa',
                      color: '#121a24',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      backgroundColor: '#1bebb9',
                      color: '#121a24',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    ➤
                  </button>
                </form>
              </div>
            </aside>

            {/* Control tray */}
            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#1f2d3d', borderTop: '1px solid #2b3f56', zIndex: 50 }}>
              <div style={{ display: 'flex', padding: '16px', justifyContent: 'center', gap: '24px' }}>
                <button
                  onClick={toggleAudio}
                  type="button"
                  style={{
                    backgroundColor: '#1bebb9',
                    color: '#121a24',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px'
                  }}
                >
                  <span>{mutedAudio.value ? '🔇' : '🎤'}</span>
                  <span>{mutedAudio.value ? 'Unmute mic' : 'Mute mic'}</span>
                </button>

                <button
                  onClick={leaveCall}
                  type="button"
                  style={{
                    backgroundColor: '#1bebb9',
                    color: '#121a24',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px'
                  }}
                >
                  <span>📞</span>
                  <span>Leave call</span>
                </button>

                <button
                  onClick={() => { showChat.value = !showChat.value; }}
                  type="button"
                  style={{
                    backgroundColor: '#1bebb9',
                    color: '#121a24',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px'
                  }}
                >
                  <span>💬</span>
                  <span>{showChat.value ? 'Hide Chat' : 'Chat'}</span>
                </button>
              </div>
            </div>

            {/* Daily audio container */}
            <div id="daily-audio-container" style={{ display: 'none' }}></div>
          </div>
        );
      }

      // Home screen
      return (
        <HomeScreen
          createCall={createCall}
          creatingRoom={appState.value === STATE_JOINING}
        />
      );
    };
  }
};
