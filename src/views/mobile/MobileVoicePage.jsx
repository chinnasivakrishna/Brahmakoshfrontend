import { ref, onMounted } from 'vue';
import { useAuth } from '../../store/auth.js';
import api from '../../services/api.js';

export default {
  name: 'MobileVoicePage',
  setup() {
    const { token } = useAuth();
    const chatId = ref(null);
    const isRecording = ref(false);
    const transcript = ref('');
    const response = ref('');
    const isProcessing = ref(false);
    const mediaRecorderRef = ref(null);
    const audioChunksRef = ref([]);

    onMounted(async () => {
      await initializeSession();
    });

    const initializeSession = async () => {
      try {
        const data = await api.startVoiceSession(token.value);
        if (data.success) {
          chatId.value = data.data.chatId;
        }
      } catch (error) {
        console.error('Failed to initialize voice session:', error);
      }
    };

    const blobToBase64 = (blob) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    };

    const startRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm'
        });

        audioChunksRef.value = [];
        
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.value.push(e.data);
          }
        };

        mediaRecorder.onstop = async () => {
          await processAudio();
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorderRef.value = mediaRecorder;
        mediaRecorder.start();
        isRecording.value = true;
      } catch (error) {
        console.error('Failed to start recording:', error);
        alert('Microphone access denied. Please allow microphone access.');
      }
    };

    const stopRecording = () => {
      if (mediaRecorderRef.value && isRecording.value) {
        mediaRecorderRef.value.stop();
        isRecording.value = false;
      }
    };

    const processAudio = async () => {
      if (audioChunksRef.value.length === 0 || !chatId.value) return;

      isProcessing.value = true;
      transcript.value = '';
      response.value = '';

      try {
        const audioBlob = new Blob(audioChunksRef.value, { type: 'audio/webm' });
        const base64Audio = await blobToBase64(audioBlob);

        const data = await api.processVoice(chatId.value, base64Audio, token.value, 'webm');
        
        if (data.success) {
          transcript.value = data.data.transcribedText;
          response.value = data.data.aiResponse;

          // Play audio response if available
          if (data.data.audioResponse) {
            const audio = new Audio(`data:audio/mp3;base64,${data.data.audioResponse}`);
            
            // Wait for audio to finish playing, then auto-start next recording
            audio.onended = () => {
              // Auto-start next recording for continuous interaction
              setTimeout(() => {
                if (!isProcessing.value) {
                  startRecording();
                }
              }, 500); // Small delay before starting next recording
            };
            
            audio.onerror = (err) => {
              console.error('Failed to play audio:', err);
              // Still auto-start next recording even if audio fails
              setTimeout(() => {
                if (!isProcessing.value) {
                  startRecording();
                }
              }, 1000);
            };
            
            await audio.play().catch(err => {
              console.error('Failed to play audio:', err);
              // Auto-start next recording even if play fails
              setTimeout(() => {
                if (!isProcessing.value) {
                  startRecording();
                }
              }, 1000);
            });
          } else {
            // If no audio response, still auto-start next recording after a delay
            setTimeout(() => {
              if (!isProcessing.value) {
                startRecording();
              }
            }, 2000);
          }
        }
      } catch (error) {
        console.error('Failed to process audio:', error);
        alert('Failed to process audio. Please try again.');
        // Auto-start next recording even on error
        setTimeout(() => {
          if (!isProcessing.value) {
            startRecording();
          }
        }, 2000);
      } finally {
        isProcessing.value = false;
        audioChunksRef.value = [];
      }
    };

    return () => (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        <h1 style={{ marginBottom: '30px' }}>Voice Chat</h1>
        
        <div style={{
          textAlign: 'center',
          padding: '40px',
          border: '2px dashed #ddd',
          borderRadius: '12px',
          marginBottom: '30px',
          background: 'white'
        }}>
          <button
            onClick={isRecording.value ? stopRecording : startRecording}
            disabled={isProcessing.value}
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: isRecording.value ? '#e74c3c' : '#3498db',
              color: 'white',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: isProcessing.value ? 'not-allowed' : 'pointer',
              opacity: isProcessing.value ? 0.6 : 1,
              transition: 'all 0.3s'
            }}
          >
            {isProcessing.value ? '⏳' : isRecording.value ? '⏹ Stop' : '🎤 Start'}
          </button>
          <p style={{ marginTop: '20px', color: '#7f8c8d' }}>
            {isRecording.value 
              ? 'Recording... Click to stop' 
              : isProcessing.value 
              ? 'Processing...' 
              : 'Click to start recording'}
          </p>
        </div>

        {transcript.value && (
          <div style={{
            padding: '15px',
            backgroundColor: '#e8f4f8',
            borderRadius: '8px',
            marginBottom: '15px'
          }}>
            <strong>You said:</strong> {transcript.value}
          </div>
        )}

        {response.value && (
          <div style={{
            padding: '15px',
            backgroundColor: '#f0f0f0',
            borderRadius: '8px'
          }}>
            <strong>AI Response:</strong> {response.value}
          </div>
        )}

        <div style={{ marginTop: '30px', fontSize: '14px', color: '#7f8c8d' }}>
          <p>💡 Tip: Speak clearly and wait for the AI response before asking the next question.</p>
          <p>Chat ID: {chatId.value || 'Not initialized'}</p>
        </div>
      </div>
    );
  }
};

