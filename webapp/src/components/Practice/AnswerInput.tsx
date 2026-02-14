/**
 * 回答入力コンポーネント
 * テキスト入力（自然言語・LaTeX）を受け付ける
 */

import React, { useState, useCallback, memo } from 'react';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import './AnswerInput.css';

interface AnswerInputProps {
  onSubmit: (answer: string) => void;
  disabled?: boolean;
}

const AnswerInputComponent: React.FC<AnswerInputProps> = ({
  onSubmit,
  disabled = false,
}) => {
  const [answer, setAnswer] = useState('');

  const voiceInput = useVoiceInput({
    onResult: (transcript) => {
      setAnswer(prev => prev ? `${prev} ${transcript}` : transcript);
    },
  });

  const handleSubmit = useCallback(() => {
    const trimmed = answer.trim();
    if (trimmed) {
      onSubmit(trimmed);
    }
  }, [answer, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  return (
    <div className="answer-input">
      <label className="answer-input__label">
        あなたの回答
      </label>
      <textarea
        className="answer-input__textarea"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="答えを入力してください（数式は $...$ で囲むとLaTeX表示されます）"
        disabled={disabled}
        rows={3}
      />
      <div className="answer-input__footer">
        <span className="answer-input__hint">
          Ctrl+Enter で送信
        </span>
        <div className="answer-input__actions">
          {voiceInput.isSupported && (
            <button
              className={`answer-input__voice ${voiceInput.status === 'listening' ? 'recording' : ''}`}
              onClick={() => voiceInput.status === 'listening' ? voiceInput.stopListening() : voiceInput.startListening()}
              disabled={disabled}
              title={voiceInput.status === 'listening' ? '音声入力を停止' : '音声で入力'}
            >
              🎤
            </button>
          )}
          <button
            className="answer-input__submit"
            onClick={handleSubmit}
            disabled={disabled || !answer.trim()}
          >
            回答する
          </button>
        </div>
      </div>
    </div>
  );
};

export const AnswerInput = memo(AnswerInputComponent);
