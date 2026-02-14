
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';

dotenv.config();

// サービスアカウントキーのパス
// 1. 環境変数 GOOGLE_APPLICATION_CREDENTIALS
// 2. プロジェクトルートの serviceAccountKey.json
const SERVICE_ACCOUNT_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    path.resolve(process.cwd(), 'serviceAccountKey.json');

if (getApps().length === 0) {
    try {
        if (fs.existsSync(SERVICE_ACCOUNT_PATH)) {
            initializeApp({
                credential: cert(SERVICE_ACCOUNT_PATH)
            });
            logger.info(`Firebase Admin initialized with credential: ${SERVICE_ACCOUNT_PATH}`);
        } else {
            logger.warn(`Service account key not found at ${SERVICE_ACCOUNT_PATH}. Using Application Default Credentials.`);
            // Cloud RunなどのGCP環境では引数なしでADCが使われる
            initializeApp();
        }
    } catch (error) {
        logger.error('Failed to initialize Firebase Admin:', error);
    }
}

export const adminAuth = getAuth();
