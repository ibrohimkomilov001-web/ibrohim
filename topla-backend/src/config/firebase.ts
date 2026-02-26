import admin from 'firebase-admin';
import { env } from './env.js';
import { prisma } from './database.js';

let firebaseApp: admin.app.App | null = null;

export function initFirebase(): void {
  if (firebaseApp) return;

  if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_PRIVATE_KEY || !env.FIREBASE_CLIENT_EMAIL) {
    console.warn('⚠️ Firebase credentials not configured. Push notifications disabled.');
    return;
  }

  if (env.FIREBASE_PRIVATE_KEY === 'placeholder' || !env.FIREBASE_PRIVATE_KEY.includes('BEGIN')) {
    console.warn('⚠️ Firebase private key is placeholder. Push notifications disabled.');
    return;
  }

  try {
    const credential = admin.credential.cert({
      projectId: env.FIREBASE_PROJECT_ID,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
    });

    firebaseApp = admin.initializeApp({ credential });

    console.log('✅ Firebase initialized');
  } catch (error) {
    console.warn('⚠️ Firebase initialization failed:', (error as Error).message);
    console.warn('Push notifications will be disabled.');
  }
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
    // Notification type ga qarab channel tanlash
    const notificationType = data?.type || '';
    const channelId = notificationType.includes('order') || notificationType.includes('courier') ? 'orders_channel'
      : notificationType.includes('promo') || notificationType.includes('sale') ? 'promo_channel'
      : 'general_channel';

    const message: admin.messaging.Message = {
      token: fcmToken,
      notification: { title, body },
      data: data || {},
      android: {
        priority: 'high',
        notification: {
          channelId,
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
  imageUrl?: string,
): Promise<void> {
  if (!firebaseApp || fcmTokens.length === 0) return;

  // Notification type ga qarab channel tanlash
  const notificationType = data?.type || '';
  const channelId = notificationType.includes('order') ? 'orders_channel'
    : notificationType.includes('promo') || notificationType.includes('sale') ? 'promo_channel'
    : 'general_channel';

  try {
    const notification: admin.messaging.Notification = { title, body };
    if (imageUrl) notification.imageUrl = imageUrl;

    const message: admin.messaging.MulticastMessage = {
      tokens: fcmTokens,
      notification,
      data: data || {},
      android: {
        priority: 'high',
        notification: {
          channelId,
          sound: 'default',
          imageUrl: imageUrl || undefined,
        },
      },
      apns: {
        payload: {
          aps: {
            alert: { title, body },
            sound: 'default',
            badge: 1,
            'mutable-content': 1,
          },
        },
        fcmOptions: {
          imageUrl: imageUrl || undefined,
        },
      },
    };

    const response = await admin.messaging(firebaseApp).sendEachForMulticast(message);
    console.log(`Push sent: ${response.successCount}/${fcmTokens.length} successful`);

    // Invalid tokenlarni tozalash
    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const code = resp.error?.code;
          if (code === 'messaging/invalid-registration-token' ||
              code === 'messaging/registration-token-not-registered') {
            const token = fcmTokens[idx];
            if (token) failedTokens.push(token);
          }
        }
      });
      if (failedTokens.length > 0) {
        console.warn(`Cleaning ${failedTokens.length} invalid FCM tokens`);
        await prisma.userDevice.updateMany({
          where: { fcmToken: { in: failedTokens } },
          data: { isActive: false },
        });
      }
    }
  } catch (error: any) {
    console.error('Multicast push error:', error.message);
  }
}
