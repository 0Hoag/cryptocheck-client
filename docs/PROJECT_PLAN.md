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
- [ ] Complete Vietnamese/English coverage across every shared widget, route and async/error state; verify both languages manually on the running app.
  - [x] Translate the news dashboard, article cards, article detail and shared market/news widgets; make relative timestamps locale-aware. (production build passed)
  - [x] Translate the account and pre-launch watchlist workflows, including forms, confirmation/error states and dates. (production build passed)
  - [x] Translate profile follow and post-management controls, including destructive confirmations and ARIA labels. (production build passed)
  - [x] Translate the analysis market list, price/order-book panels and chart statistics; add explicit unavailable/error states for the live order book and keyboard-accessible coin selection. (production build passed)
  - [x] Translate landing-page and empty-state copy; localize the crypto-ranking widget while reducing its Binance request from the full market payload to the ten displayed symbols and adding a retry state. (production build passed)
  - [x] Translate account-menu and mobile-navigation labels/ARIA text in the shared Header, so language selection applies to the whole navigation shell. (production build passed)
- [x] Login and registration forms call the API and persist the session locally.
- [x] Google sign-in affordance is visible as “coming soon”; no fake OAuth flow is enabled.
- [x] Clear expired/401 local sessions so stale authentication is not reused (production build passed).
- [x] Add route protection and a full user profile menu/page. (protected `/account` route redirects unauthenticated users to login and returns them after sign-in; production build passed)
- [ ] Replace localStorage-only auth with the final secure session strategy agreed with the API.

Pass checks:

```bash
npm run build
```

## 2. Scanner experience

- [x] Scanner route exists with clear input guidance and friendly native-coin errors.
- [x] Make landing and scanner copy explicit about public-source/data scope and the fact that automated results are not an audit or safety guarantee. (production build passed)
- [x] ENA smoke test succeeds against the fixed API.
- [x] Render `market_asset` results without showing a false security score; show DexScreener liquidity and 24h volume instead. (production build passed)
- [x] Require a chain/token choice for symbol searches, showing the five strongest candidates and their scan capability. (production build passed)
- [x] Keep every scanner candidate identifiable: show its market logo when available and a letter-avatar fallback when the remote image is missing or fails to load. (production build passed)
- [x] Add a symbol-based public icon CDN fallback and show an avatar on native-asset results, so top coins still have a recognizable logo when DexScreener has no image. (production build passed)
- [x] Show an explicit per-result inspection scope, source-explorer link where available, data-provider context, and a clear non-audit disclaimer. (production build passed)
- [x] Show market-data provider, DEX pair, pair age and confidence without conflating them with a security score. (production build passed)
- [x] Render the limited Solana SPL mint-authority result with a dedicated score label and audit-scope warning. (production build passed)
- [x] Add `/prelaunch` watchlist: public project list and authenticated submission form for website, socials, claimed chain, launch date and verification evidence. (production build passed)
- [x] Let project owners edit and remove their own prelaunch watchlist records without exposing owner IDs. (production build passed)
- [x] Add API-backed scan history for signed-in users, including saved input, scope type, score and timestamp; allow one-click re-scan. (production build passed)
- [x] Add EVM address validation, request timeout/retry, explicit explorer/source availability states, and clear empty-24h-volume wording. (production build passed)
- [x] Add chain-aware address validation for non-EVM contracts before claiming direct-address coverage outside EVM. (Solana SPL mint base58 validation; unsupported direct addresses are stopped locally with actionable guidance; production build passed)
- [x] Render Free versus Premium scanner entitlement/limit information from the authenticated API quota endpoint; server remains the source of truth. (production build passed)
  - [x] Show independent retryable errors for optional quota and scan-history requests, without blocking a scanner request that the API can still authorize. (production build passed)

## 3. Community social experience

- [x] `/community` feed is restored and excludes crawler news posts.
- [x] Authenticated users can create a public post, like/unlike, comment and share a link.
- [x] Anonymous users can read the feed and are prompted to sign in before interaction.
- [x] Add member profile page and author-filtered post feed.
- [x] Add profile follow/unfollow control backed by the API (production build passed).
- [x] Add API-backed follower/following counts to member profiles using the public aggregate-count endpoint. (production build passed)
- [x] Add authenticated Header notification inbox backed by the API, including unread state, bilingual event copy, read/read-all actions, loading and retry states. (production build passed)
  - [x] Open the linked group or post directly after marking its notification read; unsupported resource types remain safely non-navigating. (production build passed)
  - [x] Add a responsive notifications page with read-all, retry and resource navigation, linked from both the desktop inbox and mobile menu. (production build passed)
- [x] Make the post-detail route community-aware, with author profile link and API reaction/comment counts. (production build passed)
- [x] Make post-detail sharing functional with native sharing, clipboard fallback and visible completion/error feedback. (production build passed)
- [x] Add edit/delete ownership UI for a member's own posts on the profile screen. (production build passed)
- [ ] Add robust error/retry feedback for every social mutation; do not silently swallow errors.
  - [x] Show a distinct retryable error when authenticated group-member data fails to load, rather than presenting an unavailable list as empty. (production build passed)
- [ ] Add pagination/infinite loading and optimistic updates with rollback.
- [ ] Add reporting, moderation state and content-safe rendering.
  - [x] Add an authenticated post-report form to post detail, backed by the API with validation, error and success states; anonymous readers get a sign-in prompt. (production build passed)
  - [x] Sanitize raw crawled/article HTML before rendering Markdown so unsafe elements and attributes are removed in the browser. (production build passed)

Pass checks:

```bash
npm run build
# Manual: sign in -> create post -> like -> comment -> reload -> verify state -> delete test post
```

## 4. Premium and group UX

- [x] Add authenticated plan and entitlement status to Account using the API quota endpoint, with loading/retry/error states and explicit server-authority wording. (production build passed)
- [x] Add group directory, group detail, member roles and group post composer.
  - [x] Add API-backed public group directory and detail views, including authentication-aware join/request states and an active-member post composer. (production build passed)
  - [x] Show member roles/status from the authenticated group-members API in group detail. (production build passed)
  - [x] Let group owner/admin approve pending join requests; owner can update member/admin/moderator roles through API-enforced permissions. (production build passed)
  - [x] Let active post authors and API-authorized group moderators delete group posts with confirmation, retry feedback and in-place UI update. (production build passed)
  - [x] Let non-owner members leave a group or withdraw a pending request through the API, with confirmation and in-place membership updates. (production build passed)
  - [x] Add owner-only group deletion with a clear danger zone, confirmation, API error handling and redirect to the directory. (production build passed)
  - [x] Add owner-only group editing for identity, visibility and join policy; private visibility remains enforced by the API entitlement check. (production build passed)
- [ ] Gate “Create group” and enhanced scan actions from API entitlement, with an upgrade CTA.
  - [x] Make group privacy selection entitlement-aware using the authenticated server quota; Free users get a clear private-group upgrade explanation while the API remains the enforcement point. (production build passed)
- [ ] Add checkout UI only after payment provider/API webhook work is complete.

## 5. Quality and release

- [x] Add standalone Docker production configuration for the split client repository. (Next production build passed)
- [x] Reduce global market-ticker polling from the full Binance ticker payload every 10s to the eight displayed symbols every 60s. (production build passed)
- [x] Buffer all-market Binance WebSocket updates in the analysis coin list and commit at most one React update per second. (production build passed)
- [ ] Responsive/mobile audit of all routes.
  - [x] Keep asset selection accessible on the Analysis route at mobile widths and wrap chart metrics/timeframe controls instead of clipping them. (production build passed)
- [ ] Accessibility audit: keyboard, focus, contrast and error announcements.
  - [x] Add a keyboard-visible skip link that moves focus past persistent navigation/tickers to page content. (production build passed)
- [ ] Add component/integration tests for auth, scanner and community states.
- [ ] Add CI for build, lint and tests.
  - [x] Run a reproducible production build on every pull request and push to `main`. (workflow added; local production build passed)
  - [ ] Add lint and test jobs after their baseline failures and test suites are addressed.
