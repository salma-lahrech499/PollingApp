# Voters - Polling App

A full-stack polling application where people can create polls and vote on them.

## Features

- Create polls (with name or anonymously)
- Vote on polls (one vote per user per poll)
- Public or anonymous voting
- Visual results display with charts

## Tech Stack

- **Frontend**: React + Vite + TypeScript
- **Backend**: Apollo Server (GraphQL) + TypeScript + Express
- **Database**: SQLite (better-sqlite3)

## How the App Works

### Overview

The app follows a standard client-server architecture with a GraphQL API:

1. **Frontend (React)**: 
   - Users can view all polls on the home page
   - Create new polls with multiple options
   - Vote on polls with optional anonymity
   - View results in interactive charts (modal-based)

2. **Backend (GraphQL)**:
   - Apollo Server exposes a GraphQL API with queries and mutations
   - SQLite database stores polls, options, and votes
   - Session management tracks users for non-anonymous votes

3. **Data Flow**:
   - Polls are fetched via `polls` query (list) or `poll` query (single)
   - Votes are submitted via `vote` mutation
   - Results are calculated on-demand and returned with poll data

### User Experience Flow

1. **Creating a Poll**: Users fill out a form with poll title, options (minimum 2), creator name (optional), and anonymity preferences
2. **Voting**: Users select an option and choose whether to vote anonymously
3. **Viewing Results**: After voting, a chart modal automatically opens showing results. Users can also view charts from the home page

## How Multiple Votes Are Prevented

Multiple votes are prevented at **two levels** to ensure robustness:

### 1. Database-Level Constraint

The `votes` table has a `UNIQUE(poll_id, user_id)` constraint that enforces one vote per user per poll at the database level:

```sql
CREATE TABLE votes (
  ...
  UNIQUE(poll_id, user_id)
)
```

This prevents duplicate votes even if there are bugs in the application code or direct database access attempts.

### 2. Application-Level Check

Before inserting a vote, the application checks if the user has already voted:

```typescript
const existingVote = PollModel.checkUserVoted(pollId, userId);
if (existingVote) {
  throw new Error('User has already voted on this poll');
}
```

This provides a user-friendly error message and prevents unnecessary database operations.

### User Identification

- **Public votes**: Users are identified by a session-based user ID stored in memory (in production, this should use proper session management like Redis or JWT)
- **Anonymous votes**: Users are identified by an anonymous ID (see Anonymous Voting section)

Both approaches ensure that the same user cannot vote twice on the same poll.

## How Anonymous Voting Is Handled

Anonymous voting is designed to be **completely untraceable** - even by the development team. This is achieved through a two-tier approach:

### 1. Client-Side ID Generation (Primary Method)

When a user chooses to vote anonymously, the frontend generates a random anonymous user ID **client-side** and stores it in `localStorage`:

```typescript
function generateAnonymousUserId(pollId: string): string {
  const storageKey = `anon_user_${pollId}`
  let anonId = localStorage.getItem(storageKey)
  
  if (!anonId) {
    // Generate a random ID that can't be traced back
    anonId = Math.random().toString(36).substring(2, 15) + 
             Math.random().toString(36).substring(2, 15) +
             Date.now().toString(36)
    localStorage.setItem(storageKey, anonId)
  }
  
  return anonId
}
```

**Key points:**
- The ID is generated on the client and never tied to any server-side identifiers
- The ID is stored per-poll in localStorage to ensure consistency (same user can't vote twice)
- The server receives only this anonymous ID - no IP, user agent, or other identifying information

### 2. Server-Side Hash Generation (Fallback)

If the client doesn't provide an anonymous ID (edge cases), the server creates a one-way SHA256 hash:

```typescript
function generateAnonymousUserId(pollId: string, userAgent: string, ip: string): string {
  const input = `${pollId}-${userAgent}-${ip}`;
  const hash = createHash('sha256').update(input).digest('hex');
  return hash;
}
```

**Important:** Even in this fallback scenario:
- The hash is **one-way** - it cannot be reversed to get the original input
- The hash is poll-specific, so the same user has different IDs for different polls
- This still maintains anonymity as the hash cannot be traced back to a specific individual

### Why This Approach?

- **Privacy-first**: No personally identifiable information is stored for anonymous votes
- **Consistency**: The same user gets the same anonymous ID for a poll (enforced by localStorage or hash consistency)
- **Untraceability**: Even with database access, anonymous votes cannot be linked to real users

## Design Decisions and Rationale

### 1. SQLite Database

**Choice**: Used SQLite instead of PostgreSQL/MySQL  
**Reason**: Simple, file-based database perfect for development and small-scale deployments. No server setup required. Can be easily migrated to PostgreSQL for production if needed.

### 2. In-Memory Session Storage

**Choice**: User sessions stored in a Map in memory  
**Reason**: Simple for development. **Note**: In production, this should be replaced with Redis, database sessions, or JWT tokens to support multiple server instances and persistence.

### 3. Client-Side Anonymous ID Generation

**Choice**: Generate anonymous IDs on the client  
**Reason**: Ensures true anonymity - the server never sees any identifying information. Even if server logs are compromised, anonymous votes remain anonymous.

### 4. GraphQL API

**Choice**: GraphQL instead of REST  
**Reason**: Flexible queries, efficient data fetching (fetch only what's needed), strong typing with schema, and excellent tooling (Apollo Client).

### 5. Modal-Based Chart Display

**Choice**: Charts shown in modals instead of inline  
**Reason**: Better UX - charts are large and benefit from a focused view. Reusable component shared between home page and poll detail page.

### 6. Automatic Chart Display After Voting

**Choice**: Chart modal opens automatically after voting  
**Reason**: Immediate feedback - users see results right after submitting their vote, enhancing engagement.

## Getting Started

### Pre-requirements
npm version: 10.8.2

check version
```bash
npm --version
```
Install requirement version

```bash
npm install -g npm@10.8.2
```
### Install Dependencies

```bash
npm run install:all
```

### Development

Run both frontend and backend concurrently:

```bash
npm run dev
```

Or run them separately:

```bash
# Backend (GraphQL Server)
npm run dev:server

# Frontend (React App)
npm run dev:client
```

### Production Build

```bash
npm run build
```

## Project Structure

```
.
├── client/          # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components (ChartModal, Button)
│   │   ├── pages/         # Page components (Home, PollDetail, CreatePoll)
│   │   ├── queries.ts     # GraphQL queries
│   │   └── mutations.ts   # GraphQL mutations
├── server/          # GraphQL backend
│   ├── src/
│   │   ├── database.ts    # Database initialization and utilities
│   │   ├── models.ts      # Data models and database operations
│   │   ├── schema.ts      # GraphQL schema definitions
│   │   ├── resolvers.ts   # GraphQL resolvers
│   │   └── index.ts       # Server entry point
└── package.json     # Root package.json
```

## Database Schema

- **polls**: Stores poll metadata (title, creator, creation date)
- **poll_options**: Stores options for each poll
- **votes**: Stores votes with user_id and is_anonymous flag
- **users**: Minimal user tracking (currently not heavily used)

The `UNIQUE(poll_id, user_id)` constraint on the votes table ensures one vote per user per poll.

