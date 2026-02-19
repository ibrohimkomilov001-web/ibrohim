import admin from 'firebase-admin';
import { env } from './env.js';

let firebaseApp: admin.app.App | null = null;

export function initFirebase(): void {
  if (firebaseApp) return;

  if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_PRIVATE_KEY || !env.FIREBASE_CLIENT_EMAIL) {
    console.warn('⚠️ Firebase credentials not configured. Push notifications disabled.');
    return;
  }

  const credential = admin.credential.cert({
    projectId: env.FIREBASE_PROJECT_ID,
    privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
  });

  firebaseApp = admin.initializeApp({ credential });

  console.log('✅ Firebase initialized');
}

export async function verifyFirebaseToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
  if (!firebaseApp) throw new Error('Firebase not initialized');
  return admin.auth(firebaseApp).verifyIdToken(idToken);
}

/**
 * Send push notification to a specific device
 */
export async function sendPushNotification(
  fcmToken: string,
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<string | null> {
  if (!firebaseApp) {
    console.warn('Firebase not initialized, skipping push');
    return null;
  }

  try {
    const message: admin.messaging.Message = {
      token: fcmToken,
      notification: { title, body },
      data: data || {},
      android: {
        priority: 'high',
        notification: {
          channelId: 'orders_channel',
          sound: 'default',
          priority: 'high',
        },
      },
      apns: {
        payload: {
          aps: {
            alert: { title, body },
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await admin.messaging(firebaseApp).send(message);
    return response;
  } catch (error: any) {
    // Token expired or invalid — mark it
    if (
      error.code === 'messaging/invalid-registration-token' ||
      error.code === 'messaging/registration-token-not-registered'
    ) {
      console.warn(`Invalid FCM token: ${fcmToken.substring(0, 20)}...`);
    } else {
      console.error('FCM send error:', error.message);
    }
    return null;
  }
}

/**
 * Send push notifications to multiple devices
 */
export async function sendMulticastPush(
  fcmTokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<void> {
  if (!firebaseApp || fcmTokens.length === 0) return;

  try {
    const message: admin.messaging.MulticastMessage = {
      tokens: fcmTokens,
      notification: { title, body },
      data: data || {},
      android: {
        priority: 'high',
        notification: {
          channelId: 'orders_channel',
          sound: 'default',
        },
      },
    };

    const response = await admin.messaging(firebaseApp).sendEachForMulticast(message);
    console.log(`Push sent: ${response.successCount}/${fcmTokens.length} successful`);
  } catch (error: any) {
    console.error('Multicast push error:', error.message);
  }
}
