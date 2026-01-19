# Enterprise AI & Calling System Implementation Plan

## Overview
This document outlines the implementation plan for migrating to Azure OpenAI Service and building a self-hosted WebRTC calling/meeting system.

---

## Phase 1: Azure OpenAI Migration (Weeks 1-3)

### 1.1 AI Provider Abstraction Layer
- **Goal**: Create a unified interface for multiple AI providers
- **Components**:
  - Provider interface/abstract class
  - Provider factory pattern
  - Configuration management
  - Error handling and fallback logic

### 1.2 Azure OpenAI Integration
- **Goal**: Implement Azure OpenAI Service client
- **Components**:
  - Azure OpenAI SDK integration
  - Authentication (Azure Key Vault recommended)
  - Endpoint configuration
  - Model selection (GPT-4, GPT-4 Turbo, etc.)

### 1.3 Migration Steps
1. Create abstraction layer
2. Implement Azure OpenAI provider
3. Add environment variables for Azure OpenAI
4. Update existing AI services to use abstraction
5. Test all AI features
6. Remove OpenAI direct dependencies

### 1.4 Files to Modify
- `lib/ai/openai-service.ts` → `lib/ai/ai-service.ts` (abstraction)
- `lib/ai/providers/azure-openai.ts` (new)
- `lib/ai/providers/openai-provider.ts` (temporary, for migration)
- `env.template` (add Azure OpenAI config)
- All files using OpenAI directly

---

## Phase 2: Self-Hosted WebRTC Calling System (Weeks 4-12)

### 2.1 Architecture Overview
```
┌─────────────────────────────────────────┐
│         Frontend (React/Next.js)        │
│  - Call UI Components                   │
│  - WebRTC Client                        │
└──────────────┬──────────────────────────┘
               │
               │ WebSocket / WebRTC
               │
┌──────────────▼──────────────────────────┐
│      Signaling Server (Node.js)         │
│  - WebSocket Server                     │
│  - Room Management                      │
│  - Participant Management               │
└──────────────┬──────────────────────────┘
               │
               │
┌──────────────▼──────────────────────────┐
│      STUN/TURN Server (Coturn)          │
│  - NAT Traversal                        │
│  - Firewall Bypass                      │
└─────────────────────────────────────────┘
```

### 2.2 Database Schema
```prisma
model Call {
  id            String   @id @default(cuid())
  roomId        String   @unique
  type          CallType // ONE_ON_ONE, GROUP, SCHEDULED
  status        CallStatus // INITIATED, ACTIVE, ENDED
  scheduledAt   DateTime?
  startedAt     DateTime?
  endedAt       DateTime?
  duration      Int?     // seconds
  tenantId      String
  createdById   String
  title         String?
  description   String?
  participants  CallParticipant[]
  recordings    CallRecording[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([tenantId])
  @@index([createdById])
  @@index([status])
  @@index([roomId])
}

model CallParticipant {
  id          String   @id @default(cuid())
  callId      String
  userId      String
  joinedAt    DateTime
  leftAt      DateTime?
  role        ParticipantRole // HOST, PARTICIPANT, MODERATOR
  isMuted     Boolean  @default(false)
  isVideoOn   Boolean  @default(true)
  isScreenSharing Boolean @default(false)
  call        Call     @relation(fields: [callId], references: [id], onDelete: Cascade)
  user        User     @relation(fields: [userId], references: [id])
  
  @@index([callId])
  @@index([userId])
}

model CallRecording {
  id          String   @id @default(cuid())
  callId      String
  fileUrl     String
  fileSize    Int
  duration    Int      // seconds
  format      String   // mp4, webm
  recordedBy  String
  createdAt   DateTime @default(now())
  call        Call     @relation(fields: [callId], references: [id], onDelete: Cascade)
  
  @@index([callId])
}

enum CallType {
  ONE_ON_ONE
  GROUP
  SCHEDULED
}

enum CallStatus {
  INITIATED
  RINGING
  ACTIVE
  ENDED
  CANCELLED
}

enum ParticipantRole {
  HOST
  PARTICIPANT
  MODERATOR
}
```

### 2.3 Technology Stack

#### Frontend
- **WebRTC API**: Native browser WebRTC
- **Socket.io Client**: For signaling
- **React Components**: Call UI
- **Media Recording**: MediaRecorder API

#### Backend
- **Signaling Server**: Node.js + Socket.io
- **STUN/TURN Server**: Coturn (self-hosted)
- **Media Server** (optional): Janus Gateway or Mediasoup
- **Recording**: FFmpeg for server-side recording

### 2.4 Implementation Steps

#### Step 1: Database Schema (Week 4)
- Add Prisma models
- Run migrations
- Update User model relations

#### Step 2: Signaling Server (Weeks 5-6)
- WebSocket server setup
- Room management API
- Participant management
- ICE candidate exchange
- Offer/Answer SDP exchange

#### Step 3: STUN/TURN Server (Week 7)
- Install and configure Coturn
- DNS setup
- Security configuration
- Testing NAT traversal

#### Step 4: Frontend WebRTC Client (Weeks 8-9)
- Call UI components
- WebRTC connection logic
- Media stream handling
- Screen sharing
- Controls (mute, video on/off)

#### Step 5: Call Features (Weeks 10-11)
- Screen sharing
- Recording (client-side + server-side)
- Call history
- Notifications
- Calendar integration

#### Step 6: Testing & Optimization (Week 12)
- Load testing
- Quality optimization
- Security audit
- Documentation

---

## Phase 3: Integration & Cleanup (Week 13-14)

### 3.1 Calendar Integration
- Add "Join Call" to meetings
- Click-to-call from calendar
- Scheduled call notifications

### 3.2 Remove OpenAI Dependencies
- Remove `openai` package
- Update documentation
- Clean up unused code

---

## Environment Variables

### Azure OpenAI
```env
# Azure OpenAI Service
AZURE_OPENAI_ENDPOINT="https://your-resource.openai.azure.com"
AZURE_OPENAI_API_KEY="your-api-key"
AZURE_OPENAI_API_VERSION="2024-02-15-preview"
AZURE_OPENAI_DEPLOYMENT_NAME="gpt-4"
AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME="text-embedding-ada-002"
```

### WebRTC
```env
# WebRTC Signaling
SIGNALING_SERVER_URL="ws://localhost:3001"
SIGNALING_SERVER_PORT=3001

# STUN/TURN Servers
STUN_SERVER="stun:your-stun-server.com:3478"
TURN_SERVER="turn:your-turn-server.com:3478"
TURN_USERNAME="your-username"
TURN_PASSWORD="your-password"
```

---

## Success Metrics

### Azure OpenAI
- ✅ All AI features working with Azure OpenAI
- ✅ Zero OpenAI direct API calls
- ✅ Enterprise compliance maintained
- ✅ Performance comparable to OpenAI

### WebRTC Calling
- ✅ One-on-one calls working
- ✅ Group calls (up to 50 participants)
- ✅ Screen sharing functional
- ✅ Recording working
- ✅ < 300ms latency
- ✅ 95% call success rate

---

## Risk Mitigation

1. **Azure OpenAI Availability**: Implement fallback provider support
2. **WebRTC Complexity**: Use proven libraries and patterns
3. **STUN/TURN Setup**: Consider managed STUN/TURN service as backup
4. **Scalability**: Plan for horizontal scaling from start
5. **Security**: Regular security audits, encryption at rest and in transit

---

## Timeline Summary

- **Weeks 1-3**: Azure OpenAI Migration
- **Weeks 4-12**: WebRTC Calling System
- **Weeks 13-14**: Integration & Cleanup
- **Total**: 14 weeks (~3.5 months)

---

## Next Steps

1. ✅ Review and approve plan
2. Create AI provider abstraction layer
3. Implement Azure OpenAI integration
4. Begin WebRTC architecture design
