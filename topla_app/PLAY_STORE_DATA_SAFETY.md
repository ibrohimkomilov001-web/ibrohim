# 🔐 TOPLA - Play Store Data Safety Declaration

Bu dokument Google Play Console'dagi Data Safety formini to'ldirishda yordam beradi.

---

## 📊 Overview

| Question | Answer |
| :--- | :--- |
| Does your app collect or share user data? | Yes |
| Is all user data encrypted in transit? | Yes (HTTPS/TLS) |
| Do you provide a way for users to request data deletion? | Yes |
| Have you committed to follow Play Families policy? | N/A (not for children) |

---

## 📥 Data Collection

### 1. Personal Information

| Data Type | Collected | Shared | Purpose | Optional |
| :--- | :--- | :--- | :--- | :--- |
| Name | ✅ Yes | ❌ No | Account, Delivery | No |
| Email | ✅ Yes | ❌ No | Account, Notifications | No |
| Phone number | ✅ Yes | ❌ No | Account, OTP, Delivery | No |
| Address | ✅ Yes | ✅ Delivery partners | Delivery | No |
| Payment info | ✅ Yes | ✅ Payment providers | Transactions | No |

### 2. Location

| Data Type | Collected | Shared | Purpose | Optional |
| :--- | :--- | :--- | :--- | :--- |
| Approximate location | ✅ Yes | ❌ No | Find nearby shops | Yes |
| Precise location | ✅ Yes | ✅ Delivery | Delivery address | Yes |

### 3. App Activity

| Data Type | Collected | Shared | Purpose | Optional |
| :--- | :--- | :--- | :--- | :--- |
| App interactions | ✅ Yes | ❌ No | Analytics | No |
| Search history | ✅ Yes | ❌ No | Improve search | Yes |
| Purchase history | ✅ Yes | ❌ No | Order management | No |

### 4. Device Information

| Data Type | Collected | Shared | Purpose | Optional |
| :--- | :--- | :--- | :--- | :--- |
| Device ID | ✅ Yes | ❌ No | Analytics, Security | No |
| Device model | ✅ Yes | ❌ No | Compatibility | No |
| OS version | ✅ Yes | ❌ No | Compatibility | No |

### 5. Photos and Files

| Data Type | Collected | Shared | Purpose | Optional |
| :--- | :--- | :--- | :--- | :--- |
| Photos | ✅ Yes | ❌ No | Profile picture | Yes |
| Files | ❌ No | - | - | - |

---

## 🔄 Data Sharing

### Third-Party Services

| Service | Data Shared | Purpose |
| :--- | :--- | :--- |
| Firebase Authentication | Email, Phone | User authentication |
| Firebase Analytics | App usage, Device info | Analytics |
| Firebase Crashlytics | Crash logs, Device info | Stability monitoring |
| TOPLA API Backend | All user data | Backend storage |
| Octobank | Payment info | Payment processing |
| Delivery Partners | Name, Address, Phone | Order delivery |

### Data Sharing Purposes

- ✅ **App functionality** - Core features require data
- ✅ **Analytics** - Understanding app usage
- ✅ **Fraud prevention** - Securing transactions
- ✅ **Legal compliance** - Government requirements
- ❌ **Advertising** - We do NOT sell data for ads
- ❌ **Third-party advertising** - No ad networks used

---

## 🔒 Security Practices

### Data Encryption

| Type | Method |
| :--- | :--- |
| In transit | TLS 1.3 / HTTPS |
| At rest | AES-256 (PostgreSQL) |
| Sensitive data | Additional encryption layer |

### Security Measures

- ✅ Secure HTTPS connections for all API calls
- ✅ JWT token-based authentication
- ✅ Biometric authentication support
- ✅ Secure storage for sensitive data
- ✅ ProGuard/R8 code obfuscation
- ✅ Certificate pinning (planned)
- ✅ Regular security audits

---

## 🗑️ Data Deletion

### User Can Delete

| Data | How |
| :--- | :--- |
| Account | Settings → Account → Delete Account |
| Addresses | Settings → Addresses → Delete |
| Payment methods | Settings → Payment → Remove |
| Search history | Settings → Privacy → Clear History |
| Favorites | Manual removal from favorites |

### Retention Policy

| Data Type | Retention Period |
| :--- | :--- |
| Account data | Until deletion request |
| Order history | 7 years (legal requirement) |
| Analytics | 26 months |
| Crash logs | 90 days |

### Deletion Request

Users can request full data deletion by:

1. Email: [privacy@topla.uz](mailto:privacy@topla.uz)
2. In-app: Settings → Privacy → Delete All Data
3. Response time: Within 30 days

---

## 📱 Permissions Explained

| Permission | Why We Need It |
| :--- | :--- |
| `INTERNET` | App requires internet to function |
| `ACCESS_FINE_LOCATION` | For delivery address auto-detection |
| `ACCESS_COARSE_LOCATION` | For finding nearby shops |
| `CAMERA` | For profile photo capture |
| `READ_EXTERNAL_STORAGE` | For selecting profile photos |
| `USE_BIOMETRIC` | For secure fingerprint/face login |
| `VIBRATE` | For haptic feedback |
| `RECEIVE_BOOT_COMPLETED` | For order notification reminders |
| `POST_NOTIFICATIONS` | For order status updates |

---

## 👶 Children's Privacy

- App is **NOT** designed for children under 13
- We do **NOT** knowingly collect data from children
- Target audience: 18+ years old
- No features specifically designed for children

---

## 📋 Play Console Form Answers

Copy-paste these answers to Play Console Data Safety form:

### Section 1: Data Collection

```text
Q: Does your app collect or share any of the required user data types?
A: Yes

Q: Is all of the user data collected by your app encrypted in transit?
A: Yes

Q: Do you provide a way for users to request that their data is deleted?
A: Yes
```

### Section 2: Data Types

**Personal info:**

- Name: Collected, Not shared
- Email address: Collected, Not shared
- Phone number: Collected, Not shared
- Address: Collected, Shared with delivery partners

**Financial info:**

- Purchase history: Collected, Not shared
- Payment info: Collected, Shared with payment processors

**Location:**

- Approximate location: Collected, Not shared
- Precise location: Collected, Shared for delivery

**App activity:**

- App interactions: Collected, Not shared
- In-app search history: Collected, Not shared

**App info and performance:**

- Crash logs: Collected, Not shared
- Diagnostics: Collected, Not shared

**Device or other IDs:**

- Device ID: Collected, Not shared

### Section 3: Data Usage

**For each data type, purposes include:**

- App functionality
- Analytics
- Fraud prevention, security, and compliance

### Section 4: Security Practices

```text
Q: Is data encrypted in transit?
A: Yes

Q: Can users request data deletion?
A: Yes

Q: Committed to Play Families Policy?
A: This app is not directed at children
```

---

## 📞 Privacy Contact

**Data Protection Officer:**

- Email: [privacy@topla.uz](mailto:privacy@topla.uz)
- Phone: +998 90 123 45 67

**Privacy Policy URL:** [https://topla.uz/privacy](https://topla.uz/privacy)
**Terms of Service URL:** [https://topla.uz/terms](https://topla.uz/terms)

---

## 📅 Last Updated

**Version:** 1.0.0
**Date:** 2025 yil, Yanvar
**Review Schedule:** Every 6 months or upon significant changes
