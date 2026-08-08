# FitPulse — Keycloak → Custom JWT Migration

This is your FitPulse project with Keycloak fully removed and replaced with
self-issued JWT authentication (Spring Security-free, HMAC-signed, same
pattern you already built in URL Shortener).

## What changed, and why

### 1. `userservice` is now the identity provider
Previously, all real authentication happened in Keycloak — `userservice`
only ever *stored a mirror* of a Keycloak user (with a dummy password) after
the gateway's `KeycloakUserSyncFilter` auto-registered them on first request.

Now `userservice` does the actual work:
- **`POST /api/users/register`** — hashes the password with BCrypt
  (`spring-security-crypto`, not the full Spring Security starter — no
  need for the extra weight), saves the user, returns a signed JWT.
- **`POST /api/users/login`** — verifies email + password against the
  BCrypt hash, returns a signed JWT.
- New: `security/JwtUtil.java` — signs tokens with HMAC-SHA256 using
  `jjwt` (`io.jsonwebtoken`), same library family you'd reach for outside
  Spring too.
- `User.java` no longer has `keycloakId` — there's no external identity to
  mirror anymore.
- Added `GlobalExceptionHandler` so a duplicate email or bad password
  returns a clean 400 instead of a raw 500 stack trace.
- **Fixed a pre-existing bug while I was in here:** the old `UserResponse`
  DTO included the (hashed) `password` field and returned it to the
  client on every profile fetch. Removed — a response DTO should never
  echo back credential material, hashed or not.

### 2. `gateway` no longer talks to an identity provider at all
- **Removed:** `KeycloakUserSyncFilter.java`, the `gateway/user/` package
  (`UserService`, `WebClientConfig`, `RegisterRequest`, `UserResponse` —
  these only existed to call `userservice` and auto-register a Keycloak
  user; that job doesn't exist anymore since register/login are now first-class
  `userservice` endpoints).
- **Removed:** `spring-boot-starter-oauth2-resource-server` dependency and
  the `jwk-set-uri` pointing at a Keycloak realm.
- **Added:** `security/JwtUtil.java` (validates a token's signature/expiry
  with the *same* HMAC secret `userservice` signs with — no network call
  to an identity provider needed) and `security/JwtAuthenticationFilter.java`
  (a plain `WebFilter` that rejects requests with a missing/invalid token
  and forwards the caller's id as `X-User-ID`, same contract
  `activityservice`/`aiservice` already expected).
- **Removed Spring Security entirely** from the gateway — `SecurityConfig.java`
  is replaced by `CorsConfig.java`, which only handles CORS. This is
  possible specifically because auth is now a plain custom filter instead
  of `oauth2ResourceServer(...)`, which needed the full Spring Security
  filter chain machinery.

### 3. `activityservice` and `aiservice` — untouched
They never talked to Keycloak directly; they trust `X-User-ID`, which the
gateway still provides, just derived differently now (JWT claim instead of
Keycloak sync). Zero changes needed here — worth mentioning in an interview
as evidence the service boundary was well-designed originally.

### 4. `configserver`
- `config/api-gateway.yml` — removed `spring.security.oauth2.resourceserver.jwt.jwk-set-uri`,
  added `jwt.secret` (env-overridable via `JWT_SECRET`, dev-only default committed).
- `config/user-service.yml` — added the same `jwt.secret` + `jwt.expiration-ms`.
  **These two secrets must match** — that's what lets the gateway verify a
  token it didn't issue itself.

### 5. Frontend (`fitness-app-frontend`)
- Removed `react-oauth2-code-pkce` and `authConfig.js` (the PKCE redirect
  flow to Keycloak's `/auth` and `/token` endpoints).
- Added `components/Login.jsx` and `components/Register.jsx` — real forms
  that call `userservice` directly through the gateway.
- `authSlice.js` — now stores `{ token, userId, email }` from your own
  API's response instead of a decoded Keycloak `tokenData` object.
- `api.js` — attaches `Authorization: Bearer <token>` on every request; a
  401 response clears local storage and bounces to `/login`.
- `App.jsx` — route-based `ProtectedRoute` instead of a global
  `AuthContext` provider gate.

## Before you run this

**I could not compile this in my sandbox** — Maven Central isn't reachable
from this environment, so I did a careful manual review instead of a
verified build. Run this before anything else:

```bash
cd userservice && ./mvnw clean install -DskipTests
cd ../gateway && ./mvnw clean install -DskipTests
```

Fix anything that surfaces (should mainly be dependency version
resolution, if anything) before moving on.

## Local setup (unchanged pieces)

You still need Postgres, MongoDB, and RabbitMQ running locally exactly as
before — none of that changed. **You do NOT need to run Keycloak anymore** —
that's the whole point of this migration, and it directly removes your
hardest deployment blocker.

Start order: `eureka` → `configserver` → `userservice` → `activityservice`
→ `aiservice` → `gateway`.

## Testing the new auth flow

```bash
# Register
curl -X POST http://localhost:8080/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"secret123","firstName":"Test","lastName":"User"}'
# -> { "token": "...", "userId": "...", "email": "test@example.com" }

# Login
curl -X POST http://localhost:8080/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"secret123"}'

# Use the token
curl http://localhost:8080/api/activities \
  -H "Authorization: Bearer <token from above>"

# No token -> 401
curl -i http://localhost:8080/api/activities
```

## Updating your resume bullet

Your current FitPulse bullet says *"secured with Keycloak OAuth 2.0 / JWT."*
Once this is deployed, the accurate version is:

> Secured inter-service authentication with self-issued JWTs (HMAC-SHA256,
> BCrypt password hashing), validated at the API Gateway via a custom
> WebFilter — eliminating a dependency on external identity infrastructure.

This is a *stronger* interview story than the Keycloak version, not a
weaker one: you can now explain every line of the auth flow yourself,
because you wrote all of it.
