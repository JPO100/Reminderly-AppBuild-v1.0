# 5 for Free paywall - specification

Status: approved specification v1.0 (2026-10-14). Not implemented on main. No code, branch or Apple account work has started.

Approved by John (CEO/CPO) and the CTO, following product overview drafts v0.1 and v0.2, Claude's technical reviews and the CTO response of 2026-10-14. This document supersedes those drafts. The implementation plan and sequence follow separately.

Related: [release-readiness.md](../release-readiness.md) (Monetisation), [features/settings.md](../features/settings.md) (flags and Dev tools), [features/reminders.md](../features/reminders.md), [features/lists.md](../features/lists.md), [ios.md](../ios.md).

## 1. Summary

Reminderly introduces a freemium model called 5 for Free. Every feature is available without payment, subject to four independent quantity limits. The free tier does not expire. An annual subscription, Reminderly Premium, removes the limits.

Core principle: restrict new creation, never access to existing content.

## 2. Decisions

| Decision | Outcome |
|----------|---------|
| Free proposition | 5 for Free, no time limit |
| Active reminders | 5 |
| Active lists | 5 |
| Items per list | 5 |
| Templates | 5, all templates count |
| Seeded templates for new users | None. Dev tools templates remain available |
| Subscription | Reminderly Premium, annual auto-renewing |
| Price | £9 per year, displayed from StoreKit |
| Monthly option, trial, introductory discount | None |
| Family Sharing | Disabled for V1 |
| Purchase technology | Native StoreKit 2, small local plugin, no third-party service |
| Entitlement authority | Apple |
| Siri at limit | Opens the app as today; the app shows the limit message (no spoken response) |
| Build configuration | Live = Off, Reminderly Dev = Dev, App Store Release = Enforced |
| Existing users | None besides John; no grandfathering |
| Upgrade presentation | Standard slide-up panel, per the approved visuals |
| Apple account setup | Deferred until required |

## 3. Free tier limits

| Limit | Counts | Does not count |
|-------|--------|----------------|
| Reminders (5) | Active reminders: not completed and not deleted, including overdue, repeating and smart reminders. A completed repeating reminder whose next occurrence is pending (the 1 second reschedule window) also counts | Completed and deleted reminders |
| Lists (5) | Active lists (`status: 'active'`) | Done and deleted lists |
| Items per list (5) | All items in that list, ticked or not | Deleted items |
| Templates (5) | Active templates, whether seeded or user-created | Deleted templates |

Rules:

- Each limit is independent. Reaching one limit never restricts another area that still has capacity, and five items in one list never restricts another list.
- A limit is reached when the count is at or above the limit. Creation is blocked while at or above it.
- Capacity is released only by these actions, immediately:
  - Reminders: completing a reminder, or deleting an active reminder. Completing a repeating reminder releases nothing, because its next occurrence replaces it.
  - Lists: marking a list done, or deleting an active list.
  - Items: deleting an item. Ticking an item does not release capacity; ticked items count until deleted.
  - Templates: deleting a template.
- Marking a list done does not release item capacity in that list; its items still count if the list is reactivated.
- Production limits are fixed at 5 and change only through an app release. Dev tools can override each limit in Reminderly Dev only.
- An active subscription removes all four limits.

## 4. Behaviour by area

### 4.1 Reminders

- At the limit, the bottom creation button changes to "Unlock to add more!" and opens the upgrade panel.
- Existing reminders remain visible, editable and functional. Editing text, date, time or repeat does not change the count and is always allowed.

### 4.2 Recurring reminders

- Generating the next occurrence of an existing repeating reminder is never blocked, whatever the count or entitlement. This is a protected area.
- Completing an occurrence and generating its replacement does not change the count.
- The pending replacement counts as active during the 1 second reschedule window, so a new reminder cannot be created in that gap. This is an in-memory check only; recurrence code, stored data and notifications are unchanged.

### 4.3 Undo, reactivation and restore

| Action | Rule |
|--------|------|
| Un-complete a repeating reminder where the existing logic removes its generated next occurrence | Allowed (count unchanged) |
| Un-complete a reminder that would increase the active count | Allowed below the limit; blocked at the limit |
| Restore a deleted reminder to active | Allowed below the limit; blocked at the limit |
| Restore a deleted reminder that was completed | Allowed (count unchanged) |
| Reactivate a done list | Blocked if it would exceed the list limit, or if its smart reminder would exceed the reminder limit |
| Restore a deleted list, item or template | Blocked if it would exceed the relevant limit |
| Un-tick a list item | Allowed (ticked items already count) |

When blocked, the user sees a clear explanation and an Upgrade option. The content stays where it is (Done or Deleted) and can be restored once capacity exists or after subscribing. Nothing is lost.

### 4.4 Smart reminders

- Smart reminders count towards the reminder limit.
- They are created and maintained by a background sync from list state. The sync is not changed and is never blocked.
- Capacity is checked at the user actions that would create one:
  - turning smart reminders on for a list
  - setting a due date that would create a smart reminder
  - reactivating a done list whose smart reminder would become active
- Changing the due date of a list that already has a smart reminder updates that reminder and is always allowed.
- After expiry, existing smart reminders continue to work, including above the limit. A user above the limit who turns smart reminders off for a list cannot turn them back on until below the limit.
- "Unlimited smart reminders" in the upgrade panel is a marketing benefit, not a separate allowance.

### 4.5 Lists and list items

- At the list limit, the New list button changes to "Unlock to add more!".
- At five items, adding further items to that list is blocked with an Upgrade option. The presentation is an outstanding design item (section 12).
- Bulk additions (for example multi-line entry) that would exceed the item limit are rejected in full, not partially applied.
- Duplicating a list, where available, counts as creating a list and its items.

### 4.6 Templates

- All active templates count, including any seeded through Dev tools. Users can delete templates to free capacity.
- New users receive no seeded templates (`reminderly-config-templates-in-clean-state` remains off).
- At the template limit, creating a template is blocked with an Upgrade option.
- Saving a list with more than five items as a template is allowed while template capacity remains.
- Creating a list from a template counts towards the list limit. Creating a list from a template with more than five items is blocked for free users, with Upgrade offered.

### 4.7 Siri

- The Siri intent is unchanged: it opens Reminderly with the reminder text.
- At the limit, the app does not create the reminder and shows the limit-reached message with an Upgrade option.
- The check is made in the app's creation path, so it applies however the app is opened.

## 5. Subscription and entitlement

- One auto-renewable subscription, Reminderly Premium, 1 year, in a single subscription group. Family Sharing off.
- StoreKit 2 through a small local Capacitor plugin in `ios/App/App`, following the `WidgetBridgePlugin.swift` pattern. No third-party SDK, no server.
- Entitlement is read from StoreKit current entitlements at launch and on resume, and updated from the transaction updates listener while running.
- Apple is the source of truth. The app caches the last verified entitlement and its expiry date locally, for offline use only.
- Offline: the last verified paid entitlement is honoured. When StoreKit is available again its answer replaces the cache.
- Billing grace period: if enabled in App Store Connect, the app treats the grace period as paid.
- Restore Purchases uses `AppStore.sync()`.
- Expiry or cancellation returns the user to the free tier. All content is kept, visible, editable and functional; nothing is greyed out. Notifications and repeats continue. New creation is blocked wherever usage is at or above a limit.
- Resubscribing removes the limits immediately.
- Prices are always shown from the StoreKit product's localised display price. No hard-coded price text.

## 6. Upgrade experience

The supplied visuals (limit-reached Reminders screen and upgrade panel, 2026-10-14) are the design reference. The panel must not be redesigned, and no additional screens may be added without discussion.

### 6.1 Limit-reached button

- At a limit, the normal bottom creation button keeps its position and changes its label to "Unlock to add more!".
- Selecting it opens the upgrade panel.
- The same applies to reminders, lists and templates. List items use their own presentation (section 12).

### 6.2 Upgrade panel

Standard Reminderly slide-up panel, not a full-screen page. Content:

- Heading: "Unlock unlimited Reminderly"
- Supporting text: "Use every feature without limits"
- Benefits: Unlimited reminders, Unlimited lists, Unlimited list items, Unlimited smart reminders, Unlimited templates (icons and descriptions as in the visual)
- Primary button: "Unlock for only {price} a year!", where {price} is the StoreKit localised price (£9 in the UK)

Price text rules:

- {price} is the product's localised display price only (for example "£9.00", "9,00 €" or "$9.99"), as formatted by StoreKit. It never includes a period.
- The billing period ("a year") comes from Reminderly's own copy, never from StoreKit, so it cannot appear twice.
- The app does not round, reformat or append currency to the StoreKit value. The UK button therefore reads "Unlock for only £9.00 a year!" unless StoreKit formats the price as "£9". The visual's "£9" is illustrative.
- Each phrase containing {price} is one complete, translatable string with a placeholder, not words joined around the price. V1 copy is English only.
- The button must fit prices of different lengths without truncation. Longer prices wrap to two lines rather than shrinking.
- The auto-renewal line uses the same {price} value and states the period once, for example "Renews automatically at {price} a year until cancelled."
- If the price cannot be loaded, no price text is shown (see States below).

The primary button starts Apple's native purchase confirmation directly, with no intermediate screen.

Required additions, integrated without cluttering the design (Apple guideline 3.1.2 and subscription guidance):

- Subscription name, and the auto-renewal line near the button
- Restore Purchases
- Terms of Use and Privacy Policy links (content and hosting are release-readiness item D4)
- Standard panel dismissal

States:

- Product loading or unavailable (offline, StoreKit error): the primary button shows a non-purchasable fallback state.
- Purchase in progress, success, cancelled and failed.
- On success the panel closes and the blocked action becomes available.

## 7. Paywall mode and build configuration

Web assets are built once and shared by every iOS build, so the paywall mode is set natively per Xcode build configuration and read by the app at launch. It is not stored in local storage and cannot be changed in the app.

| Installation | Configuration | Bundle ID | Paywall mode | Dev tools effect |
|--------------|---------------|-----------|--------------|------------------|
| Live (John's everyday installation) | Debug | `com.reminderly.app` | Off | None. No limits; Dev tools and local storage cannot enable the paywall |
| Reminderly Dev | Debug-Dev (new) | `com.reminderly.app.dev` | Dev | Paywall on or off, each limit, simulated Free, Paid and Expired states |
| App Store | Release | `com.reminderly.app` | Enforced | None. Limits fixed at 5; Dev tools overrides ignored |

Rules:

- Every configuration sets the mode explicitly.
- Off behaves exactly as Reminderly does today: no limits, no upgrade UI and no StoreKit calls.
- In Dev mode, `reminderly-ff-paywall` is the on/off control. Its default stays off. The limit overrides and simulated states are new Dev tools controls, available in Dev mode only.
- In Enforced mode, Dev tools and stored flags cannot disable or bypass the paywall. This is consistent with the existing decision to exclude Dev tools from release builds ([release-readiness.md](../release-readiness.md)).
- The Release configuration is used only for archiving and uploading to App Store Connect. Release builds are never installed on John's iPhone. This rule is added to CLAUDE.md deployment rules during implementation.
- Self Check reports the current paywall mode so it can be checked on each installation.

## 8. Reminderly Dev installation

A prerequisite for paywall testing. It must be built and its isolation verified before any paywall testing starts.

Requirements:

- Bundle ID `com.reminderly.app.dev`; widget `com.reminderly.app.dev.widget`.
- Display name "Reminderly Dev" and a distinguishable icon.
- Own App Group, `group.com.reminderly.app.dev`. The App Group name is currently hard-coded in `WidgetBridgePlugin.swift` and `ReminderlyWidget.swift`; it becomes a build setting so each configuration uses its own group.
- Independent local storage and notifications (separated by bundle ID).
- Shares the codebase and web assets with Live.
- Starts from a clean state; Dev tools clean state and test data remain available.
- Reusable for future feature testing.
- Siri shortcuts for both apps registered under their own app names; checked on device.

Signing: the new bundle IDs and App Group need registering once. John does this in Xcode, or gives Claude explicit permission to use `-allowProvisioningUpdates`. No paid Apple setup is needed for this step.

Isolation verification, before paywall testing:

1. Live data (reminders, lists, templates), notifications and widget are unchanged after installing Reminderly Dev.
2. Reminderly Dev starts empty.
3. Data created in Reminderly Dev does not appear in Live, or in Live's widget.
4. Notifications from each app are attributed to that app.
5. Self Check reports Off in Live and Dev in Reminderly Dev.

## 9. Enforcement points

Limits are enforced through one shared limits module called by every creation path, not only by visible buttons. The implementation plan confirms each path against the code.

| Path | Limit checked |
|------|---------------|
| New reminder (panel, natural language) | Reminders |
| Siri add | Reminders |
| Un-complete or restore a reminder | Reminders (section 4.3) |
| Enable smart reminders, set due date, reactivate done list | Reminders, and Lists for reactivation |
| Next occurrence of a repeating reminder | Never blocked |
| Smart reminder background sync | Never blocked |
| New list, duplicate list, list from template | Lists, and Items for template or duplicate content |
| Restore a deleted list | Lists |
| Add item, multi-line add, restore item | Items |
| Create template, restore template | Templates |
| Notification actions, onboarding and tutorial flows | Confirmed in the implementation plan |
| Dev tools test data and clean-state utilities | Exempt (Dev mode only) |

## 10. Existing data and compatibility

- No data migration. Limits are calculated from existing data.
- No existing content is changed, hidden or deleted by the paywall or by entitlement changes.
- Protected areas (notification scheduling and actions, badge counts, date and time handling, repeating reminders, completion and deletion flows, app lifecycle, local storage) keep their current behaviour. Limit checks are read-only checks made before creation; they do not change these flows.
- With the paywall Off, behaviour is identical to today.

## 11. Testing and verification

Automated:

- Vitest unit tests for the limits module: counting rules, each limit independently, at and over limit, repeating reminder transitions, undo and restore, bulk add rejection, template rules, subscription states.
- Self Check checks in `src/app/dev/` for limit behaviour against real app paths and for the paywall mode.

StoreKit local testing (Xcode StoreKit configuration file, runs started from Xcode):

- Purchase success, cancellation, failure, interrupted purchase.
- Renewal, expiry (accelerated time), billing grace period, refund.
- Restore Purchases.

Sandbox, once Apple setup is complete (section 13):

- Purchase, restore after reinstall, expiry to free with content above the limits, resubscribe.
- Offline launch with a cached paid entitlement.

Device testing (Reminderly Dev):

- Each limit and upgrade entry point, including Siri at the limit.
- Free, Paid and Expired states through Dev tools.
- Former subscriber above every limit: all content usable, notifications and repeats firing, creation blocked.

Regression:

- Notifications, badge, widget, repeating reminders, completion, deletion and Siri on both installations.
- Live shows no paywall behaviour.
- Full regression before merge (Type C).

## 12. Outstanding design items

Required before the related parts are built. These are not blockers for this specification.

- Item limit reached inside a list.
- Template limit reached.
- Blocked undo, reactivation and restore messages.
- Purchase in progress, success, failure and cancelled states.
- Footer placement of auto-renewal text, Restore Purchases, Terms and Privacy.
- Subscriber status, Restore and Manage subscription for existing subscribers (likely in Settings).
- Dev tools controls for paywall mode, limits and simulated states.

## 13. Apple setup (deferred)

Not started. John arranges these when implementation reaches them. Claude does not create App Store Connect records or products.

| Item | Needed for |
|------|-----------|
| Register Reminderly Dev bundle IDs and App Group | Start of implementation |
| Confirm £9.00 is available as a UK price point | Before App Store Connect product setup |
| Paid Applications agreement, banking and tax | Sandbox testing |
| Reminderly Dev App Store Connect record (never submitted) with a matching annual subscription | Sandbox testing on Reminderly Dev |
| Sandbox tester account | Sandbox testing |
| Production subscription product, group and localisations | App Store submission |
| Terms of Use and Privacy Policy URLs (D4) | App Store submission |

Development can proceed with Xcode StoreKit local testing until sandbox testing is needed.

## 14. Out of scope for V1

- Monthly plans, trials and introductory offers.
- Family Sharing.
- Promotional or offer codes.
- Server-side receipt validation or a subscription service.
- Usage indicators (for example "3 of 5") and Small Business Program enrolment are optional and not part of V1 unless approved.

## 15. Notes for later

- When John's Live installation is eventually replaced by the App Store build (same bundle ID, data kept), the paywall will apply to his data. A subscription or another approach is agreed at that point.
- Branch: `feature/5-for-free-paywall`, created only after the baseline on main is approved. Existing uncommitted work on main is preserved.
