import { ref, onMounted, onUnmounted } from 'vue';
import { useAuth } from '../../store/auth.js';

export default {
  name: 'VoiceAgentPage',
  setup() {
    const { token, user } = useAuth();
    const chatId = ref(null);
    const isActive = ref(false);
    const transcript = ref('');
    const interimTranscript = ref('');
    const response = ref('');
    const isProcessing = ref(false);
    const connectionStatus = ref('disconnected');
    const conversationHistory = ref([]);
    const debugLog = ref([]);
    
    // WebSocket and media
    let ws = null;
    let mediaRecorder = null;
    let mediaStream = null;
    let audioContext = null;
    let audioQueue = [];
    let isPlayingAudio = ref(false);
    let audioWorkletNode = null;
    let scriptProcessorNode = null;

    // Helper to add debug messages
    const addDebugLog = (message) => {
      const timestamp = new Date().toLocaleTimeString();
      debugLog.value.push(`[${timestamp}] ${message}`);
      console.log(`[VoiceAgent Debug] ${message}`);
      if (debugLog.value.length > 20) {
        debugLog.value.shift();
      }
    };

    onMounted(() => {
      console.log('[VoiceAgent] Component mounted');
      addDebugLog('Component mounted - Ready to start');
    });

    onUnmounted(() => {
      cleanup();
    });

    // Convert Float32Array to 16-bit PCM
    const floatTo16BitPCM = (float32Array) => {
      const buffer = new ArrayBuffer(float32Array.length * 2);
      const view = new DataView(buffer);
      let offset = 0;
      for (let i = 0; i < float32Array.length; i++, offset += 2) {
        const s = Math.max(-1, Math.min(1, float32Array[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      }
      return buffer;
    };

    // Downsample audio from 48kHz to 16kHz
    const downsampleBuffer = (buffer, fromSampleRate, toSampleRate) => {
      if (fromSampleRate === toSampleRate) {
        return buffer;
      }
      const sampleRateRatio = fromSampleRate / toSampleRate;
      const newLength = Math.round(buffer.length / sampleRateRatio);
      const result = new Float32Array(newLength);
      let offsetResult = 0;
      let offsetBuffer = 0;
      while (offsetResult < result.length) {
        const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
        let accum = 0;
        let count = 0;
        for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
          accum += buffer[i];
          count++;
        }
        result[offsetResult] = accum / count;
        offsetResult++;
        offsetBuffer = nextOffsetBuffer;
      }
      return result;
    };

    // Start voice agent session
    const startSession = async () => {
      try {
        addDebugLog('START button clicked');
        console.log('[VoiceAgent] Starting session...');
        connectionStatus.value = 'connecting';

        // Setup WebSocket connection
        const wsUrl = 'ws://localhost:5000/api/voice/agent';
        
        addDebugLog(`Connecting to WebSocket: ${wsUrl}`);
        console.log('[VoiceAgent] Connecting to WebSocket:', wsUrl);
        ws = new WebSocket(wsUrl);

        ws.onopen = async () => {
          addDebugLog('WebSocket connected successfully');
          console.log('[VoiceAgent] WebSocket connected');
          connectionStatus.value = 'connected';

          try {
            // Get microphone access
            addDebugLog('Requesting microphone access...');
            console.log('[VoiceAgent] Requesting microphone access...');
            mediaStream = await navigator.mediaDevices.getUserMedia({
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: 48000, // Browser default
                channelCount: 1
              }
            });
            addDebugLog('Microphone access granted');
            console.log('[VoiceAgent] Microphone access granted');

            // Initialize audio context for recording
            audioContext = new (window.AudioContext || window.webkitAudioContext)({
              sampleRate: 48000
            });
            addDebugLog(`Audio context initialized (sampleRate: ${audioContext.sampleRate})`);

            const source = audioContext.createMediaStreamSource(mediaStream);

            // Try to use ScriptProcessorNode (more compatible)
            // Process audio in chunks and send as PCM
            const bufferSize = 4096;
            scriptProcessorNode = audioContext.createScriptProcessor(bufferSize, 1, 1);
            
            let audioChunksSent = 0;

            scriptProcessorNode.onaudioprocess = (e) => {
              if (!ws || ws.readyState !== WebSocket.OPEN || !isActive.value) {
                return;
              }

              const inputData = e.inputBuffer.getChannelData(0);
              
              // Downsample from 48kHz to 16kHz
              const downsampled = downsampleBuffer(inputData, 48000, 16000);
              
              // Convert to 16-bit PCM
              const pcmData = floatTo16BitPCM(downsampled);
              
              // Send to backend
              const base64Audio = arrayBufferToBase64(pcmData);
              ws.send(JSON.stringify({
                type: 'audio',
                audio: base64Audio
              }));

              audioChunksSent++;
              if (audioChunksSent % 50 === 0) {
                addDebugLog(`Sent ${audioChunksSent} audio chunks (PCM 16kHz)`);
              }
            };

            source.connect(scriptProcessorNode);
            scriptProcessorNode.connect(audioContext.destination);

            addDebugLog('Audio processing pipeline configured (PCM 16kHz)');

            // Send start command
            const startCommand = {
              type: 'start',
              chatId: chatId.value,
              userId: user.value?._id,
              token: token.value
            };
            addDebugLog(`Sending start command (userId: ${user.value?._id})`);
            console.log('[VoiceAgent] Sending start command to backend:', startCommand);
            ws.send(JSON.stringify(startCommand));

          } catch (micError) {
            addDebugLog(`Microphone error: ${micError.message}`);
            console.error('[VoiceAgent] Microphone error:', micError);
            if (micError.name === 'NotAllowedError') {
              alert('Microphone access denied. Please allow microphone access.');
            } else {
              alert(`Failed to access microphone: ${micError.message}`);
            }
            cleanup();
          }
        };

        ws.onmessage = async (event) => {
          const data = JSON.parse(event.data);
          addDebugLog(`Received: ${data.type}`);
          console.log('[VoiceAgent] Received message:', data.type, data);

          switch (data.type) {
            case 'started':
              addDebugLog(`Backend started - chatId: ${data.chatId}`);
              console.log('[VoiceAgent] Backend confirmed start, chatId:', data.chatId);
              chatId.value = data.chatId;
              isActive.value = true;
              break;

            case 'deepgram_connected':
              addDebugLog('Deepgram connected - ready to transcribe');
              connectionStatus.value = 'active';
              break;

            case 'transcript':
              if (data.isFinal) {
                transcript.value = data.text;
                interimTranscript.value = '';
                addDebugLog(`Final transcript: ${data.text}`);
              } else {
                interimTranscript.value = data.text;
              }
              break;

            case 'user_message':
              addDebugLog(`User message saved: ${data.text.substring(0, 50)}...`);
              conversationHistory.value.push({
                role: 'user',
                content: data.text,
                timestamp: new Date()
              });
              transcript.value = '';
              isProcessing.value = true;
              break;

            case 'ai_response':
              addDebugLog(`AI response received: ${data.text.substring(0, 50)}...`);
              response.value = data.text;
              conversationHistory.value.push({
                role: 'assistant',
                content: data.text,
                timestamp: new Date()
              });
              isProcessing.value = false;
              break;

            case 'audio_chunk':
              const audioData = base64ToArrayBuffer(data.audio);
              audioQueue.push(audioData);
              
              if (!isPlayingAudio.value) {
                playAudioQueue();
              }
              break;

            case 'audio_complete':
              addDebugLog(`Audio complete: ${data.totalChunks} chunks`);
              console.log('[VoiceAgent] Audio complete:', data.totalChunks, 'chunks');
              break;

            case 'stopped':
              addDebugLog('Session stopped by backend');
              cleanup();
              break;

            case 'error':
              addDebugLog(`ERROR: ${data.message}`);
              console.error('[VoiceAgent] Error:', data.message);
              alert(data.message);
              break;
          }
        };

        ws.onerror = (error) => {
          addDebugLog(`WebSocket error: ${error.message || 'Unknown error'}`);
          console.error('[VoiceAgent] WebSocket error:', error);
          connectionStatus.value = 'error';
          alert('Failed to connect to voice agent. Please check if the server is running.');
        };

        ws.onclose = (event) => {
          addDebugLog(`WebSocket closed (code: ${event.code}, reason: ${event.reason || 'None'})`);
          console.log('[VoiceAgent] WebSocket closed', event);
          connectionStatus.value = 'disconnected';
          if (isActive.value) {
            alert('Connection lost. Please try again.');
          }
          cleanup();
        };

        addDebugLog('Session initialization complete, waiting for backend...');
        console.log('[VoiceAgent] Session initialization complete');

      } catch (error) {
        addDebugLog(`Failed to start: ${error.message}`);
        console.error('[VoiceAgent] Failed to start session:', error);
        connectionStatus.value = 'error';
        if (error.name === 'NotAllowedError') {
          alert('Microphone access denied. Please allow microphone access.');
        } else {
          alert(`Failed to start: ${error.message}`);
        }
        cleanup();
      }
    };

    // Stop session
    const stopSession = () => {
      console.log('[VoiceAgent] Stopping session...');
      
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'stop' }));
      }
      
      cleanup();
    };

    // Cleanup resources
    const cleanup = () => {
      console.log('[VoiceAgent] Cleaning up...');

      isActive.value = false;
      isProcessing.value = false;
      connectionStatus.value = 'disconnected';

      if (scriptProcessorNode) {
        scriptProcessorNode.disconnect();
        scriptProcessorNode = null;
      }

      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
      }

      if (audioContext) {
        audioContext.close();
        audioContext = null;
      }

      if (ws) {
        ws.close();
        ws = null;
      }

      audioQueue = [];
      isPlayingAudio.value = false;
    };

    // Play queued audio chunks
    const playAudioQueue = async () => {
      if (isPlayingAudio.value || audioQueue.length === 0) {
        return;
      }

      isPlayingAudio.value = true;

      try {
        // Create audio context for playback if needed
        if (!audioContext || audioContext.state === 'closed') {
          audioContext = new (window.AudioContext || window.webkitAudioContext)({
            sampleRate: 24000
          });
        }

        while (audioQueue.length > 0) {
          const audioData = audioQueue.shift();
          await playAudioChunk(audioData);
        }
      } catch (error) {
        console.error('[VoiceAgent] Audio playback error:', error);
      } finally {
        isPlayingAudio.value = false;
      }
    };

    // Play single audio chunk
    const playAudioChunk = async (audioData) => {
      return new Promise((resolve, reject) => {
        if (!audioContext) {
          reject(new Error('AudioContext not initialized'));
          return;
        }

        audioContext.decodeAudioData(
          audioData,
          (buffer) => {
            const source = audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContext.destination);
            
            source.onended = () => resolve();
            source.start(0);
          },
          (error) => {
            console.error('[VoiceAgent] Audio decode error:', error);
            resolve();
          }
        );
      });
    };

    // Helper: Convert ArrayBuffer to base64
    const arrayBufferToBase64 = (buffer) => {
      let binary = '';
      const bytes = new Uint8Array(buffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    };

    // Helper: Convert base64 to ArrayBuffer
    const base64ToArrayBuffer = (base64) => {
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes.buffer;
    };

    // Format timestamp
    const formatTime = (date) => {
      return new Date(date).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    return () => (
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
        <h1 style={{ marginBottom: '10px' }}>🎙️ Voice Agent</h1>
        <p style={{ color: '#666', marginBottom: '30px' }}>
          Powered by Deepgram + OpenAI + ElevenLabs
        </p>

        {/* Status Bar */}
        <div style={{
          padding: '15px',
          backgroundColor: connectionStatus.value === 'active' ? '#d4edda' : 
                          connectionStatus.value === 'connected' ? '#fff3cd' : 
                          connectionStatus.value === 'error' ? '#f8d7da' : '#f8f9fa',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <strong>Status:</strong> {
              connectionStatus.value === 'active' ? '🟢 Active' :
              connectionStatus.value === 'connected' ? '🟡 Connecting...' :
              connectionStatus.value === 'error' ? '🔴 Error' :
              '⚪ Disconnected'
            }
            {chatId.value && <span style={{ marginLeft: '15px' }}>
              <strong>Chat ID:</strong> {chatId.value}
            </span>}
          </div>
          {isProcessing.value && (
            <span style={{ color: '#007bff' }}>
              ⏳ Processing...
            </span>
          )}
        </div>

        {/* Control Button */}
        <div style={{
          textAlign: 'center',
          padding: '40px',
          border: '2px dashed #ddd',
          borderRadius: '12px',
          marginBottom: '30px',
          background: 'white'
        }}>
          <button
            onClick={isActive.value ? stopSession : startSession}
            disabled={connectionStatus.value === 'connected'}
            style={{
              width: '140px',
              height: '140px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: isActive.value ? '#dc3545' : '#28a745',
              color: 'white',
              fontSize: '20px',
              fontWeight: 'bold',
              cursor: connectionStatus.value === 'connected' ? 'not-allowed' : 'pointer',
              opacity: connectionStatus.value === 'connected' ? 0.6 : 1,
              transition: 'all 0.3s',
              boxShadow: isActive.value ? '0 0 20px rgba(220, 53, 69, 0.5)' : '0 0 20px rgba(40, 167, 69, 0.5)'
            }}
          >
            {connectionStatus.value === 'connected' ? '⏳ Connecting...' :
             isActive.value ? '⏹ Stop' : '▶️ Start'}
          </button>
          <p style={{ marginTop: '20px', color: '#6c757d', fontSize: '14px' }}>
            {isActive.value 
              ? 'Speak naturally. AI will respond after you pause.'
              : 'Click to start your voice conversation'}
          </p>
        </div>

        {/* Live Transcript */}
        {(transcript.value || interimTranscript.value) && (
          <div style={{
            padding: '15px',
            backgroundColor: '#e7f3ff',
            borderRadius: '8px',
            marginBottom: '15px',
            minHeight: '60px'
          }}>
            <strong>🎤 You're saying:</strong>
            <div style={{ marginTop: '10px', fontSize: '16px' }}>
              {transcript.value && (
                <span style={{ color: '#333' }}>{transcript.value} </span>
              )}
              {interimTranscript.value && (
                <span style={{ color: '#999', fontStyle: 'italic' }}>
                  {interimTranscript.value}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Current AI Response */}
        {response.value && (
          <div style={{
            padding: '15px',
            backgroundColor: '#f0f0f0',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <strong>🤖 AI Response:</strong>
            <div style={{ marginTop: '10px', fontSize: '16px' }}>
              {response.value}
            </div>
            {isPlayingAudio.value && (
              <div style={{ marginTop: '10px', color: '#007bff' }}>
                🔊 Playing audio...
              </div>
            )}
          </div>
        )}

        {/* Conversation History */}
        {conversationHistory.value.length > 0 && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #ddd',
            maxHeight: '500px',
            overflowY: 'auto'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>
              💬 Conversation History
            </h3>
            {conversationHistory.value.map((msg, index) => (
              <div
                key={index}
                style={{
                  padding: '12px',
                  marginBottom: '10px',
                  borderRadius: '8px',
                  backgroundColor: msg.role === 'user' ? '#e7f3ff' : '#f8f9fa',
                  borderLeft: `4px solid ${msg.role === 'user' ? '#007bff' : '#6c757d'}`
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '5px'
                }}>
                  <strong style={{ color: msg.role === 'user' ? '#007bff' : '#6c757d' }}>
                    {msg.role === 'user' ? '👤 You' : '🤖 AI'}
                  </strong>
                  <span style={{ fontSize: '12px', color: '#999' }}>
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
                <div>{msg.content}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tips */}
        <div style={{
          marginTop: '30px',
          padding: '20px',
          backgroundColor: '#fff3cd',
          borderRadius: '8px',
          fontSize: '14px'
        }}>
          <h4 style={{ marginTop: 0 }}>💡 Tips for Best Results:</h4>
          <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
            <li>Speak clearly and naturally</li>
            <li>Pause for 2 seconds after finishing to trigger AI response</li>
            <li>Wait for AI to finish speaking before continuing</li>
            <li>Use headphones to prevent audio feedback</li>
            <li>Ensure good internet connection for streaming</li>
          </ul>
        </div>

        {/* Debug Log */}
        {debugLog.value.length > 0 && (
          <div style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            fontSize: '12px',
            fontFamily: 'monospace',
            maxHeight: '300px',
            overflowY: 'auto',
            border: '1px solid #dee2e6'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px'
            }}>
              <strong>🔍 Debug Log</strong>
              <button
                onClick={() => debugLog.value = []}
                style={{
                  padding: '4px 8px',
                  fontSize: '11px',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                Clear
              </button>
            </div>
            {debugLog.value.map((log, index) => (
              <div key={index} style={{ marginBottom: '3px', color: '#495057' }}>
                {log}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
};