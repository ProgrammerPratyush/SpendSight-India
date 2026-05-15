# SpendSight Architecture

## Decision Log

### Why SMS parsing instead of Account Aggregator?

RBI Account Aggregator requires NBFC licence and months of onboarding.
SMS parsing works today with zero regulatory friction for an MVP.
AA integration is planned for v2.0.

### Why MongoDB Atlas over PostgreSQL?

Transaction data schema evolves rapidly in early product development.
MongoDB's flexible schema allows adding fields (nlpConfidence, shortcutTriggered)
without migrations. Atlas provides encryption at rest and automatic backups on free tier.

### Why local-first storage?

Trust is the primary barrier for Indian fintech users.
Keeping raw data on-device before optional sync removes the biggest
objection: "what if your server gets hacked?"

### Why Firebase Auth over custom OTP?

Building a reliable OTP gateway for Indian numbers requires:

- Telecom operator relationships
- DLT registration (TRAI requirement)
- 99.9% uptime guarantee
  Firebase handles all of this. It is the correct tool.

### Why Expo over bare React Native?

Single codebase, faster iteration, OTA updates without App Store review.
EAS Build handles production builds when needed.
The tradeoff is slightly larger bundle size — acceptable for an MVP.

## Data Flow

### Android Transaction Ingestion

SMS received → Bank sender filter → Regex parser → Amount/Merchant/Date extracted →
Category classified → SQLite insert → Optional Atlas sync → Dashboard update

### iOS Transaction Entry

User types "swiggy 450" → Tier 1 regex parser → Merchant matched →
Category assigned → Form pre-filled → User confirms → API POST → Atlas stored

## Scaling Considerations

- MongoDB Atlas scales horizontally — sharding by userId when needed
- Node.js API is stateless — Railway auto-scales instances
- SMS parsing is fully on-device — zero server load from parsing
- Rate limiting prevents API abuse at 100 req/15min per IP
