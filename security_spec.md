# Security Specification: VHAT StockSense

## 1. Data Invariants
1. **User Identity Invariant**: A user profile document ID in `/users/{userId}` must strictly match the authenticated user's `request.auth.uid`. Non-authenticated users cannot read or write user profiles.
2. **Catalog Integrity Invariant**: Products, Warehouses, Locations, Operations, and Move History records require an authenticated user.
3. **Immutability of Movements**: Once recorded in `moveHistory`, entries represent an immutable audit trail and cannot be maliciously mutated or deleted.
4. **Operation Progression Invariant**: Operation references and types cannot be altered to impersonate other operation documents.
5. **String & Boundary Invariant**: All input fields have explicit character length limits (<= 160 chars for names, <= 64 chars for IDs/references, <= 600 chars for notes) to prevent Denial of Wallet attacks.

## 2. The "Dirty Dozen" Attack Payloads (Simulated & Guarded)
1. **Unauthenticated User Profile Injection**: Attempt to create `/users/fake_id` without `request.auth` -> Denied.
2. **Cross-User Profile Hijack**: Authenticated user `user_A` writes to `/users/user_B` -> Denied.
3. **Payload Bloat**: Injecting a 2MB JSON object into `Product.name` -> Denied by size constraint.
4. **Negative Quantity Poisoning**: Attempt to insert negative quantity on a Receipt -> Enforced on frontend and validated schema.
5. **Orphaned Location**: Inserting a Location with missing `warehouseId` -> Denied.
6. **Move History Tampering**: Attempt to overwrite an existing ledger record in `/moveHistory/{moveId}` -> Update denied.
7. **Move History Deletion**: Attempt to delete an audit trail entry in `/moveHistory/{moveId}` -> Delete denied.
8. **Invalid Operation Type**: Setting `type` to "HackOperation" -> Denied (only Receipt, Delivery, Transfer, Adjustment permitted).
9. **Invalid Status Bypass**: Setting status to arbitrary status string -> Denied.
10. **Shadow Key Injection**: Injecting hidden administrative keys (e.g. `isSuperAdmin: true`) into user doc -> Denied by schema validation.
11. **ID Traversal Poisoning**: Injecting path characters or oversized document IDs -> Denied by `isValidId()` guard.
12. **Blanket Query Scraping**: Attempting unauthenticated read queries across inventory -> Denied.

## 3. Verification Plan
Deploy `firestore.rules` with strict functions: `isSignedIn()`, `isValidId()`, `isOwner()`, `isValidUserProfile()`, `isValidProduct()`, `isValidOperation()`, `isValidMoveHistory()`.
