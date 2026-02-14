// ==========================================
// FILE: webapp/src/services/auth-service.ts
// ==========================================
/**
 * 認証サービス
 * Phase 2A - フロントエンド認証管理
 */

const API_BASE_URL_AUTH = '/api';
const TOKEN_STORAGE_KEY = 'mathdesk_auth_token';
const USER_STORAGE_KEY = 'mathdesk_user';

// ==========================================
// sessionStorage フォールバック
// ==========================================
// sessionStorage はタブ単位で分離されるため、
// 並列プレイテスト等で同一オリジンの複数タブが
// 異なるユーザーとして認証できる。
// 読み取り時: sessionStorage → localStorage の順で探索
// 書き込み時: localStorage に保存（通常ログインフロー）
// プレイテスト時は playwright-cli の sessionstorage-set で
// 直接 sessionStorage に注入するため衝突しない。
// ==========================================

// ==========================================
// 型定義
// ==========================================

export interface AuthUser {
  id: string;
  nickname: string;
  accessCode?: string; // 登録時のみ返される
}

export interface RegisterResponse {
  success: boolean;
  user?: AuthUser;
  token?: string;
  message?: string;
  error?: string;
}

export interface LoginResponse {
  success: boolean;
  user?: { id: string; nickname: string };
  token?: string;
  error?: string;
}

export interface ValidateResponse {
  valid: boolean;
  user?: { id: string; nickname: string };
}

// ==========================================
// トークン管理
// ==========================================

/**
 * トークンを保存（通常ログインフロー用）
 */
export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

/**
 * トークンを取得
 * sessionStorage を優先し、なければ localStorage にフォールバック。
 * これにより並列タブ（プレイテスト等）でもタブ単位で認証を分離できる。
 */
export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_STORAGE_KEY)
    ?? localStorage.getItem(TOKEN_STORAGE_KEY);
}

/**
 * トークンを削除
 */
export function removeToken(): void {
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

/**
 * ユーザー情報を保存（通常ログインフロー用）
 */
export function saveUser(user: AuthUser): void {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

/**
 * ユーザー情報を取得
 * sessionStorage を優先し、なければ localStorage にフォールバック。
 */
export function getUser(): AuthUser | null {
  const data = sessionStorage.getItem(USER_STORAGE_KEY)
    ?? localStorage.getItem(USER_STORAGE_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * ユーザー情報を削除
 */
export function removeUser(): void {
  sessionStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
}

// ==========================================
// API呼び出し
// ==========================================

/**
 * ユーザー登録
 */
export async function register(nickname: string): Promise<{
  success: boolean;
  user?: AuthUser;
  token?: string;
  accessCode?: string;
  message?: string;
  error?: string;
}> {
  const response = await fetch(`${API_BASE_URL_AUTH}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname }),
  });

  const data: RegisterResponse = await response.json();

  if (data.success && data.user && data.token) {
    saveToken(data.token);
    saveUser(data.user);
    return {
      success: true,
      user: data.user,
      token: data.token,
      accessCode: data.user.accessCode, // アクセスコードを返す
      message: data.message,
    };
  }

  return { success: false, error: data.error || '登録に失敗しました' };
}

/**
 * ログイン
 */
export async function login(accessCode: string): Promise<{
  success: boolean;
  user?: AuthUser;
  token?: string;
  error?: string;
}> {
  const response = await fetch(`${API_BASE_URL_AUTH}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessCode }),
  });

  const data: LoginResponse = await response.json();

  if (data.success && data.user && data.token) {
    saveToken(data.token);
    saveUser({ ...data.user });
    return { success: true, user: data.user, token: data.token };
  }

  return { success: false, error: data.error || 'ログインに失敗しました' };
}

/**
 * Googleログイン
 */
export async function loginWithGoogle(idToken: string): Promise<{
  success: boolean;
  user?: AuthUser;
  token?: string;
  error?: string;
}> {
  const response = await fetch(`${API_BASE_URL_AUTH}/auth/google-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });

  const data: LoginResponse = await response.json();

  if (data.success && data.user && data.token) {
    saveToken(data.token);
    saveUser({ ...data.user });
    return { success: true, user: data.user, token: data.token };
  }

  return { success: false, error: data.error || 'Googleログインに失敗しました' };
}

/**
 * 開発用バイパスログイン
 */
export async function loginWithBypass(): Promise<{
  success: boolean;
  user?: AuthUser;
  token?: string;
  error?: string;
}> {
  const response = await fetch(`${API_BASE_URL_AUTH}/auth/bypass-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });

  const data: LoginResponse = await response.json();

  if (data.success && data.user && data.token) {
    saveToken(data.token);
    saveUser({ ...data.user });
    return { success: true, user: data.user, token: data.token };
  }

  return { success: false, error: data.error || 'バイパスログインに失敗しました' };
}

/**
 * ログアウト
 */
export async function logout(): Promise<void> {
  const token = getToken();

  if (token) {
    try {
      await fetch(`${API_BASE_URL_AUTH}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch {
      // エラーを無視してローカルデータをクリア
    }
  }

  removeToken();
  removeUser();
}

/**
 * トークンの有効性を確認
 */
export async function validateSession(): Promise<{
  valid: boolean;
  user?: AuthUser;
}> {
  const token = getToken();

  if (!token) {
    return { valid: false };
  }

  try {
    const response = await fetch(`${API_BASE_URL_AUTH}/auth/validate`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data: ValidateResponse = await response.json();

    if (data.valid && data.user) {
      // ローカルのユーザー情報を更新
      saveUser(data.user);
      return { valid: true, user: data.user };
    }

    // 無効な場合はローカルデータをクリア
    removeToken();
    removeUser();
    return { valid: false };
  } catch {
    return { valid: false };
  }
}

/**
 * 認証状態をチェック（ローカルのみ）
 */
export function isAuthenticated(): boolean {
  return !!getToken() && !!getUser();
}

/**
 * 認証ヘッダーを取得
 */
export function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  if (!token) return {};
  return { 'Authorization': `Bearer ${token}` };
}