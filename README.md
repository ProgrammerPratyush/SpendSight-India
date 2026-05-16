<div align="center">

# 💰 SpendSight India

**Privacy-first spending clarity platform for India**

*Automatic on Android · Intelligent on iOS · Private on both*

[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![React Native](https://img.shields.io/badge/React_Native-Expo_54-0EA5E9?logo=expo&logoColor=white)](https://expo.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://mongodb.com/atlas)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

[Features](#features) · [Architecture](#architecture) · [Setup](#setup) · [API Docs](#api) · [Roadmap](#roadmap)

</div>

---

## The Problem

Every working Indian generates 40–80 financial transactions per month across UPI apps, bank cards, wallets, and subscriptions — fragmented across 4–6 separate apps. No single view shows what you spent today, which category is rising, or when you are close to your limit.

**SpendSight solves this without asking for your bank password.**

---

## What Makes This Different

| Approach | SpendSight | Competitors |
|---|---|---|
| Android data source | SMS parsing — zero API dependency | Bank account linking required |
| iOS data source | NLP natural language input + Shortcuts | Manual only or bank linking |
| Privacy | Raw SMS never leaves device | Data sent to servers |
| Setup friction | OTP only — 30 seconds | Bank credentials + KYC |
| India-native | UPI merchants, Indian bank formats | US-centric categorisation |

---

## Features

### Android
- 📱 **Automatic SMS parsing** — reads bank alerts from 15+ Indian banks on-device
- 🔄 **Background sync** — new transactions detected automatically
- 🏷️ **Auto-categorisation** — Swiggy → Food, Uber → Travel, BESCOM → Utilities

### iOS
- ✍️ **Natural language input** — type `swiggy 450` and it parses automatically
- ⚡ **Apple Shortcuts integration** — semi-automatic from payment notifications
- 📥 **CSV bank import** — bulk import from SBI, HDFC, ICICI statements

### Both Platforms
- 📊 **Daily, weekly, monthly dashboard** with category breakdown
- 💡 **Plain-language insights** — "Food spending is up this week by Rs 400"
- 🎯 **Budget with smart alerts** — notified at configurable % threshold
- 🔁 **Recurring spend detection** — subscriptions identified automatically
- 🔒 **Privacy-first** — AES-256-GCM encryption, local-first storage

---

## Tech Stack

### Mobile
- **React Native** (Expo SDK 54) — single codebase, platform-aware screens
- **TypeScript** — strict mode throughout
- **Zustand** — lightweight global state management
- **expo-sqlite** + SQLCipher — encrypted local-first storage
- **Firebase Auth** — phone OTP, India-native

### Backend
- **Node.js** + **Express** — stateless REST API
- **MongoDB Atlas** — flexible schema, encrypted at rest
- **Winston** — structured JSON logging with request correlation IDs
- **Sentry** — production error monitoring
- **Zod** — runtime schema validation

### Infrastructure
- **Railway** — auto-deploy from GitHub main branch
- **GitHub Actions** — CI/CD with lint, TypeScript check, security audit
- **Firebase** — phone authentication


## Architecture

<img width="1536" height="1024" alt="Architecture diagram 2026" src="https://github.com/user-attachments/assets/8dcd348b-fa09-4fbb-a801-7c5083ce0f52" />

## 🏗️ Architecture Philosophy

SpendSight follows a modular monorepo architecture separating mobile application logic, backend APIs, and infrastructure concerns into independently scalable domains.

Key architectural goals:
- Privacy-first transaction processing
- Modular backend services
- Offline-capable mobile workflows
- Secure authentication & encrypted local storage
- Scalable analytics and insights pipeline
- CI/CD-driven deployment workflow


## Project Structure

```bash
spendsight/
├── apps/
│   ├── api/                          # Node.js + Express backend
│   │   ├── src/
│   │   │   ├── routes/               # Auth, transactions, budgets, insights
│   │   │   ├── models/               # MongoDB / Mongoose schemas
│   │   │   ├── middleware/           # Authentication, rate limiting, error handling
│   │   │   ├── services/             # Classification engine, analytics, business logic
│   │   │   └── utils/                # Logger, encryption, validators, helpers
│   │   └── package.json
│   │
│   └── mobile/                       # React Native (Expo) mobile application
│       ├── src/
│       │   ├── screens/              # Application screens & navigation flows
│       │   ├── components/           # Reusable UI components
│       │   ├── hooks/                # Custom hooks (transactions, insights, budgets)
│       │   ├── store/                # Zustand global state management
│       │   ├── services/             # API client, Firebase, SMS parser integrations
│       │   └── utils/                # Theme system, currency/date helpers
│       └── package.json
│
├── docs/
│   ├── ARCHITECTURE.md               # High-level system design & architecture
│   ├── API.md                        # REST API documentation
│   └── SECURITY.md                   # Security model & privacy considerations
│
├── .github/
│   └── workflows/
│       └── ci.yml                    # GitHub Actions CI/CD pipeline
│
└── README.md
```

---

## Setup

### Prerequisites
- Node.js 20+
- MongoDB Atlas account (free tier works)
- Firebase project with Phone Auth enabled
- Expo Go app on your phone

### 1. Clone and install

```bash
git clone https://github.com/yourusername/spendsight-india.git
cd spendsight-india

# Install API dependencies
cd apps/api && npm install

# Install mobile dependencies
cd ../mobile && npm install
```

### 2. Configure environment

```bash
# API
cp apps/api/.env.example apps/api/.env
# Fill in: MONGODB_URI, FIREBASE_*, ENCRYPTION_KEY

# Mobile
cp apps/mobile/.env.example apps/mobile/.env
# Fill in: EXPO_PUBLIC_API_URL, EXPO_PUBLIC_FIREBASE_*
```

### 3. Seed categories

```bash
cd apps/api
node src/utils/seedCategories.js
```

### 4. Run locally

```bash
# Terminal 1 — API
cd apps/api && npm run dev

# Terminal 2 — Mobile
cd apps/mobile && npx expo start
```

---

## API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/verify` | No | Verify Firebase OTP, create user |
| PATCH | `/api/auth/profile` | Yes | Update name and income |
| DELETE | `/api/auth/account` | Yes | Delete all user data |
| GET | `/api/transactions` | Yes | Get transactions by period |
| POST | `/api/transactions` | Yes | Create transaction |
| POST | `/api/transactions/bulk` | Yes | Bulk insert (SMS parsing) |
| GET | `/api/insights` | Yes | Get spending insights |
| GET | `/api/budgets` | Yes | Get user budgets |
| POST | `/api/budgets` | Yes | Create budget |
| GET | `/api/categories` | Yes | Get categories |
| GET | `/ping` | No | Health check with DB status |

---

## Security

- **Zero bank credentials** — we never ask for account numbers or passwords
- **SMS stays on device** — raw messages are never transmitted to any server
- **AES-256-GCM** — sensitive fields encrypted at application layer before storage
- **SQLCipher** — on-device SQLite database is encrypted
- **TLS 1.3** — all API traffic encrypted in transit
- **Firebase Auth** — industry-standard phone OTP, no custom auth
- **Rate limiting** — 100 requests per 15 minutes per IP
- **Helmet.js** — secure HTTP headers on all responses
- **Input sanitisation** — XSS and MongoDB injection protection on all inputs

---

## Roadmap

### v1.0 — MVP (In Progress)
- [x] Core API with MongoDB Atlas
- [x] Firebase phone OTP authentication
- [x] Manual transaction entry
- [x] Dashboard with period breakdown
- [x] Budget with alert threshold
- [x] Settings with profile and data deletion
- [ ] iOS NLP natural language input
- [ ] Apple Shortcuts integration
- [ ] CSV bank statement import
- [ ] Android SMS parser (15 banks)

### v1.1 — Insights Engine
- [ ] Daily digest push notification
- [ ] Unusual spend detection
- [ ] Subscription auto-detection
- [ ] Monthly wrap report

### v2.0 — Intelligence Layer
- [ ] RBI Account Aggregator integration research
- [ ] ML-based merchant classification
- [ ] Personalised spending patterns
- [ ] Export to CSV

---

## Contributing

This project follows [Conventional Commits](https://conventionalcommits.org).

```bash
feat: add natural language transaction parser
fix: resolve category not loading on iOS
docs: update API reference with new endpoints
chore: upgrade expo-sqlite to v16
```

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for full guidelines.

---

## License

MIT — see [LICENSE](LICENSE)

---

<div align="center">
Built with care for Indian users · Privacy-first · No bank linking required
</div>
