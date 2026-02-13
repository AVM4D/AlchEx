# AlchEx AI Coding Agent Instructions

## Project Overview
**AlchEx** is a full-stack, non-monetary student exchange platform built with Node.js/TypeScript (backend) and React 18/Vite (frontend). The core architecture separates concerns into **controllers** → **services** → **repositories**, with real-time communication via **Socket.IO** and scheduled tasks via **node-cron**. The database is **SQL Server** managed by **Prisma ORM**.

## Architecture & Data Flow

### Backend Layers (Service Pattern)
- **Controllers** (`src/controllers/`): HTTP request handlers; call services and return responses
- **Services** (`src/services/`): Business logic; orchestrate repositories and external APIs (e.g., moderation)
- **Repositories** (`src/repositories/`): Data access layer; all Prisma queries isolated here
- **Middlewares** (`src/middlewares/`): Auth (JWT), error handling, validation (Zod)

**Key insight**: Services never directly query Prisma; they call repositories. Controllers never touch Prisma or services' internal state. This isolation makes testing and refactoring safe.

### Critical Data Flows
1. **Post Creation** → `CreatePostPage` (frontend) → POST `/api/posts` → `postController.create()` → `postService.create()` → `postRepository.create()` → Prisma → response
2. **Offer & Transaction** → User sends offer → `offerController.create()` → `postService` checks availability → `offerRepository` + `transactionRepository` (atomic, prefer explicit transaction management)
3. **Real-time Chat** → Socket.IO connection → `messageRepository.create()` + broadcast via socket emit
4. **Admin Actions** → `authorizeAdmin()` middleware validates role → admin-specific controllers (`adminController.banUser()`, etc.)

### Frontend Architecture
- **Pages** (`src/pages/`): Route components with business logic
- **Services** (`src/services/`): API calls (axios), auth, socket, data fetching
- **Stores** (`src/store/`): Zustand stores for auth, UI, notifications (persisted locally)
- **Components** → UI primitives from Radix + custom `GlassCard` for alchemy theme

**State Management Pattern**: Stores handle global state (auth, user, notifications); page components handle local state (form inputs, modals). Services handle API communication—don't duplicate calls.

## Project-Specific Patterns & Conventions

### Error Handling
**Backend**: Inherit from `AppError` base class with status codes and error codes:
```typescript
// ✓ Correct
if (!post) throw new NotFoundError('Post not found');
if (post.userId !== userId) throw new ForbiddenError('Unauthorized');

// ✗ Avoid
if (!post) throw new Error('Post not found');
res.status(404).json({ error: 'Post not found' }); // Use AppError instead
```
Middleware `errorHandler` catches and formats responses. Never call `res.status()` directly.

### Validation Pattern
Use **Zod** schemas in `src/utils/validators.ts`, then reference in controllers:
```typescript
import { CreatePostInput } from '../utils/validators';
export const create = validateInput(CreatePostInput)(async (req, res) => {
  // req.body is now type-safe
});
```

### Soft Deletes & Status Management
Many models use `status` (ACTIVE, COMPLETED, EXPIRED) or `isDeleted` flags. Always filter by status in queries:
```typescript
where: { status: 'ACTIVE', isDeleted: false }
```
Exceptions are noted in schema (e.g., User `isDeleted`, Post `status`). Check `schema.prisma` before writing queries.

### Transactions
For multi-step operations (e.g., accept offer → create transaction → update post status), use Prisma `$transaction()`:
```typescript
await prisma.$transaction([
  prisma.offer.update(...),
  prisma.transaction.create(...),
  prisma.post.update(...),
]);
```

### Socket.IO Messaging
Real-time logic in `src/sockets/index.ts`. Patterns:
- Emit on `message:send` → repository saves → emit to transaction room
- Always subscribe to transaction room: `socket.join(`transaction-${transactionId}`)`
- Use Redis pub/sub for scaling (not currently in codebase, but referenced in comments)

### Cron Jobs & Scheduled Tasks
`src/jobs/cronJobs.ts` runs `node-cron` tasks:
- Post expiry (mark EXPIRED if `expiresAt < now`)
- Leaderboard snapshots (weekly/monthly)
- Never use `setInterval`; use node-cron syntax: `'0 0 * * *'` (daily at midnight)

### Environment Configuration
`src/utils/config.ts` reads `.env` and exports typed config object. Always use `config.property`, not `process.env.PROPERTY` directly.

### Prisma Schema Notes
- **SQL Server specific**: No native ENUM support; strings used instead (e.g., role: "STUDENT" | "ADMIN")
- **Relations**: User → Posts, Offers, Messages, Ratings, Transactions (bidirectional; carefully name with `@relation("Name")`)
- **Indexes**: Placed on frequently queried fields (email, userId, status)
- **Enums as comments**: Document valid values in schema comments

## Development Workflows

### Backend Development
```bash
# Install and setup
cd backend
npm install
npm run prisma:generate  # After schema changes

# Development
npm run dev             # Runs tsx watch (hot reload)

# Database
npm run prisma:migrate  # Create migration after schema.prisma change
npm run prisma:push    # Push schema to DB (no migration file)
npm run prisma:studio  # GUI to view/edit database

# Build & run
npm run build
npm start
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev    # Vite dev server (localhost:5173)
npm run build  # Production build to dist/
```

### Docker & Deployment
```bash
# All services in Docker
docker-compose up -d

# Logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Rebuild
docker-compose down
docker-compose up --build -d
```

## Common Tasks & Pitfalls

### Adding a New Feature (e.g., User Reviews)
1. Update `schema.prisma` → Add Review model with relations
2. `npm run prisma:migrate` → Name it meaningfully (e.g., `add_reviews`)
3. Create `reviewRepository.ts` with CRUD methods
4. Create `reviewService.ts` with business logic (validation, notifications)
5. Create `reviewController.ts` that validates input and calls service
6. Add route in `src/routes/reviewRoutes.ts` and wire to `routes/index.ts`
7. **Frontend**: Create form component, add API call in `services/api.ts`, integrate into page

### Updating Existing Logic
- **Database change**: Update `schema.prisma` → migrate → update repository queries
- **Business logic change**: Update service, not controller (controller is thin)
- **API response format**: Update controller response + frontend API service call in parallel

### Testing Locally
- **Backend**: Use Postman/curl or VSCode REST Client with endpoints from routes
- **Frontend**: `npm run dev` opens Vite, hot-reload on save
- **Real-time**: Open two browser tabs, send message in chat, verify Socket.IO emission

### Common Bugs to Avoid
1. **Querying deleted/inactive resources**: Always filter by `status`, `isDeleted`
2. **Missing auth checks**: Use `authenticateUser` middleware on protected routes
3. **N+1 queries**: Use Prisma `include` or `select` in repositories, not loops
4. **Forgot to await Prisma calls**: All Prisma methods are async
5. **Socket room mismatch**: Ensure client joins same room as backend emits to
6. **Type mismatches**: Frontend expects snake_case from API? Check response format in service layer

## Key Files to Know
- [backend/src/server.ts](backend/src/server.ts) — Express app setup, middleware chain, health check
- [backend/prisma/schema.prisma](backend/prisma/schema.prisma) — All models, relations, enums (as comments)
- [backend/src/routes/index.ts](backend/src/routes/index.ts) — Route mounting (add new routes here)
- [backend/src/utils/errors.ts](backend/src/utils/errors.ts) — All error classes to throw
- [backend/src/middlewares/auth.ts](backend/src/middlewares/auth.ts) — JWT verification, ban checks
- [frontend/src/App.tsx](frontend/src/App.tsx) — Route definitions, lazy loading, ProtectedRoute wrapper
- [frontend/src/store/authStore.ts](frontend/src/store/authStore.ts) — Auth state (token, user, login/logout)
- [frontend/src/services/api.ts](frontend/src/services/api.ts) — Axios instance, API base URL, token injection

## Debugging Tips
- **Backend logs**: Check Docker container logs; look for stack traces in error handler
- **JWT issues**: Verify token in `Authorization: Bearer <token>` header; check secret in `.env`
- **Prisma query errors**: Enable `DEBUG=* npm run dev` for SQL logs
- **Frontend API calls**: Check Network tab in DevTools; verify request body and response
- **Socket.IO**: Check browser console for connection/emission logs; verify room name matches backend

## Moderation & Admin
- **Moderation service** (`src/services/moderationService.ts`) has pluggable architecture; currently uses basic profanity filter + OpenAI stub
- **Admin routes** (`src/routes/adminRoutes.ts`) protected by `authorizeAdmin` middleware
- **Ban workflow**: `adminService.banUser()` → sets `isBanned` flag → auth middleware rejects future requests
