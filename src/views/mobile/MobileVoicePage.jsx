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
    const isPlaybackActive = ref(false);
    const mediaRecorderRef = ref(null);
    const mediaStreamRef = ref(null);
    const audioChunksRef = ref([]);
    const isSessionActive = ref(false);
    const silenceTimeoutRef = ref(null);
    const audioContextRef = ref(null);
    const analyserRef = ref(null);
    const silenceDetectionIntervalRef = ref(null);
    const lastSoundTimeRef = ref(Date.now());
    const segmentHasSpeechRef = ref(false);
    let ttsUtteranceRef = null;
    const isPlayingResponse = ref(false);
    const SILENCE_THRESHOLD = 2000; // 2 seconds of silence
    const AUDIO_THRESHOLD = 0.01; // Audio level threshold for detecting speech

    onMounted(async () => {
      await initializeSession();
    });

    const initializeSession = async () => {
      console.log('[Voice] Initializing voice session...', { hasToken: !!token.value });
      try {
        const data = await api.startVoiceSession(token.value);
        console.log('[Voice] Session initialized:', { success: data.success, chatId: data.data?.chatId });
        if (data.success) {
          chatId.value = data.data.chatId;
          console.log('[Voice] Chat ID set:', chatId.value);
        } else {
          console.error('[Voice] Session initialization failed:', data);
          alert('Failed to initialize voice session. Please try again.');
        }
      } catch (error) {
        console.error('[Voice] Failed to initialize voice session:', {
          error: error.message,
          stack: error.stack,
          response: error.response?.data
        });
        alert(`Failed to initialize voice session: ${error.message || 'Unknown error'}`);
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

    const startContinuousSession = async () => {
      console.log('[Voice] Starting continuous session...', { chatId: chatId.value });
      try {
        if (!chatId.value) {
          console.warn('[Voice] No chatId, initializing session first...');
          await initializeSession();
          if (!chatId.value) {
            throw new Error('Failed to get chat ID. Please try again.');
          }
        }

        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });
        console.log('[Voice] Microphone access granted');
        mediaStreamRef.value = stream;

        // Set up audio context for silence detection
        audioContextRef.value = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContextRef.value.createMediaStreamSource(stream);
        analyserRef.value = audioContextRef.value.createAnalyser();
        analyserRef.value.fftSize = 2048;
        source.connect(analyserRef.value);

        // Try different MIME types in order of preference (prefer WAV/PCM for ffmpeg friendliness)
        const mimeTypes = [
          'audio/wav',
          'audio/ogg;codecs=opus',
          'audio/ogg',
          'audio/webm;codecs=opus',
          'audio/webm',
          'audio/mp4',
          'audio/mpeg'
        ];
        
        let selectedMimeType = null;
        for (const mimeType of mimeTypes) {
          if (MediaRecorder.isTypeSupported(mimeType)) {
            selectedMimeType = mimeType;
            console.log('[Voice] Selected MIME type:', mimeType);
            break;
          }
        }

        if (!selectedMimeType) {
          console.warn('[Voice] No supported MIME type found, using default');
          selectedMimeType = 'audio/webm';
        }

        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: selectedMimeType
        });

        audioChunksRef.value = [];
        lastSoundTimeRef.value = Date.now();
        segmentHasSpeechRef.value = false;
        
        mediaRecorder.ondataavailable = (e) => {
          // Drop chunks while playback is active to avoid re-recording TTS/response audio
          if (isPlaybackActive.value) return;
          if (e.data.size > 0 && isSessionActive.value) {
            console.log('[Voice] Audio chunk received:', { size: e.data.size, type: e.data.type });
            audioChunksRef.value.push(e.data);
          }
        };

        mediaRecorder.onerror = (event) => {
          console.error('[Voice] MediaRecorder error:', event.error);
          alert('Recording error occurred. Please try again.');
          stopContinuousSession();
        };

        mediaRecorderRef.value = mediaRecorder;
        mediaRecorder.start(100); // Collect data every 100ms
        isRecording.value = true;
        isSessionActive.value = true;
        console.log('[Voice] Continuous session started successfully');

        // Start silence detection
        startSilenceDetection();
      } catch (error) {
        console.error('[Voice] Failed to start continuous session:', {
          error: error.name,
          message: error.message,
          stack: error.stack
        });
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          alert('Microphone access denied. Please allow microphone access in your browser settings.');
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          alert('No microphone found. Please connect a microphone and try again.');
        } else {
          alert(`Failed to start session: ${error.message}`);
        }
        isRecording.value = false;
        isSessionActive.value = false;
      }
    };

    const startSilenceDetection = () => {
      console.log('[Voice] Starting silence detection...');
      
      silenceDetectionIntervalRef.value = setInterval(() => {
        if (!analyserRef.value || !isSessionActive.value || isProcessing.value || isPlaybackActive.value) return;

        const bufferLength = analyserRef.value.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.value.getByteTimeDomainData(dataArray);

        // Calculate audio level
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          const normalized = (dataArray[i] - 128) / 128;
          sum += normalized * normalized;
        }
        const rms = Math.sqrt(sum / bufferLength);

        // Check if there's sound
        if (rms > AUDIO_THRESHOLD) {
          lastSoundTimeRef.value = Date.now();
          // Mark that this segment has speech above threshold
          segmentHasSpeechRef.value = true;
        }

        // Check for silence
        const silenceDuration = Date.now() - lastSoundTimeRef.value;
        if (silenceDuration >= SILENCE_THRESHOLD && audioChunksRef.value.length > 0) {
          console.log('[Voice] Silence detected for', silenceDuration, 'ms, stopping recorder to process...');
          stopAndProcessSegment();
        }
      }, 100); // Check every 100ms
    };

    const stopAndProcessSegment = async () => {
      if (isProcessing.value || audioChunksRef.value.length === 0) return;
      if (!mediaRecorderRef.value || mediaRecorderRef.value.state === 'inactive') return;

      // If we never detected speech in this segment, skip sending to Deepgram
      if (!segmentHasSpeechRef.value) {
        console.log('[Voice] Segment had no detected speech, skipping processing');
        audioChunksRef.value = [];
        lastSoundTimeRef.value = Date.now();
        segmentHasSpeechRef.value = false;
        return;
      }

      isProcessing.value = true;
      console.log('[Voice] Stopping MediaRecorder to finalize audio segment with speech...');
      
      // Store the stream before stopping
      const currentStream = mediaRecorderRef.value.stream || mediaStreamRef.value;
      
      // Stop the current recorder to finalize the audio with proper headers
      const stopPromise = new Promise((resolveStop) => {
        if (mediaRecorderRef.value) {
          const handler = () => {
            mediaRecorderRef.value.removeEventListener('stop', handler);
            resolveStop();
          };
          mediaRecorderRef.value.addEventListener('stop', handler);
        } else {
          resolveStop();
        }
      });
      mediaRecorderRef.value.stop();
      
      // Wait for recorder stop and ensure all chunks are flushed (longer delay for reliability)
      await stopPromise;
      await new Promise(resolve => setTimeout(resolve, 500)); // Increased from 200ms to 500ms
      
      console.log('[Voice] Processing audio segment, total chunks:', audioChunksRef.value.length);
      const chunksToProcess = [...audioChunksRef.value];
      audioChunksRef.value = []; // Clear for next segment
      
      // Process the finalized audio
      await processAudio(chunksToProcess);
      
      // Restart recording if session is still active
      if (isSessionActive.value && currentStream) {
        console.log('[Voice] Restarting MediaRecorder for next segment...');
        restartMediaRecorder(currentStream);
      }
      
      lastSoundTimeRef.value = Date.now(); // Reset silence timer
      segmentHasSpeechRef.value = false;
      isProcessing.value = false;
    };

    const restartMediaRecorder = (stream) => {
      try {
        // Try different MIME types (prefer WAV/PCM for ffmpeg friendliness)
        const mimeTypes = [
          'audio/wav',
          'audio/ogg;codecs=opus',
          'audio/ogg',
          'audio/webm;codecs=opus',
          'audio/webm',
          'audio/mp4'
        ];
        
        let selectedMimeType = 'audio/webm';
        for (const mimeType of mimeTypes) {
          if (MediaRecorder.isTypeSupported(mimeType)) {
            selectedMimeType = mimeType;
            break;
          }
        }

        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: selectedMimeType
        });

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0 && isSessionActive.value) {
            console.log('[Voice] Audio chunk received:', { size: e.data.size, type: e.data.type });
            audioChunksRef.value.push(e.data);
          }
        };

        mediaRecorder.onerror = (event) => {
          console.error('[Voice] MediaRecorder error:', event.error);
        };

        mediaRecorderRef.value = mediaRecorder;
        mediaRecorder.start(100);
        isRecording.value = true;
        console.log('[Voice] MediaRecorder restarted successfully');
      } catch (error) {
        console.error('[Voice] Failed to restart MediaRecorder:', error);
        stopContinuousSession();
      }
    };

    const stopContinuousSession = () => {
      console.log('[Voice] Stopping continuous session...');
      isSessionActive.value = false;
      isRecording.value = false;

      // Stop silence detection
      if (silenceDetectionIntervalRef.value) {
        clearInterval(silenceDetectionIntervalRef.value);
        silenceDetectionIntervalRef.value = null;
      }

      // Stop media recorder
      if (mediaRecorderRef.value && mediaRecorderRef.value.state !== 'inactive') {
        mediaRecorderRef.value.stop();
      }

      // Close audio context
      if (audioContextRef.value) {
        audioContextRef.value.close();
        audioContextRef.value = null;
      }

      // Stop all media tracks
      if (mediaRecorderRef.value && mediaRecorderRef.value.stream) {
        mediaRecorderRef.value.stream.getTracks().forEach(track => {
          track.stop();
          console.log('[Voice] Media track stopped');
        });
      }

      // Stop any ongoing browser TTS
      if (window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }

      audioChunksRef.value = [];
      console.log('[Voice] Continuous session stopped');
    };

    const speakWithBrowserTTS = (text) => {
      if (!text || !window.speechSynthesis) return;

      try {
        // Stop any current speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        ttsUtteranceRef = utterance;
        isPlaybackActive.value = true;

        utterance.onstart = () => console.log('[Voice] Browser TTS started');
        utterance.onend = () => {
          console.log('[Voice] Browser TTS ended');
          isPlaybackActive.value = false;
        };
        utterance.onerror = (e) => {
          console.error('[Voice] Browser TTS error:', e.error);
          isPlaybackActive.value = false;
        };

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error('[Voice] Browser TTS exception:', err);
        isPlaybackActive.value = false;
      }
    };


    const processAudio = async (chunks = null) => {
      const audioChunks = chunks || audioChunksRef.value;
      if (audioChunks.length === 0) {
        console.warn('[Voice] No audio chunks to process');
        return;
      }
      
      if (!chatId.value) {
        console.error('[Voice] No chatId available for processing');
        alert('Session not initialized. Please refresh the page.');
        return;
      }

      console.log('[Voice] Processing audio...', {
        chunks: audioChunks.length,
        chatId: chatId.value,
        hasToken: !!token.value
      });

      isProcessing.value = true;
      transcript.value = '';
      response.value = '';

      try {
        // Determine audio format from the first chunk
        const firstChunk = audioChunks[0];
        let audioType = 'audio/webm';
        let audioFormat = 'webm';
        
        if (firstChunk.type) {
          audioType = firstChunk.type;
          if (firstChunk.type.includes('webm')) {
            audioFormat = 'webm';
          } else if (firstChunk.type.includes('ogg')) {
            audioFormat = 'ogg';
          } else if (firstChunk.type.includes('mp4')) {
            audioFormat = 'mp4';
          } else if (firstChunk.type.includes('mpeg')) {
            audioFormat = 'mp3';
          }
        }

        console.log('[Voice] Creating audio blob...', { type: audioType, format: audioFormat });
        const audioBlob = new Blob(audioChunks, { type: audioType });
        console.log('[Voice] Audio blob created:', { size: audioBlob.size, type: audioBlob.type });

        // Guard: if the blob is too small, skip sending to backend to avoid invalid format errors
        if (!audioBlob.size || audioBlob.size < 8000) {
          console.warn('[Voice] Audio blob too small, skipping send');
          const fallbackMessage = "I can't hear you clearly. Please repeat.";
          speakWithBrowserTTS(fallbackMessage);
          isProcessing.value = false;
          return;
        }

        // Note: We skip strict audio validation here because:
        // 1. WebM/Opus chunks from MediaRecorder may not decode immediately in browser
        // 2. Backend has robust error handling with ffmpeg conversion
        // 3. Backend returns graceful fallback messages for corrupted audio
        // Let backend handle validation - it's more reliable for WebM/Opus streams

        console.log('[Voice] Converting to base64...');
        const base64Audio = await blobToBase64(audioBlob);
        console.log('[Voice] Base64 conversion complete:', { length: base64Audio.length });

        console.log('[Voice] Sending to API...', {
          chatId: chatId.value,
          audioFormat: audioFormat,
          audioSize: audioBlob.size
        });

        const data = await api.processVoice(chatId.value, base64Audio, token.value, audioFormat);
        
        console.log('[Voice] API response received:', {
          success: data.success,
          hasTranscription: !!data.data?.transcribedText,
          hasResponse: !!data.data?.aiResponse,
          hasAudio: !!data.data?.audioResponse,
          hasFallbackVoice: !!data.data?.fallbackVoiceText
        });
        
        // Handle fallback voice from backend without treating as error
        if (data.data?.fallbackVoiceText) {
          speakWithBrowserTTS(data.data.fallbackVoiceText);
          // Stop session to avoid repeated failing loops
          stopContinuousSession();
          return;
        }

        if (data.success) {
          transcript.value = data.data.transcribedText || '';
          response.value = data.data.aiResponse || '';
          
          console.log('[Voice] Transcription:', transcript.value);
          console.log('[Voice] AI Response:', response.value);

          // Play audio response if available; fallback to browser TTS if missing
          if (data.data.audioResponse) {
            console.log('[Voice] Playing audio response (Deepgram TTS)...');
            isPlaybackActive.value = true;
            try {
              const format = data.data.audioFormat || 'wav';
              const mimeType = format === 'mp3' ? 'audio/mpeg' : 'audio/wav';
              const audio = new Audio(`data:${mimeType};base64,${data.data.audioResponse}`);
              
              audio.onended = () => {
                console.log('[Voice] Audio playback ended');
                isPlaybackActive.value = false;
              };
              
              audio.onerror = (err) => {
                console.error('[Voice] Audio playback error:', err);
                isPlaybackActive.value = false;
                // Fallback to Web Speech TTS if playback fails
                if (response.value) {
                  speakWithBrowserTTS(response.value);
                }
              };

              audio.onloadstart = () => {
                console.log('[Voice] Audio loading started');
              };

              audio.oncanplay = () => {
                console.log('[Voice] Audio can play');
              };
              
              await audio.play().catch(err => {
                console.error('[Voice] Failed to play audio:', err);
                isPlaybackActive.value = false;
                if (response.value) {
                  speakWithBrowserTTS(response.value);
                }
              });
            } catch (audioError) {
              console.error('[Voice] Audio playback exception:', audioError);
              isPlaybackActive.value = false;
              if (response.value) {
                speakWithBrowserTTS(response.value);
              }
            }
          } else {
            console.log('[Voice] No audio response received; using browser TTS fallback');
            if (response.value) {
              isPlaybackActive.value = true;
              speakWithBrowserTTS(response.value);
              // Browser TTS will set flag false on end inside speakWithBrowserTTS
            }
          }
        } else {
          console.error('[Voice] API returned unsuccessful response:', data);
          alert(data.message || 'Failed to process audio. Please try again.');
        }
      } catch (error) {
        console.error('[Voice] Failed to process audio:', {
          error: error.message,
          stack: error.stack,
          response: error.response?.data,
          status: error.response?.status
        });

        // Friendly fallback voice if audio is invalid or any error occurs
        const fallbackMessage = "I can't hear you clearly. Please repeat.";
        speakWithBrowserTTS(fallbackMessage);

        // Do not alert the user with a blocking dialog
        // Reset state for next segment
        segmentHasSpeechRef.value = false;
        audioChunksRef.value = [];
        lastSoundTimeRef.value = Date.now();
      } finally {
        isProcessing.value = false;
        if (!chunks) {
          audioChunksRef.value = [];
        }
        console.log('[Voice] Processing complete');
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
            onClick={isSessionActive.value ? stopContinuousSession : startContinuousSession}
            disabled={isProcessing.value}
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: isSessionActive.value ? '#e74c3c' : '#3498db',
              color: 'white',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: isProcessing.value ? 'not-allowed' : 'pointer',
              opacity: isProcessing.value ? 0.6 : 1,
              transition: 'all 0.3s'
            }}
          >
            {isProcessing.value ? '⏳' : isSessionActive.value ? '⏹ Stop' : '🎤 Start'}
          </button>
          <p style={{ marginTop: '20px', color: '#7f8c8d' }}>
            {isSessionActive.value 
              ? isProcessing.value
                ? 'Processing your speech...'
                : 'Listening... Speak naturally, pauses will auto-process'
              : 'Click to start continuous voice chat'}
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
          <p>💡 Tip: Speak naturally. The system will automatically detect when you finish speaking (2 seconds of silence) and respond.</p>
          <p>🎙️ Session: {isSessionActive.value ? 'Active' : 'Inactive'} | Chat ID: {chatId.value || 'Not initialized'}</p>
        </div>
      </div>
    );
  }
};

