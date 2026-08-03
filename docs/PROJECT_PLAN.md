# CryptoCheck — client implementation plan

> Status convention: `[x]` = implemented and verified; `[ ]` = not complete.
> A checkbox changes only after the listed verification has passed.

## Operating rules

- Keep each user-facing feature in a focused commit and push after verification.
- Show loading, empty, unauthorized and retry states for every async screen.
- Client-side Premium labels are presentation only; API entitlement is the source of truth.

## 1. Current shell and identity

- [x] Landing page, news dashboard, scanner and shared Header/Footer are restored.
- [x] Replace shared Footer placeholder links with real bilingual information/legal/FAQ routes; resource links now navigate to the available Analysis route and unconfigured social channels are no longer fake clickable destinations. (targeted lint + Vitest + production build passed)
- [x] Vietnamese/English switcher is restored and persisted locally.
- [ ] Complete Vietnamese/English coverage across every shared widget, route and async/error state; verify both languages manually on the running app.
  - [x] Translate the news dashboard, article cards, article detail and shared market/news widgets; make relative timestamps locale-aware. (production build passed)
  - [x] Translate the account and pre-launch watchlist workflows, including forms, confirmation/error states and dates. (production build passed)
  - [x] Translate profile follow and post-management controls, including destructive confirmations and ARIA labels. (production build passed)
  - [x] Translate the analysis market list, price/order-book panels and chart statistics; add explicit unavailable/error states for the live order book and keyboard-accessible coin selection. (production build passed)
  - [x] Translate landing-page and empty-state copy; localize the crypto-ranking widget while reducing its Binance request from the full market payload to the ten displayed symbols and adding a retry state. (production build passed)
  - [x] Translate account-menu and mobile-navigation labels/ARIA text in the shared Header, so language selection applies to the whole navigation shell. (production build passed)
  - [x] Synchronize the document language with the persisted VN/EN choice so browser and assistive-technology language handling matches visible UI. (production build passed)
  - [x] Translate remaining MarketWidgets labels, Fear/Greed classifications and demo-calendar copy; translate the professional-chart 24h volume label and avoid presenting static demo data as a working “View all” action. (targeted lint + 14 Vitest tests + production build passed)
  - [x] Load persisted language through a subscription-safe external store, so switching language updates the full app without an effect-driven state cascade. (targeted lint + production build passed)
  - [x] Translate the remaining Login/Register section labels and verify the forms in both VN and EN modes. (targeted lint + Vitest + production build passed)
- [x] Login and registration forms call the API and persist the session locally.
- [x] Google sign-in affordance is visible as “coming soon”; no fake OAuth flow is enabled.
- [x] Clear expired/401 local sessions so stale authentication is not reused (production build passed).
- [x] Validate the locally stored user shape before rendering authenticated UI; malformed/incomplete storage is cleared instead of reaching Header or protected routes. (Vitest + production build passed)
- [x] Add route protection and a full user profile menu/page. (protected `/account` route redirects unauthenticated users to login and returns them after sign-in; production build passed)
- [ ] Replace localStorage-only auth with the final secure session strategy agreed with the API.

Pass checks:

```bash
npm run build
```

## 2. Scanner experience

- [x] Scanner route exists with clear input guidance and friendly native-coin errors.
  - [x] Link scanner input help text semantically and return keyboard focus to the input when a user chooses “Edit input” from an error state. (targeted lint + 14 Vitest tests + production build passed)
- [x] Make landing and scanner copy explicit about public-source/data scope and the fact that automated results are not an audit or safety guarantee. (production build passed)
- [x] ENA smoke test succeeds against the fixed API.
- [x] Render `market_asset` results without showing a false security score; show DexScreener liquidity and 24h volume instead. (production build passed)
- [x] Require a chain/token choice for symbol searches, showing the five strongest candidates and their scan capability. (production build passed)
- [x] Keep every scanner candidate identifiable: show its market logo when available and a letter-avatar fallback when the remote image is missing or fails to load. (production build passed)
- [x] Add a symbol-based public icon CDN fallback and show an avatar on native-asset results, so top coins still have a recognizable logo when DexScreener has no image. (production build passed)
- [x] Show an explicit per-result inspection scope, source-explorer link where available, data-provider context, and a clear non-audit disclaimer. (production build passed)
- [x] Display the server-generated scanner analysis timestamp so a result communicates when its automatic checks were performed. (targeted lint + Vitest + production build passed)
- [x] Show market-data provider, DEX pair, pair age and confidence without conflating them with a security score. (production build passed)
- [x] Render the limited Solana SPL mint-authority result with a dedicated score label and audit-scope warning. (production build passed)
- [x] Add `/prelaunch` watchlist: public project list and authenticated submission form for website, socials, claimed chain, launch date and verification evidence. (production build passed)
- [x] Let project owners edit and remove their own prelaunch watchlist records without exposing owner IDs. (production build passed)
  - [x] Separate prelaunch-list loading failures from form mutation errors and provide a retry path for the public watchlist. (production build passed)
	- [x] Normalize legacy nullable prelaunch project arrays (`social_urls`, `evidence`, `risk_flags`) and reject malformed payloads before rendering, so watchlist cards cannot crash on `.map` or `.join`. (Vitest + production build passed)
- [x] Add API-backed scan history for signed-in users, including saved input, scope type, score and timestamp; allow one-click re-scan. (production build passed)
- [x] Add EVM address validation, request timeout/retry, explicit explorer/source availability states, and clear empty-24h-volume wording. (production build passed)
- [x] Add chain-aware address validation for non-EVM contracts before claiming direct-address coverage outside EVM. (Solana SPL mint base58 validation; unsupported direct addresses are stopped locally with actionable guidance; production build passed)
- [x] Render Free versus Premium scanner entitlement/limit information from the authenticated API quota endpoint; server remains the source of truth. (production build passed)
  - [x] Show independent retryable errors for optional quota and scan-history requests, without blocking a scanner request that the API can still authorize. (production build passed)
	- [x] Normalize legacy nullable scanner history/candidate lists before render and reject malformed list payloads into the existing retry state. (Vitest + production build passed)

## 3. Community social experience

- [x] `/community` feed is restored and excludes crawler news posts.
- [x] Identify source-crawled news detail as an automated public-content summary/translation and direct readers to the original article for the complete context. (targeted lint + Vitest + production build passed)
- [x] Authenticated users can create a public post, like/unlike, comment and share a link.
- [x] Keep the client post contract compatible with `followers` visibility; create/update helpers can send the permission once the Community composer exposes the choice. (Vitest + production build passed)
- [x] Anonymous users can read the feed and are prompted to sign in before interaction.
- [x] Add member profile page and author-filtered post feed.
- [x] Add profile follow/unfollow control backed by the API (production build passed).
- [x] Add API-backed follower/following counts to member profiles using the public aggregate-count endpoint. (production build passed)
- [x] Add authenticated Header notification inbox backed by the API, including unread state, bilingual event copy, read/read-all actions, loading and retry states. (production build passed)
  - [x] Normalize the legacy empty notification response (`data: null`) before shared navigation renders it, and reject malformed notification payloads with a visible retry state rather than crashing Header on `.some()`. (Vitest + production build passed)
  - [x] Open the linked group or post directly after marking its notification read; unsupported resource types remain safely non-navigating. (production build passed)
  - [x] Add a responsive notifications page with read-all, retry and resource navigation, linked from both the desktop inbox and mobile menu. (production build passed)
- [x] Make the post-detail route community-aware, with author profile link and API reaction/comment counts. (production build passed)
- [x] Make post-detail sharing functional with native sharing, clipboard fallback and visible completion/error feedback. (production build passed)
- [x] Add edit/delete ownership UI for a member's own posts on the profile screen. (production build passed)
- [ ] Add robust error/retry feedback for every social mutation; do not silently swallow errors.
	- [x] Add a localized global route-error fallback with retry, home navigation and a safe production support ID, so unexpected rendering failures never leave a blank screen. (targeted lint + Vitest + production build passed)
	- [x] Add a visible, retryable post-detail loading failure state that preserves API request IDs, rather than logging a failed post fetch and rendering an unexplained missing post. (Vitest + production build passed)
	- [x] Preserve API request IDs and offer an in-place retry when profile posts, follow state or aggregate counts fail to load. (targeted lint + Vitest + production build passed)
	- [x] Show a distinct retryable error when authenticated group-member data fails to load, rather than presenting an unavailable list as empty. (production build passed)
  - [x] Preserve API `request_id` values in shared error text so production failures can be reported and traced without changing each screen independently. (Vitest + production build passed)
- [ ] Add pagination/infinite loading and optimistic updates with rollback.
	- [x] Use the post-feed pagination metadata on the News dashboard: load 12 items at a time, deduplicate appended items, expose retry and stop when the API reports the last page. (targeted lint + 9 tests + production build passed)
	- [x] Let readers choose newest-first or oldest-first order on the News dashboard; use the validated server feed-sort contract instead of an untyped Mongo-style sort string. (lint:ci + Vitest + production build passed)
	- [x] Add metadata-backed profile-feed pagination with deduplicated “load more” results, a separate retryable failure state, and malformed-response contract coverage. (targeted lint + 14 Vitest tests + production build passed)
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
  - [x] Preserve API request IDs for failed entitlement checks and provide an explicit in-place retry from Account. (targeted lint + 14 Vitest tests + production build passed)
- [x] Add group directory, group detail, member roles and group post composer.
  - [x] Normalize legacy `null` group, member and post lists before rendering, so an empty collection cannot crash a route through `.length` or `.map`. (Vitest + production build passed)
  - [x] Add API-backed public group directory and detail views, including authentication-aware join/request states and an active-member post composer. (production build passed)
  - [x] Show member roles/status from the authenticated group-members API in group detail. (production build passed)
  - [x] Let group owner/admin approve pending join requests; owner can update member/admin/moderator roles through API-enforced permissions. (production build passed)
  - [x] Let active post authors and API-authorized group moderators delete group posts with confirmation, retry feedback and in-place UI update. (production build passed)
  - [x] Let non-owner members leave a group or withdraw a pending request through the API, with confirmation and in-place membership updates. (production build passed)
  - [x] Add owner-only group deletion with a clear danger zone, confirmation, API error handling and redirect to the directory. (production build passed)
  - [x] Add owner-only group editing for identity, visibility and join policy; private visibility remains enforced by the API entitlement check. (production build passed)
- [ ] Gate “Create group” and enhanced scan actions from API entitlement, with an upgrade CTA.
  - [x] Make group privacy selection entitlement-aware using the authenticated server quota; Free users get a clear private-group upgrade explanation while the API remains the enforcement point. (production build passed)
  - [x] Restrict the group-creation entry point to active Premium users and show Free users an Account/Premium CTA; the API enforces the same rule. (production build passed)
  - [x] Show authenticated Free scanner users an Account/Premium CTA alongside the server-sourced quota, without exposing a fake checkout flow. (targeted lint + production build passed)
	- [x] Distinguish a failed group-entitlement check from a confirmed Free plan; the group directory now offers an explicit retry instead of showing an incorrect upgrade CTA. (targeted lint + Vitest + production build passed)
- [ ] Add checkout UI only after payment provider/API webhook work is complete.

## 5. Quality and release

- [x] Default local development to Next webpack and keep Turbopack as an explicit opt-in command after observing excessive Turbopack memory usage on macOS. (Next CLI flag verified + production build passed)
- [x] Add standalone Docker production configuration for the split client repository. (Next production build passed)
- [x] Default browser API calls to same-origin `/api` and make Next's production rewrite target the Docker `backend-api` service, preventing an unset public API variable from compiling `localhost:8080` into visitor browsers. (targeted lint + Vitest + production build passed)
	- [x] Bound routine browser API calls to 15 seconds so a stalled origin/proxy cannot leave News, Groups, Profile or Account waiting indefinitely; scanner calls explicitly retain their provider-aware 45-second timeout. (Vitest + production build passed)
- [x] Reduce global market-ticker polling from the full Binance ticker payload every 10s to the eight displayed symbols every 60s. (production build passed)
- [x] Reduce Analysis market-list streaming from Binance's all-market feed to only the displayed symbols, ignore updates while the tab is hidden, and cut duplicate animated ticker nodes across the persistent shell. (targeted lint + Vitest + production build passed)
- [x] Pause ticker/ranking polling and abort in-flight market requests whenever the browser tab is hidden, avoiding background work on persistent layout widgets. (targeted lint + Vitest + production build passed)
- [x] Pause the top-ranking market widget and abort its in-flight provider request while the widget itself is off-screen, not only when the browser tab is hidden. (targeted lint + Vitest + production build passed)
- [x] Skip realtime market/chart/order-book message parsing and React updates while the Analysis tab is hidden. (targeted lint + Vitest + production build passed)
- [x] Pause persistent market/news marquee animations when they scroll outside the viewport, reducing visual-only GPU work while reading long pages. (targeted lint + Vitest + production build passed)
- [x] Load the heavyweight professional-chart bundle after the Analysis shell is visible, so route navigation can render controls and market state without waiting for chart initialization. (targeted lint + Vitest + production build passed)
- [x] Add a lightweight app-level route loading shell, so navigation gives immediate visual feedback while a route chunk or server segment is loading. (targeted lint + Vitest + production build passed)
- [x] Abort obsolete Analysis chart REST requests when changing a market or timeframe, preventing stale candles and unnecessary client work. (targeted lint + Vitest + production build passed)
- [x] Show an in-context Analysis chart loading failure with a retry action instead of leaving Binance provider errors only in the browser console. (targeted lint + Vitest + production build passed)
- [x] Add validated, retryable provider-error states for the persistent Fear/Greed and breaking-news widgets; abort stale sentiment requests on unmount. (targeted lint + Vitest + production build passed)
- [x] Buffer all-market Binance WebSocket updates in the analysis coin list and commit at most one React update per second. (production build passed)
- [ ] Responsive/mobile audit of all routes.
  - [x] Keep asset selection accessible on the Analysis route at mobile widths and wrap chart metrics/timeframe controls instead of clipping them. (production build passed)
  - [x] Manually verify Home, Scanner, Groups and Analysis at a 390px viewport: no horizontal overflow; mobile navigation and the VN/EN switch work. API-unavailable states on Scanner/Groups remain visible with retry controls. (local browser audit)
- [ ] Accessibility audit: keyboard, focus, contrast and error announcements.
  - [x] Add a keyboard-visible skip link that moves focus past persistent navigation/tickers to page content. (production build passed)
  - [x] Localize the shared keyboard skip-link using the active VN/EN language setting. (targeted lint + Vitest + production build passed)
  - [x] Make Header account, notification and mobile menus dismissible with Escape, return focus to their trigger, and expose matching ARIA controls. (targeted lint + Vitest + production build passed)
  - [x] Give the Pre-launch watchlist form stable semantic labels (instead of placeholder-only inputs) and explicit submit behavior for keyboard and screen-reader users. (targeted lint + Vitest + production build passed)
- [ ] Add component/integration tests for auth, scanner and community states.
  - [x] Add a Vitest/jsdom baseline and cover valid, expired and explicit sign-out browser sessions in the auth storage helper. (3 tests passed; targeted lint + production build passed)
  - [x] Reuse the shared safe API-error reader in Pre-launch and cover error, source/domain, markdown-image and truncation helper branches. (6 tests passed; targeted lint + production build passed)
  - [x] Extract Scanner direct-address classification and cover EVM, Solana Base58, malformed and oversized inputs. (9 tests passed; targeted lint + production build passed; dynamic token-image warning remains)
  - [x] Validate the post-feed response contract before rendering News pagination, including legacy no-meta responses and malformed payload failures. (12 tests passed; targeted lint + production build passed)
- [ ] Add CI for build, lint and tests.
  - [x] Run a reproducible production build on every pull request and push to `main`. (workflow added; local production build passed)
  - [x] Run the Vitest suite before the production build on every pull request and push to `main`. (local 3-test suite + production build passed)
  - [x] Remove targeted lint errors from News, Login, Register and Profile by using the shared safe API-error reader and const-correct data handling. (targeted lint + production build passed)
  - [x] Type the shared post-feed pagination response instead of accepting an untyped API metadata object. (targeted lint + production build passed)
  - [x] Remove Scanner lint errors by using typed request-error handling and key-based token-icon resets instead of synchronous effect state. (targeted lint + production build passed)
  - [x] Type Analysis order-book messages and prevent stale rows from appearing while a newly selected market is loading. (targeted lint + production build passed)
  - [x] Type Binance ticker payloads in the global ticker and top-ranking widgets, and reject invalid provider payloads safely. (targeted lint + production build passed)
  - [x] Validate Binance mini-ticker websocket payloads and initialize the market coin list without synchronous effect state updates. (targeted lint + production build passed; remote-image warning remains)
  - [x] Validate CustomChart REST/websocket candle payloads and keep the candle renderer stable outside React render. (targeted lint + production build passed)
  - [x] Type ProfessionalChart REST/websocket market payloads, remove unsafe chart-series casts and fix crosshair state initialization. (targeted lint + production build passed)
  - [x] Reduce the global lint baseline to one user-owned Community type error plus 13 non-blocking warnings; do not claim full lint completion until that isolated file and remaining warnings are addressed. (global lint audited)
  - [x] Remove the unused market-widget icon import; the remaining image warnings use dynamic third-party URLs and need a safe media-proxy/allowlist decision rather than a cosmetic suppression. (targeted lint + 9 tests + production build passed)
- [x] Centralize dynamic article/token/market images behind an HTTPS-only, local-network-blocking browser renderer with a referrer-free request policy and visible fallbacks; a server media proxy remains intentionally deferred until it has explicit abuse controls and an allowlist. (targeted lint + Vitest + production build passed)
- [x] Give all Next-optimized article and market images explicit responsive `sizes`, removing their development warnings and preventing oversized image selection. (targeted lint + Vitest + production build passed)
- [x] Stabilize notification and scanner data loaders with dependency-safe callbacks, so language changes do not retain stale async closures. (targeted lint + production build passed)
- [x] Keep Header notification loading independent from the VN/EN render state, so changing language does not trigger an unnecessary notification API request. (targeted lint + Vitest + production build passed)
  - [x] Stabilize Group-list and Prelaunch watchlist loaders so translated API errors and refreshes use the active language. (targeted lint + production build passed; remote group-avatar warning remains)
  - [x] Stabilize Group-detail and member-list loading dependencies without changing group CRUD behavior. (targeted lint + production build passed; remote group-avatar warning remains)
  - [x] Run lint (excluding the explicitly user-owned, currently dirty Community edit), Vitest and production build on every pull request and push to `main`; remove that temporary exclusion once the Community edit is finalized. (lint:ci + Vitest + production build passed)
