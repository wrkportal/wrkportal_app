# Call UI Components Documentation

## Overview

Frontend components for WebRTC calling functionality. These components provide the user interface for starting, joining, and managing video/audio calls.

## Components

### 1. `CallInterface` (`components/calls/call-interface.tsx`)

Main call interface component that displays video streams and controls.

**Props:**
- `callId: string | null` - ID of the call to join
- `open: boolean` - Whether the dialog is open
- `onClose: () => void` - Callback when dialog closes
- `onCallEnd?: () => void` - Optional callback when call ends

**Features:**
- Displays remote video streams in a grid layout
- Local video in picture-in-picture mode
- Audio/video controls (mute, video toggle, screen share)
- Participant list
- Error handling and connection status

**Usage:**
```tsx
<CallInterface
  callId="call-123"
  open={isOpen}
  onClose={() => setIsOpen(false)}
  onCallEnd={() => console.log('Call ended')}
/>
```

### 2. `ParticipantList` (`components/calls/participant-list.tsx`)

Component that displays a list of call participants.

**Props:**
- `participants: Participant[]` - Array of participants
- `className?: string` - Optional CSS classes

**Features:**
- Shows participant avatar and name
- Displays mute/video status
- Shows host badge
- Responsive layout

**Usage:**
```tsx
<ParticipantList
  participants={call.participants}
  className="mt-4"
/>
```

### 3. `StartCallButton` (`components/calls/start-call-button.tsx`)

Button component to initiate a new call.

**Props:**
- `participantIds?: string[]` - Array of user IDs to invite
- `title?: string` - Optional call title
- `variant?: ButtonVariant` - Button style variant
- `size?: ButtonSize` - Button size
- `className?: string` - Optional CSS classes

**Features:**
- Creates a new call via API
- Opens call interface automatically
- Error handling with toast notifications

**Usage:**
```tsx
<StartCallButton
  participantIds={['user-1', 'user-2']}
  title="Team Meeting"
  variant="default"
/>
```

### 4. `JoinCallButton` (`components/calls/join-call-button.tsx`)

Button component to join an existing call.

**Props:**
- `callId: string` - ID of the call to join
- `variant?: ButtonVariant` - Button style variant
- `size?: ButtonSize` - Button size
- `className?: string` - Optional CSS classes

**Features:**
- Joins existing call
- Opens call interface automatically

**Usage:**
```tsx
<JoinCallButton
  callId="call-123"
  variant="default"
/>
```

## Hooks

### `useCall` (`hooks/useCall.ts`)

Main hook for managing call state and WebRTC functionality.

**Returns:**
```typescript
{
  call: CallData | null
  localStream: MediaStream | null
  remoteStreams: Map<string, MediaStream>
  isConnecting: boolean
  isActive: boolean
  error: string | null
  joinCall: (callId: string) => Promise<void>
  leaveCall: () => Promise<void>
  toggleMute: () => Promise<void>
  toggleVideo: () => Promise<void>
  toggleScreenShare: () => Promise<void>
  startCall: (participantIds?: string[], title?: string) => Promise<string>
}
```

**Features:**
- Manages call state
- Handles media streams (audio/video)
- Provides controls (mute, video, screen share)
- API integration for call management
- Error handling

**Usage:**
```tsx
const {
  call,
  localStream,
  isActive,
  startCall,
  joinCall,
  leaveCall,
  toggleMute,
  toggleVideo,
} = useCall()
```

## Integration Examples

### 1. Add "Join Call" to Calendar Meeting

```tsx
import { JoinCallButton } from '@/components/calls/join-call-button'

// In your meeting/task component
<JoinCallButton
  callId={meeting.callId}
  variant="outline"
  size="sm"
/>
```

### 2. Start Call from User Profile

```tsx
import { StartCallButton } from '@/components/calls/start-call-button'

// In user profile component
<StartCallButton
  participantIds={[userId]}
  title={`Call with ${userName}`}
/>
```

### 3. Group Call

```tsx
import { StartCallButton } from '@/components/calls/start-call-button'

// Start group call
<StartCallButton
  participantIds={['user-1', 'user-2', 'user-3']}
  title="Team Standup"
/>
```

## Dependencies

- React hooks (useState, useEffect, useCallback, useRef)
- Next.js (client components)
- UI Components:
  - `Button` from `@/components/ui/button`
  - `Dialog` from `@/components/ui/dialog`
  - `Avatar` from `@/components/ui/avatar`
- Icons from `lucide-react`
- Utilities from `@/lib/utils`

## Browser Compatibility

Requires modern browser with WebRTC support:
- Chrome/Edge 60+
- Firefox 60+
- Safari 11+

## Permissions

The components request the following browser permissions:
- Camera access (for video)
- Microphone access (for audio)
- Screen sharing (for screen share feature)

## Next Steps

1. **WebSocket Signaling**: Implement WebSocket server for peer connection signaling
2. **STUN/TURN Servers**: Configure STUN/TURN servers for NAT traversal
3. **Screen Sharing**: Complete screen sharing implementation
4. **Recording**: Add call recording functionality
5. **Notifications**: Add call notifications for incoming calls

## Notes

- The current implementation uses placeholder logic for peer connections
- Screen sharing is not yet fully implemented
- WebSocket signaling server needs to be set up for peer-to-peer connections
- STUN/TURN servers are required for production deployment
