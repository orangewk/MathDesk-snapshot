// FILE: webapp/src/components/AuthForm.tsx
// ==========================================
/**
 * 認証フォームコンポーネント (Firebase版)
 * Googleログイン & 開発用バイパス
 */

import { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { loginWithGoogle, loginWithBypass, AuthUser } from '../services/auth-service';
import './AuthForm.css';

interface AuthFormProps {
  onAuthSuccess: (user: AuthUser) => void;
}

export function AuthForm({ onAuthSuccess }: AuthFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const enableBypass = import.meta.env?.VITE_ENABLE_AUTH_BYPASS === 'true';

  const handleGoogleLogin = async () => {
    setError(null);
    setIsLoading(true);

    try {
      // 1. FirebaseでGoogleログイン
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const idToken = await user.getIdToken();

      // 2. IDトークンをバックエンドに送信
      const authResult = await loginWithGoogle(idToken);

      if (authResult.success && authResult.user) {
        onAuthSuccess(authResult.user);
      } else {
        setError(authResult.error || 'ログインサーバーでの認証に失敗しました');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      // ポップアップを閉じた場合はエラー表示しない
      if (err.code === 'auth/popup-closed-by-user') {
        setIsLoading(false);
        return;
      }
      setError('Googleログインに失敗しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBypassLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const result = await loginWithBypass();
      if (result.success && result.user) {
        onAuthSuccess(result.user);
      } else {
        setError(result.error || 'バイパスログインに失敗しました');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-form-container">
      <div className="auth-card">
        <h1 className="auth-title">MathDesk</h1>
        <p className="auth-subtitle">AIが寄り添う、新しい数学学習</p>

        <div style={{ marginTop: '30px', marginBottom: '30px' }}>
          <button
            onClick={handleGoogleLogin}
            className="google-login-button"
            disabled={isLoading}
          >
            <span className="google-icon">G</span>
            {isLoading ? 'ログイン中...' : 'Googleでログイン'}
          </button>

          <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '16px' }}>
            お持ちのGoogleアカウントで安全にログインできます。<br />
            パスワードの管理は不要です。
          </p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {enableBypass && (
          <div style={{ borderTop: '1px dashed #ccc', paddingTop: '20px', marginTop: '20px' }}>
            <p style={{ fontSize: '11px', color: 'var(--warning)', textAlign: 'center' }}>⚡ 開発モード有効</p>
            <button
              onClick={handleBypassLogin}
              className="bypass-button"
              disabled={isLoading}
            >
              開発者用クイックログイン
            </button>
          </div>
        )}
      </div>
    </div>
  );
}