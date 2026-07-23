# CryptoCheck — client implementation plan

> Status convention: `[x]` = implemented and verified; `[ ]` = not complete.
> A checkbox changes only after the listed verification has passed.

## Operating rules

- Keep each user-facing feature in a focused commit and push after verification.
- Show loading, empty, unauthorized and retry states for every async screen.
- Client-side Premium labels are presentation only; API entitlement is the source of truth.

## 1. Current shell and identity

- [x] Landing page, news dashboard, scanner and shared Header/Footer are restored.
- [x] Vietnamese/English switcher is restored and persisted locally.
- [x] Login and registration forms call the API and persist the session locally.
- [x] Google sign-in affordance is visible as “coming soon”; no fake OAuth flow is enabled.
- [x] Clear expired/401 local sessions so stale authentication is not reused (production build passed).
- [ ] Add route protection and a full user profile menu/page.
- [ ] Replace localStorage-only auth with the final secure session strategy agreed with the API.

Pass checks:

```bash
npm run build
```

## 2. Scanner experience

- [x] Scanner route exists with clear input guidance and friendly native-coin errors.
- [x] ENA smoke test succeeds against the fixed API.
- [x] Render `market_asset` results without showing a false security score; show DexScreener liquidity and 24h volume instead. (production build passed)
- [x] Require a chain/token choice for symbol searches, showing the five strongest candidates and their scan capability. (production build passed)
- [x] Keep every scanner candidate identifiable: show its market logo when available and a letter-avatar fallback when the remote image is missing or fails to load. (production build passed)
- [x] Add a symbol-based public icon CDN fallback and show an avatar on native-asset results, so top coins still have a recognizable logo when DexScreener has no image. (production build passed)
- [x] Show market-data provider, DEX pair, pair age and confidence without conflating them with a security score. (production build passed)
- [x] Render the limited Solana SPL mint-authority result with a dedicated score label and audit-scope warning. (production build passed)
- [x] Add `/prelaunch` watchlist: public project list and authenticated submission form for website, socials, claimed chain, launch date and verification evidence. (production build passed)
- [x] Let project owners edit and remove their own prelaunch watchlist records without exposing owner IDs. (production build passed)
- [ ] Add scan history for signed-in users.
- [ ] Add network/address validation, loading timeout/retry and explicit explorer/source availability states.
- [ ] Render Free versus Premium capability/limit information from API entitlements.

## 3. Community social experience

- [x] `/community` feed is restored and excludes crawler news posts.
- [x] Authenticated users can create a public post, like/unlike, comment and share a link.
- [x] Anonymous users can read the feed and are prompted to sign in before interaction.
- [x] Add member profile page and author-filtered post feed.
- [x] Add profile follow/unfollow control backed by the API (production build passed).
- [x] Add API-backed follower/following counts to member profiles using the public aggregate-count endpoint. (production build passed)
- [x] Make the post-detail route community-aware, with author profile link and API reaction/comment counts. (production build passed)
- [x] Add edit/delete ownership UI for a member's own posts on the profile screen. (production build passed)
- [ ] Add robust error/retry feedback for every social mutation; do not silently swallow errors.
- [ ] Add pagination/infinite loading and optimistic updates with rollback.
- [ ] Add reporting, moderation state and content-safe rendering.

Pass checks:

```bash
npm run build
# Manual: sign in -> create post -> like -> comment -> reload -> verify state -> delete test post
```

## 4. Premium and group UX

- [ ] Add plans and entitlement status page once API domain is available.
- [ ] Add group directory, group detail, member roles and group post composer.
- [ ] Gate “Create group” and enhanced scan actions from API entitlement, with an upgrade CTA.
- [ ] Add checkout UI only after payment provider/API webhook work is complete.

## 5. Quality and release

- [x] Add standalone Docker production configuration for the split client repository. (Next production build passed)
- [x] Reduce global market-ticker polling from the full Binance ticker payload every 10s to the eight displayed symbols every 60s. (production build passed)
- [x] Buffer all-market Binance WebSocket updates in the analysis coin list and commit at most one React update per second. (production build passed)
- [ ] Responsive/mobile audit of all routes.
- [ ] Accessibility audit: keyboard, focus, contrast and error announcements.
- [ ] Add component/integration tests for auth, scanner and community states.
- [ ] Add CI for build, lint and tests.
