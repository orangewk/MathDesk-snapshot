import { useState, useRef, useCallback } from 'react';

type VoiceInputStatus = 'idle' | 'listening' | 'error';

interface UseVoiceInputOptions {
  lang?: string;
  onResult?: (transcript: string) => void;
}

interface UseVoiceInputReturn {
  status: VoiceInputStatus;
  isSupported: boolean;
  interimTranscript: string;
  error: string | null;
  startListening: () => Promise<void>;
  stopListening: () => void;
}

const SpeechRecognitionAPI =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

export function useVoiceInput(options: UseVoiceInputOptions = {}): UseVoiceInputReturn {
  const { lang = 'ja-JP', onResult } = options;

  const [status, setStatus] = useState<VoiceInputStatus>('idle');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const micPermissionRef = useRef(false);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const isSupported = SpeechRecognitionAPI != null;

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    setStatus('idle');
    setInterimTranscript('');
  }, []);

  const startListening = useCallback(async () => {
    if (!SpeechRecognitionAPI) return;

    // マイク許可の取得（初回のみ）
    if (!micPermissionRef.current) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop());
        micPermissionRef.current = true;
      } catch (e) {
        const err = e as DOMException;
        const messages: Record<string, string> = {
          NotFoundError: 'マイクが見つかりません',
          NotAllowedError: 'マイクの使用が許可されていません',
        };
        setError(messages[err.name] || `マイクエラー: ${err.message}`);
        setStatus('error');
        return;
      }
    }

    // 既存のセッションを停止
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = lang;
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[0];
      if (result.isFinal) {
        const text = result[0].transcript.trim();
        setInterimTranscript('');
        if (text) {
          onResultRef.current?.(text);
        }
      } else {
        setInterimTranscript(result[0].transcript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const messages: Record<string, string> = {
        'not-allowed': 'マイクの使用が許可されていません',
        'no-speech': '音声が検出されませんでした',
        'audio-capture': 'マイクが見つかりません',
        'network': 'ネットワークエラーです',
        'aborted': '音声認識が中断されました',
      };
      if (event.error !== 'no-speech') {
        setError(messages[event.error] || `エラー: ${event.error}`);
        setStatus('error');
      }
      recognitionRef.current = null;
      setStatus('idle');
      setInterimTranscript('');
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setStatus('idle');
      setInterimTranscript('');
    };

    recognitionRef.current = recognition;
    setError(null);
    setStatus('listening');
    setInterimTranscript('');

    try {
      recognition.start();
    } catch {
      setStatus('idle');
    }
  }, [lang, stopListening]);

  return {
    status,
    isSupported,
    interimTranscript,
    error,
    startListening,
    stopListening,
  };
}
