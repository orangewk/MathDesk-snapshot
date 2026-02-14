/**
 * Firestore クライアント初期化
 *
 * firebase-admin は firebase-admin.ts で既に初期化済み。
 * ここでは Firestore インスタンスの取得とコレクション参照をエクスポートする。
 */

import { getFirestore } from 'firebase-admin/firestore';
import '../../lib/firebase-admin.js'; // Firebase Admin SDK の初期化を保証

export const db = getFirestore();

// コレクション参照
export const usersCollection = db.collection('users');
export const sessionsCollection = db.collection('sessions');
export const conversationsCollection = db.collection('conversations');
export const cardClearLogCollection = db.collection('cardClearLog');
export const clientLogsCollection = db.collection('clientLogs');
export const problemPoolCollection = db.collection('problemPool');
