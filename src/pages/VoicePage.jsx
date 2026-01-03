import React, { useState, useRef, useEffect } from 'react';
import { startVoiceSession, processVoice } from '../services/api';

function VoicePage({ token }) {
  const [chatId, setChatId] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    initializeSession();
  }, []);

  const initializeSession = async () => {
    try {
      const data = await startVoiceSession(token);
      if (data.success) {
        setChatId(data.data.chatId);
      }
    } catch (error) {
      console.error('Failed to initialize voice session:', error);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });

      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        await processAudio();
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Microphone access denied. Please allow microphone access.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
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

  const processAudio = async () => {
    if (audioChunksRef.current.length === 0) return;

    setIsProcessing(true);
    setTranscript('');
    setResponse('');

    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const base64Audio = await blobToBase64(audioBlob);

      const data = await processVoice(chatId, base64Audio, token);
      
      if (data.success) {
        setTranscript(data.data.transcribedText);
        setResponse(data.data.aiResponse);

        // Play audio response if available
        if (data.data.audioResponse) {
          const audio = new Audio(`data:audio/mp3;base64,${data.data.audioResponse}`);
          audio.play().catch(err => console.error('Failed to play audio:', err));
        }
      }
    } catch (error) {
      console.error('Failed to process audio:', error);
      alert('Failed to process audio. Please try again.');
    } finally {
      setIsProcessing(false);
      audioChunksRef.current = [];
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>Voice Chat</h1>
      
      <div style={{
        textAlign: 'center',
        padding: '40px',
        border: '2px dashed #ddd',
        borderRadius: '12px',
        marginBottom: '30px'
      }}>
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: isRecording ? '#e74c3c' : '#3498db',
            color: 'white',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            opacity: isProcessing ? 0.6 : 1,
            transition: 'all 0.3s'
          }}
        >
          {isProcessing ? '⏳' : isRecording ? '⏹ Stop' : '🎤 Start'}
        </button>
        <p style={{ marginTop: '20px', color: '#7f8c8d' }}>
          {isRecording 
            ? 'Recording... Click to stop' 
            : isProcessing 
            ? 'Processing...' 
            : 'Click to start recording'}
        </p>
      </div>

      {transcript && (
        <div style={{
          padding: '15px',
          backgroundColor: '#e8f4f8',
          borderRadius: '8px',
          marginBottom: '15px'
        }}>
          <strong>You said:</strong> {transcript}
        </div>
      )}

      {response && (
        <div style={{
          padding: '15px',
          backgroundColor: '#f0f0f0',
          borderRadius: '8px'
        }}>
          <strong>AI Response:</strong> {response}
        </div>
      )}

      <div style={{ marginTop: '30px', fontSize: '14px', color: '#7f8c8d' }}>
        <p>💡 Tip: Speak clearly and wait for the AI response before asking the next question.</p>
        <p>Chat ID: {chatId}</p>
      </div>
    </div>
  );
}

export default VoicePage;

