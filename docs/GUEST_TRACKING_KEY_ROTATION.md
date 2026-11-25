# Guest Order Tracking: Cryptographic Architecture & Key Rotation Protocol

## 1. Architectural Overview & Threat Model

The RANGAROO e-commerce platform provides unauthenticated ("guest") customers with order tracking capabilities while strictly protecting customer Personally Identifiable Information (PII) against enumeration, brute-force discovery, database leak exposure, and side-channel timing analysis.

### 1.1 Cryptographic Design
Guest tracking utilizes a zero-knowledge, keyed authentication token model based on **HMAC-SHA256 (RFC 2104)**:

1. **Token Issuance (At Checkout)**:
   - When a guest customer creates an order (`is_guest: true`), the server generates a high-entropy 256-bit random raw token using a cryptographically secure pseudorandom number generator:
     ```typescript
     const rawGuestToken = crypto.randomBytes(32).toString('hex'); // 64 hex characters (256 bits entropy)
     ```
   - The server computes a keyed Hash-based Message Authentication Code (HMAC-SHA256) over the raw token using a server-side secret key corresponding to the active primary key version:
     ```typescript
     const hmacDigest = crypto.createHmac('sha256', primarySecret).update(rawGuestToken).digest('hex');
     const versionedHash = `${primaryKeyVersion}:${hmacDigest}`; // e.g. "v1:e3b0c442..."
     ```
   - The versioned hash (`versionedHash`) is stored in the database (`public.orders.tracking_token_hash`).
   - The raw token (`rawGuestToken`) is returned strictly once to the client in the checkout API response and embedded in order confirmation communication. The raw token is **never stored in the database, never written to disk, and never output in application logs**.

2. **Verification (At Order Tracking Endpoint)**:
   - The client supplies the `orderNumber` and raw `token` via query parameters to `/api/orders/track`.
   - The server inspects the stored `tracking_token_hash` on the order record, parses the version prefix (`v1:`, `v2:`, etc.), and resolves the matching server secret.
   - The server calculates the HMAC-SHA256 over the provided raw token using that version secret.
   - The server validates equality using `crypto.timingSafeEqual` over fixed-length binary buffers to prevent timing side-channel attacks.

### 1.2 Confidentiality & Isolation Invariants
- **Secret Isolation**: HMAC secrets (`GUEST_TRACKING_HMAC_SECRET_*`) reside exclusively in server-side environment variables. They must **NEVER** be prefixed with `NEXT_PUBLIC_`, never included in client JavaScript bundles, never committed to git repositories, and never written to database rows or review bundles.
- **Database Dump Immunity**: If an attacker obtains a full SQL database backup or read-only replica dump, the stored hashes (`v1:<hex>`) cannot be reversed to produce raw tracking tokens. Unlike unkeyed SHA-256 hashes, HMAC hashes cannot be cracked with precomputed rainbow tables because the attacker lacks the server secret.
- **Enumeration & Timing Defense**: All failed verification attempts return an identical generic HTTP 404 (`ORDER_NOT_FOUND`) response with constant-time dummy HMAC operations, preventing attackers from discerning whether an order exists.
- **Distributed Rate Limiting**: All tracking attempts are throttled by an atomic PostgreSQL-backed rate limiter (`check_rate_limit`) enforcing a maximum threshold of 5 requests per minute per IP address.

---

## 2. Key Versioning Schema

All stored guest tracking hashes adhere to a strict version-prefixed format:

```text
${KEY_VERSION}:${HEX_DIGEST}
```

- `${KEY_VERSION}`: The version identifier matching the regular expression `^v\d+$` (e.g. `v1`, `v2`, `v3`).
- `${HEX_DIGEST}`: A 64-character lowercase hexadecimal string representing the 256-bit HMAC-SHA256 digest.
- Example: `v1:9b73c68f7b5ea1de866ac132798c5bed9a35d9d5f4390c03eeff5db6b0f135fa`

### 2.1 Server Environment Key Dictionary
The application supports an extensible multi-version key dictionary defined across server environment variables:

| Environment Variable | Description | Requirement | Example Value |
|----------------------|-------------|-------------|---------------|
| `GUEST_TRACKING_PRIMARY_KEY_VERSION` | Active version for newly issued tokens | Optional (defaults to `v1`) | `v2` |
| `GUEST_TRACKING_HMAC_SECRET_V1` | Secret key for `v1` tokens | Required if `v1` tokens active | `64_char_hex_random_key_v1` |
| `GUEST_TRACKING_HMAC_SECRET_V2` | Secret key for `v2` tokens | Required if `v2` tokens active | `64_char_hex_random_key_v2` |
| `GUEST_TRACKING_HMAC_SECRET` | Global fallback secret | Fallback if version var unset | `64_char_hex_random_default` |

```bash
# Production .env.production configuration example
GUEST_TRACKING_PRIMARY_KEY_VERSION=v2
GUEST_TRACKING_HMAC_SECRET_V1=a94f6e1b78902c34d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8
GUEST_TRACKING_HMAC_SECRET_V2=b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2
```

---

## 3. Cryptographic Verification & Dual-Verification Algorithm

The verification workflow in `app/api/orders/track/route.ts` dynamically accommodates multiple simultaneous key versions:

```
                          Incoming Request: (orderNumber, rawToken)
                                             │
                                             ▼
                             Fetch Order from Database
                                             │
                     ┌───────────────────────┴───────────────────────┐
                     ▼                                               ▼
            Order Not Found                               Order Record Retrieved
                     │                                               │
                     ▼                                               ▼
           Execute Constant-Time                            Inspect tracking_token_hash
           Dummy HMAC & Compare                                      │
                     │                                               ▼
                     │                                    Format has "v<N>:" prefix?
                     │                                      ┌────────┴────────┐
                     │                                      ▼ YES             ▼ NO
                     │                           Extract version <N>    Fallback to Legacy
                     │                           & stored digest        (plain sha256 / v1)
                     │                                      │                 │
                     │                                      ▼                 ▼
                     │                           Resolve HMAC Secret    Compute Candidate
                     │                           for version <N>        Digests
                     │                                      │                 │
                     │                                      └────────┬────────┘
                     │                                               │
                     │                                               ▼
                     │                                  Execute timingSafeCompareHex()
                     │                                               │
                     │                                      ┌────────┴────────┐
                     │                                      ▼ MATCH           ▼ MISMATCH
                     │                              Transparent Upgrade?      │
                     │                                      │                 │
                     │                                      ▼                 ▼
                     └─────────────────────────────► Return HTTP 404    Return HTTP 404
                                                     (Anti-Enumeration) (Anti-Enumeration)
```

### 3.1 Constant-Time Equality Implementation
Timing attacks measure minute variations in string comparison duration to infer secret data character-by-character. To eliminate this vector:
1. Candidate and target hashes are converted into fixed-length binary buffers (`Buffer.from(hexStr, 'hex')`).
2. If buffer lengths differ, a dummy comparison against a static buffer is performed in constant time, and `false` is returned.
3. If buffer lengths match (32 bytes), `crypto.timingSafeEqual(bufA, bufB)` is invoked.

---

## 4. Transparent Re-Hashing Upgrade Protocol

To ensure customer links remain valid indefinitely while migrating security parameters to newer keys, the application executes **opportunistic transparent re-hashing**:

1. **Trigger Condition**:
   - A customer presents a valid raw token.
   - The token successfully verifies against an older key version (e.g. `v1:`) or a legacy unversioned hash.
   - The active primary key version is newer (e.g. `v2`).
2. **Upgrade Execution**:
   - The server computes the new HMAC digest using the active primary key secret:
     ```typescript
     const primaryDigest = computeKeyedHmac(token, PRIMARY_KEY_VERSION);
     const upgradedFormat = `${PRIMARY_KEY_VERSION}:${primaryDigest}`;
     ```
   - The database record is asynchronously updated:
     ```sql
     UPDATE public.orders
     SET tracking_token_hash = $1, updated_at = clock_timestamp()
     WHERE id = $2;
     ```
3. **Operational Guarantees**:
   - **Zero Downtime**: Customers never encounter broken links or invalid tracking tokens during or after key rotation.
   - **Lazy Migration**: Active orders are updated at rest automatically as customers check their order status.
   - **Zero Manual DB Re-encryption**: Eliminates the operational complexity of decrypting and re-encrypting large tables in batch operations.

---

## 5. Operational Runbook: Scheduled Key Rotation

Follow this four-phase protocol for regular quarterly or annual cryptographic key rotations (e.g., advancing from `v1` to `v2`).

### Phase 1: Key Generation & Multi-Secret Deployment
1. Generate a new high-entropy 256-bit secret key:
   ```bash
   openssl rand -hex 32
   # Output: 4f3a8c19e62b5d40a71f8e93c2b1d0e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1
   ```
2. Add the new secret to the server environment configuration alongside existing active secrets:
   ```env
   # Leave primary issuance on v1 while deploying v2 verification capability
   GUEST_TRACKING_PRIMARY_KEY_VERSION=v1
   GUEST_TRACKING_HMAC_SECRET_V1=<existing_v1_secret>
   GUEST_TRACKING_HMAC_SECRET_V2=4f3a8c19e62b5d40a71f8e93c2b1d0e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1
   ```
3. Deploy the environment update. Validate that test requests for existing `v1` orders continue to verify successfully.

### Phase 2: Promotion of Primary Key Version
1. Promote `v2` as the active primary version for all newly issued tokens:
   ```env
   GUEST_TRACKING_PRIMARY_KEY_VERSION=v2
   GUEST_TRACKING_HMAC_SECRET_V1=<existing_v1_secret>
   GUEST_TRACKING_HMAC_SECRET_V2=4f3a8c19e62b5d40a71f8e93c2b1d0e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1
   ```
2. Deploy the configuration. All subsequent checkouts on `/api/checkout` will issue tokens hashed with `v2:`.
3. Existing `v1:` tokens submitted to `/api/orders/track` continue to validate against `GUEST_TRACKING_HMAC_SECRET_V1` and are transparently upgraded to `v2:` in the database upon access.

### Phase 3: Observation & Monitoring
1. Monitor application logs and query database version distribution:
   ```sql
   SELECT 
     split_part(tracking_token_hash, ':', 1) AS key_version,
     COUNT(*) AS order_count
   FROM public.orders
   WHERE is_guest = true AND tracking_token_hash IS NOT NULL
   GROUP BY split_part(tracking_token_hash, ':', 1);
   ```
2. Verify that `v2` token counts increase while `v1` token counts diminish as orders are accessed or age past fulfillment.

### Phase 4: Deprecation of Expired Historical Keys
1. Tracking tokens have a maximum lifetime of 30 days (`tracking_token_expires_at`).
2. Once 30 days have elapsed since Phase 2 promotion, all remaining un-accessed `v1` tokens have naturally expired.
3. Safely decommission `GUEST_TRACKING_HMAC_SECRET_V1`:
   ```env
   GUEST_TRACKING_PRIMARY_KEY_VERSION=v2
   GUEST_TRACKING_HMAC_SECRET_V2=4f3a8c19e62b5d40a71f8e93c2b1d0e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1
   ```

---

## 6. Operational Runbook: Emergency Key Compromise Recovery

If a secret key (e.g. `GUEST_TRACKING_HMAC_SECRET_V1`) is suspected or confirmed to have been exposed in logs, version control, or server environment breach:

### Emergency Procedure: Immediate Containment
1. **Immediate Revocation of Compromised Key**:
   - Immediately remove the compromised secret variable from the production environment.
   - Immediately generate and deploy a clean secret for a new version (e.g. `v3`):
     ```bash
     openssl rand -hex 32
     ```
   - Update production environment:
     ```env
     GUEST_TRACKING_PRIMARY_KEY_VERSION=v3
     GUEST_TRACKING_HMAC_SECRET_V3=<new_secure_secret>
     # Compromised GUEST_TRACKING_HMAC_SECRET_V1 is REMOVED immediately
     ```
   - Deploy immediately. This terminates all spoofing capability using the compromised secret.

2. **Database Token Invalidation**:
   - Invalidate all pending guest order tracking tokens that relied on the compromised version to prevent unauthorized access to customer shipping statuses:
     ```sql
     UPDATE public.orders
     SET tracking_token_revoked_at = clock_timestamp(),
         updated_at = clock_timestamp()
     WHERE tracking_token_hash LIKE 'v1:%'
       AND tracking_token_revoked_at IS NULL;
     ```

3. **Customer Notification & Re-Issuance**:
   - Customers with active unfulfilled orders affected by the emergency revocation should be notified via verified email (`Brevo` email service) with a freshly generated secure tracking link.
   - For authenticated users, orders remain fully accessible in their account portal without relying on guest tracking tokens.

4. **Forensic Audit & Post-Mortem**:
   - Audit web server access logs for anomalous access patterns to `/api/orders/track`.
   - Verify that the rate limiter blocked automated brute-force attempts.
   - Document root cause of secret exposure and implement automated CI/CD secret scanning.
