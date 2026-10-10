# Reminderly dev tools audit and Noterly implementation specification

---

## Part 1: Reminderly dev tools architecture

### How dev tools is opened

Dev tools is opened by triple-tapping the app logo in the main screen. The logo has a click counter (`clickCountRef`) that increments on each tap. A 400ms timer resets the counter after each tap. On the third tap within that window, `setIsDevToolsOpen(true)` is called and the counter resets. There is no visible affordance or hint that the logo is tappable. The trigger is deliberately hidden.

Source: App.tsx, `handleLogoClick` function.

### Navigation flow

There are two gates before reaching the home screen:

1. The overlay opens showing the login screen if `isDevToolsUnlocked` is false.
2. Once the user logs in, `isDevToolsUnlocked` is set to true for the remainder of the session.
3. The home screen renders.
4. From the home screen, the user navigates to sub-pages using a `page` state string.
5. Sub-pages navigate back to home or to further nested pages.
6. All navigation is flat state switching (no stack, no history). Back always returns to home except for nested pages (e.g. dummy-reminders goes back to reminders, haptics goes back to system).

`isDevToolsUnlocked` is session-only state. It is not persisted. Closing and reopening dev tools within the same session keeps the user logged in. A page refresh resets it.

### Page hierarchy

```
home
  reminders
    dummy-reminders (back to reminders)
  lists
    dummy-lists (back to lists)
  natural-language
  notifications-area
  onboarding
  testing
  system
    filters-menu (back to system)
    dev-tools-password (back to system)
    haptics (back to system)
```

### Overlay hierarchy

Dev tools uses the same bottom-sheet wrapper pattern as all other overlays in the app:

Backdrop motion.div: `fixed inset-0 z-40`, click-outside closes the overlay (no opacity backdrop, transparent).

Outer sheet motion.div:
- `fixed left-0 right-0 z-50 mx-auto w-full` with `style={{ bottom: 0 }}`
- `animate={{ y: 0, top: devToolsTopRef.current ?? getBottomSheetTopPosition() }}`
- Top is captured once at open time via `devToolsTopRef` and held constant for the session (same `getBottomSheetTopPosition()` as all other sheets)

DevToolsOverlay root div: `bg-white content-stretch flex flex-col items-center relative rounded-tl-[20px] rounded-tr-[20px] size-full`

Note: dev tools uses `rounded-tl-[20px] rounded-tr-[20px]` (20px radius). All other overlays use 15px. This is the only visual difference in the outer shell.

Note: dev tools has no drag handle and no drag-to-dismiss. It can only be closed via the close button or tapping the transparent backdrop.

### Component structure

`src/app/App.tsx` - manages `isDevToolsOpen`, `isDevToolsUnlocked`, `isDevToolsPasswordRequired` state. Passes all callbacks to `DevToolsOverlay`.

`src/app/components/DevToolsOverlay.tsx` - contains all page components and the main export. Also exports `DevToolsInfoOverlay` and `InfoIconWithOverlay` for reuse.

`src/imports/DevTools.tsx` - the home page component (`DevToolsHome`).

`src/imports/DummyReminders.tsx` - the dummy reminders page (imported).

`src/imports/DummyLists.tsx` - the dummy lists page (imported).

### Animation behaviour

Opening: `initial={{ y: "100%" }}` → `animate={{ y: 0, top: getBottomSheetTopPosition() }}`, duration 0.25s, ease "easeInOut". Slides up from bottom.

Closing: `exit={{ y: "100%" }}`, same duration. Slides down off-screen.

`AnimatePresence` wraps the dev tools block. No drag animation. No spring.

### Spacing behaviour

All pages use the `PageShell` wrapper which applies: `flex flex-col gap-[30px] items-start pt-[30px] px-[20px] pb-[60px] relative w-full flex-1 min-h-0` with `overflowY: 'auto'`.

The home page uses a slightly different wrapper: `bg-white content-stretch flex flex-col gap-[30px] items-start pb-[30px] pt-[30px] px-[20px]`.

All pages scroll internally via `overflowY: 'auto'` on the page content.

The login screen uses: `flex flex-col items-start pt-[30px] px-[30px] pb-[30px] relative w-full flex-1 min-h-0`.

Content column max-width: `max-w-[768px]` on `DevToolsContent`.

### Responsive behaviour

Same as all other overlays. Max width 768px, centered with `mx-auto`. Below 768px fills full width.

---

## Part 2: Reminderly dev tools visual design

### Outer shell

Background: white (`bg-white`)
Border-radius: 20px top-left and top-right (`rounded-tl-[20px] rounded-tr-[20px]`)
Size: full height and width of the sheet frame (`size-full`)

### Home page header

Container: `content-stretch flex items-center justify-between relative shrink-0 w-full`

Title text: `font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#1C2C42] text-[20px] whitespace-nowrap`, rendered as `<p className="leading-[normal]">Dev tools</p>`

Close button: `flex items-center justify-center relative shrink-0 size-[25.456px] cursor-pointer`
Close icon: SVG 18x18, a plus rotated 45 degrees, fill `#1C2C42`

### Sub-page header (BackHeader)

Container: `content-stretch flex items-center justify-between relative shrink-0 w-full mb-[15px]`
Left group: `content-stretch flex gap-[20px] items-center relative shrink-0`
Back chevron: SVG 9x17, fill `#1C2C42`
Page title: `font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#1C2C42] text-[20px] whitespace-nowrap`
Close button: identical to home header close button

### Home nav rows

Two row variants on the home page:

NavRowWithToggle (feature rows):
- Height: 60px
- Background: none (separated by divider lines, not cards)
- Left element: toggle button (SVG-based)
- Label: `font-['Lato:Bold',sans-serif] text-[17px]`, color `#1C2C42` when on, `#D9D9D9` when off
- Right element: chevron arrow SVG 7x13, color `#939393` when on, `#D9D9D9` when off
- Padding right: 15px, padding vertical: 15px
- Tapping row navigates to detail page
- Tapping toggle opens confirmation overlay

NavRow (plain rows: Testing, System):
- Height: 60px
- Background: none (plain variant)
- Label: `font-['Lato:Bold',sans-serif] text-[17px] text-[#1C2C42]`
- Right: chevron arrow SVG
- Padding right: 15px

All home rows are separated by dividers using Tailwind's `divide-y divide-[#E4E4E4]` on their container.

Toggle button (NavRowWithToggle):
- Outer: SVG 56x30, rect rx 15
- Background: `#4784F8` on, `#C9C9C9` off
- Circle: cx 41 (on) or 15 (off), cy 15, r 11.25, fill white
- cx transition: `cx 0.2s ease`

### Section rows (inner pages)

ToggleRow:
- Container: `flex h-[30px] items-center justify-between w-full`
- Label: `font-['Lato:Bold',sans-serif] leading-[23px] not-italic text-[17px] whitespace-nowrap`, color `#1C2C42` active-on, `#C9C9C9` active-off, `#D9D9D9` disabled
- Info icon: SVG 16.5x16.5, color `#939393` by default, `#D9D9D9` when disabled or off
- Toggle button: `h-[30px] w-[56px] rounded-[37.5px]`, `#4784f8` on, `#C9C9C9` off, `#D9D9D9` disabled; circle SVG 22.5x22.5

MenuRow:
- Container: `button flex h-[30px] items-center justify-between w-full pr-[15px]`
- Label: `font-['Lato:Bold',sans-serif] leading-[normal] text-[17px] whitespace-nowrap`, color `#1C2C42` active, `#D9D9D9` disabled
- Info icon: same as ToggleRow
- Right chevron: SVG 7x13, fill `#939393` active, `#D9D9D9` disabled

SectionSubtitle:
- Container: `flex h-[10px] items-center w-full`
- Text: `font-['Lato:SemiBold',sans-serif] text-[14px] text-[#939393] leading-[normal]`

KeyLine (divider):
- `w-full h-px bg-[#E4E4E4] shrink-0`

### Section layout pattern

Within a PageShell the typical layout is:

SectionSubtitle → ToggleRow(s) or MenuRow(s) → KeyLine → SectionSubtitle → ToggleRow(s) or MenuRow(s)

All items are separated by the parent `gap-[30px]` of the PageShell.

### Confirmation overlay (modal)

Triggered by master toggle rows. Rendered as a portal over the current page via fixed positioning.

Backdrop: `fixed inset-0 bg-black/50 z-[60]`, click-to-dismiss
Modal container: `fixed inset-0 z-[60] flex items-center justify-center pointer-events-none`
Modal card: `bg-white relative flex flex-col gap-[35px] items-center py-[40px] px-[34px] rounded-[32px] pointer-events-auto`, width 322px

Modal title: `font-['Lato:Bold',sans-serif] text-[#1C2C42] text-[20px] text-center`, `leading-[normal] whitespace-pre-wrap`
Modal body: `font-['Lato:SemiBold',sans-serif] text-[#939393] text-[17px] text-center`, `leading-[normal] whitespace-pre-wrap`

Buttons row: `flex gap-[16px] w-full justify-between`
Cancel button: `h-[50px] rounded-[100px] px-[16px]`, background `#BABABA`
Confirm button: `h-[50px] rounded-[100px] px-[16px]`, background `#4784F8`
Button text: `font-['Lato:Bold',sans-serif] text-[17px] text-white whitespace-nowrap`

### DevToolsInfoOverlay (info panel)

Used by info icons throughout dev tools. Rendered via `createPortal` to `document.body`.

Backdrop: `fixed inset-0 bg-black/50 z-[60]`, click-to-dismiss
Centering wrapper: `fixed inset-0 z-[60] flex items-center justify-center pointer-events-none`
Card: `bg-white relative flex flex-col gap-[40px] items-center pt-[35px] pb-[35px] px-[32px] rounded-[32px] pointer-events-auto outline-none`, width 340px
Header text: `font-['Lato:Bold',sans-serif] text-[20px] text-[#1C2C42] leading-[normal] text-center whitespace-pre-wrap`, fontWeight 700
Body text: `font-['Lato:Bold',sans-serif] text-[17px] text-[#BABABA] text-center whitespace-pre-wrap`, fontWeight 700, lineHeight 24px
Close button: `bg-[#4784f8] h-[50px] w-full rounded-[100px]`, label "Close", `font-['Lato:Bold',sans-serif] text-[17px] text-white`

### Login screen

Container: `flex flex-col items-start pt-[30px] px-[30px] pb-[30px] relative w-full flex-1 min-h-0`

Logo: SVG 50x50, fill `#4784F8`
App name: `font-['Lato:Bold',sans-serif] text-[#1C2C42] text-[22px] text-center whitespace-nowrap`, text "Log-in to Reminderly"
Logo + name gap: 29px, outer gap from inputs: 60px

Password input container: `h-[60px] relative rounded-[100px] shrink-0 w-full group`
Border: `absolute border border-[#BABABA] group-focus-within:border-[#939393] border-solid inset-0 pointer-events-none rounded-[100px]`
Input: `flex-1 bg-transparent outline-none font-['Lato:Bold',sans-serif] not-italic text-[20px] text-[#1C2C42] placeholder:text-[#C9C9C9] text-center leading-[26px]`, padding horizontal 30px
Eye toggle button: 21.5x15.5px SVG, positioned `absolute right-[30px]`, fill `#1C2C42` when revealed, `#C9C9C9` when hidden

Log-in button: `h-[60px] rounded-[100px] w-full`, background `#4784f8` when active, `#939393` when disabled (password required and empty)
Button label: `font-['Lato:Bold',sans-serif] text-[20px] text-white`, "Log-in"

Error message: `font-['Lato:SemiBold',sans-serif] text-[17px] text-[red] text-center whitespace-nowrap`

Password input and button are inside a column with gap 30px.

Focus handling on the password input: `onPointerDown` checks if already focused and calls `focus({ preventScroll: true })`.

### Testing page

Buttons: `bg-[#4784f8] text-white font-['Lato',sans-serif] font-bold text-[14px] px-[20px] py-[10px] rounded-[8px] disabled:opacity-50`
Reset button: `bg-[#6b7280]` (grey), same shape
Results: pass items have `bg-[#e8f5e9]`, fail items have `bg-[#ffebee]`, 8px padding, 4px radius
Section headers: `font-['Lato',sans-serif] text-[14px] text-[#1C2C42] font-bold`
Error text: `font-['Lato',sans-serif] text-[12px] text-[#c62828]`

---

## Part 3: Reminderly dev tools feature inventory

### Login screen

Purpose: guards dev tools behind a password or allows passwordless access.
Password: hardcoded constant `DEV_TOOLS_PASSWORD = '123'`.
Password required toggle: persisted in localStorage as `'reminderly-dev-tools-password-required'`.
When password not required: "Log-in" button unlocks immediately regardless of input.
When password required: input must match `'123'` or the error "That password doesn't look right?" appears.
Easter egg: typing "GILBURN" shows the current password briefly then fades it.
Eye icon toggles password visibility between type="password" and type="text".

### Home page

Seven navigation items with quick-toggle on feature rows.

Feature rows (NavRowWithToggle): Reminders, Lists, Natural Language Capture, Notifications, Onboarding. Each shows a toggle that can be operated directly from home (with confirmation overlay) or tapped to navigate to the feature's detail page.

Plain rows (NavRow): Testing, System. No toggle.

### Reminders page

Master toggle: "Enable reminders" (session state only, not persisted)
Features section: "Repeat reminders" toggle (session state, enabled/disabled based on master)
Settings section: "Display 1 minute time increments" (persisted via App.tsx state)
Menu row: "Dummy reminders" (navigates to dummy-reminders page, disabled when master off)

Dummy reminders page: generates test reminders across categories (overdue, today, this week, later, sometime, done). Has "Clear all reminders" destructive action. Also has "Hide overdue" toggle. Destructive: sets reminders to empty array.

### Lists page

Master toggle: "Enable lists" (persisted via App.tsx state, triggers confirmation overlay)
Features section: "Smart reminders", "List templates", "Pinned lists" (all persisted, disabled when master off)
Settings section: "Use template set in clean state" (persisted, disabled when master or list templates off)
Menu row: "Dummy lists" (navigates to dummy-lists page, disabled when master off)

Dummy lists page: generates test lists with configurable item counts, done items, smart reminder lists, and saved templates. Destructive: clears all lists.

### Natural language page

Master toggle: "Enable Natural Language Capture" (persisted, confirmation overlay)
Features section: "Date recognition", "Time recognition", "Repeats recognition" (all persisted, disabled when master off)
Planned/disabled: "Phone number recognition", "Contact recognition" (locked off, infoTitle explains future intent)
Settings section: "Auto-parsing", "Click-parsing" (mutually exclusive modes, persisted)

### Notifications page

Master toggle: "Enable notifications" (session state, confirmation overlay)
Features section: "Reminder system notifications", "Reminder app badge notifications" (disabled when master off)
Settings section: "Include today in app badge count" (disabled when master off or badge off)

### Onboarding page

Master toggle: "Enable onboarding" (persisted, confirmation overlay)
Settings section: "Show tutorial on first launch", "Show tutorial on every app start" (mutually exclusive, disabled when master off)

### System page

Features section: "Siri shortcuts" toggle (persisted), "Settings menu" toggle (persisted), "Show info icons" toggle (persisted, default off)
Settings section: three menu rows
- "Filters menu" → FiltersMenuPage
- "Dev tools password" → DevToolsPasswordPage
- "Haptics" → HapticsPage

### Filters menu page

Settings section: "Standard filters", "Grouped filters" (mutually exclusive toggles). Entire section disabled when Lists is enabled (Lists forces standard layout).

### Dev tools password page

Settings section: "Password required" toggle (persisted in localStorage), shows current password when enabled.
Password reset section: two inputs (new password, confirm password) with eye toggles and a "Reset" button. Note: reset button is visually rendered but does not appear to be wired to any state change in the visible code.

### Haptics page

Master section: "All haptics" global toggle (persisted via haptics config)
Actions section: eleven individual action toggles (all disabled when master off): mark done, create reminder, mark list complete, delete reminder, delete list item, clear all done/deleted, uncomplete reminder, undelete reminder, undo list completion, toggle list item checkbox, swipe to reveal delete.

### Testing page

Buttons: "Run self-checks", "Copy results", "Reset"
Check suites run:
- Schedule and reminder logic (getScheduleChecks)
- Persistence and hydration (getReminderChecks)
- Natural language parsing (getNlcParserChecks)
- Natural language interaction (getNlcInteractionChecks)
- Done, deleted, and completion (getDoneDeletedChecks, getCompletionChecks)
- Lists and smart reminders (getListChecks)
- Dev tools and feature flags (getDevToolsChecks)
- Notification and badge (getNotificationChecks)

Results display: grouped by section label, pass/fail colouring, error messages for failures.
Copy: uses a hidden textarea with `execCommand('copy')`. Shows "Copied!" for 2 seconds.

---

## Part 4: Noterly dev tools implementation plan

### Opening mechanism

Triple-tap on the Noterly logo or a designated tappable area. Same click counter + 400ms reset timer pattern as Reminderly. No visible hint.

### Overlay wrapper

Identical to Reminderly:
- AnimatePresence wrapping the dev tools block
- Transparent backdrop div at z-40, click-to-close
- Outer motion.div: `fixed left-0 right-0 z-50 mx-auto w-full`, `style={{ bottom: 0 }}`, `animate={{ y: 0, top: getTopPosition() }}`
- Initial: `{ y: "100%" }`, exit: `{ y: "100%" }`, transition duration 0.25s ease "easeInOut"
- Top position captured once at open time and held constant
- No drag handle. No drag-to-dismiss.

DevToolsOverlay root: `bg-white content-stretch flex flex-col items-center relative rounded-tl-[20px] rounded-tr-[20px] size-full`
Content max-width: `max-w-[768px]`

### Login screen

Visual design identical to Reminderly login screen. Same layout, same typography, same colours.

Key difference: password is not required by default and is optional. The "Log-in" button logs in immediately without any credential check.

Implementation:
- `passwordRequired` is false by default and in Noterly v1 should remain false
- Pressing "Log-in" calls `onUnlock()` regardless of input
- No error states triggered
- Eye icon toggle still present (for parity) but irrelevant when password not required
- No password input required - input can be present but is optional

Future expansion: when real authentication is added, the `passwordRequired` flag and credential check logic can be wired in without changing the screen layout or navigation.

Session behaviour: `isDevToolsUnlocked` is session-only state. Reset on page refresh. Once unlocked within a session, stays unlocked.

Login screen layout (copy exactly from Reminderly):
- Top padding: 80px from screen top within the login container
- Logo: SVG 50x50, Noterly brand colour (equivalent to Reminderly's `#4784F8`)
- App name below logo, gap 29px: `font-['Lato:Bold',sans-serif] text-[22px] text-[#1C2C42] text-center whitespace-nowrap`, text "Log-in to Noterly"
- Gap between logo group and inputs group: 60px
- Password input: `h-[60px] rounded-[100px] w-full`, border `#BABABA` idle, `#939393` focus-within, input `text-[20px] text-center`
- Log-in button: `h-[60px] rounded-[100px] w-full bg-[#4784f8]` (or Noterly brand colour), label `font-['Lato:Bold',sans-serif] text-[20px] text-white`
- Input and button gap: 30px column

### Home page

Header: "Dev tools" (same as Reminderly)
Close button: same SVG plus rotated 45 degrees

Initial home rows (Noterly v1):

NavRowWithToggle: "Test data" - navigates to test data page (no quick toggle needed in v1, use NavRow instead)
NavRowWithToggle: "Passwords" - navigates to passwords page
NavRow: "Testing" - navigates to testing page (deferred, can be stubbed)

Rows separated by `divide-y divide-[#E4E4E4]`.

Future rows to be added as features are implemented: Notes, Folders, Notifications, Onboarding, System.

### Test data page

Page title: "Test data"
Uses PageShell wrapper: `flex flex-col gap-[30px] items-start pt-[30px] px-[20px] pb-[60px]`, `overflowY: 'auto'`

Section: "Data"
Row: MenuRow "Reset test data"
- Tapping opens a confirmation overlay before executing
- Confirmation overlay matches Reminderly pattern: 322px wide card, `rounded-[32px]`, `py-[40px] px-[34px]`
- Title: "Reset test data?" in `text-[20px] text-[#1C2C42] font-bold`
- Body: "This will clear all notes and folders and restore the default test set. This cannot be undone." in `text-[17px] text-[#939393]`
- Buttons: Cancel (`#BABABA`) and Confirm (`#4784F8`), `h-[50px] rounded-[100px]`
- Confirm calls existing test data reset implementation
- No other controls on this page in v1

### Passwords page

Page title: "Passwords"

Visible in UI. Styled identically to Reminderly pages. All rows present but non-functional.

Section: "Account"
MenuRow: "Sign in" - tapping opens DevToolsInfoOverlay with header "Sign in" and title "Password functionality will be implemented in a future update."
MenuRow: "Create account" - tapping opens DevToolsInfoOverlay with header "Create account" and title "Password functionality will be implemented in a future update."

Section: "Saved passwords"
MenuRow: "View saved passwords" - tapping opens DevToolsInfoOverlay with header "Saved passwords" and title "Password functionality will be implemented in a future update."

All rows use standard MenuRow component with info icon. The info icon should NOT be used for the placeholder info overlay - tapping the row itself opens the info panel. The info icon should still be present but can show the same message.

No toggles. No functional implementation. No storage. No network calls.

### Testing page (deferred stub)

Page title: "Testing"

In v1, the testing page can be a stub with a single message row:
SectionSubtitle: "Self-checks"
A note paragraph: `font-['Lato:SemiBold',sans-serif] text-[14px] text-[#939393]` "Self-checks will be added as features are implemented."

When self-checks are added, implement using the same check-system pattern as Reminderly with "Run self-checks", "Copy results", "Reset" buttons and grouped results display.

### Shared UI components required

All of the following should be copied directly from Reminderly and adapted with Noterly colours:

BackHeader - back chevron + page title + close button, `mb-[15px]`
PageShell - wrapper providing `pt-[30px] px-[20px] pb-[60px] gap-[30px] overflowY auto`
ToggleRow - `h-[30px]` row with label, info icon, and toggle button
MenuRow - `h-[30px]` row with label, info icon, and right chevron
SectionSubtitle - `h-[10px]` label in `text-[14px] text-[#939393] font-semibold`
KeyLine - `h-px bg-[#E4E4E4]`
InfoIcon - SVG 16.5x16.5 info circle
DevToolsInfoOverlay - portal modal with header, body, close button
InfoIconWithOverlay - wrapper combining InfoIcon with DevToolsInfoOverlay. Always shown in Dev tools. In the user-facing Reminders and Lists settings panels, shown or hidden by the Dev tools > System "Show info icons" toggle (default off, stored as `reminderly-ff-info-icons`), provided around those panels via `ShowInfoIconsContext`. All info copy is kept

The `NavRow` and `NavRowWithToggle` components on the home page should be implemented locally in the DevTools home component as they are specific to the home layout.

---

## Part 5: Noterly login screen specification

### Purpose

Future-proofing only. Establishes the navigation pattern for account-gated access. Not real authentication.

### Screen layout

The login screen is the first thing shown inside the dev tools overlay when `isDevToolsUnlocked` is false.

Container padding: `pt-[30px] px-[30px] pb-[30px]`
Inner layout: `flex flex-col items-center size-full`
Top section: `flex flex-col gap-[60px] items-center pt-[80px] relative size-full`

Logo group (gap 29px):
- Noterly logo SVG 50x50 in brand colour
- App name: `font-['Lato:Bold',sans-serif] text-[22px] text-[#1C2C42] text-center whitespace-nowrap`, text "Log-in to Noterly"

Input and button group (gap 30px):
- Password input field: `h-[60px] rounded-[100px] w-full`, border ring pattern
- Log-in button: `h-[60px] rounded-[100px] w-full`

### Navigation flow

User opens dev tools → login screen appears → user presses "Log-in" → `onUnlock()` called → home screen renders.

No username. No password check. No validation. No error state. No network calls. No storage.

The button is never disabled (unlike Reminderly where it disables when `passwordRequired && password.length === 0`). In Noterly v1 it is always enabled.

### Visual components

Input field: present for visual parity. `type="password"` with eye toggle. Not functionally required but maintains the same UI structure so password functionality can be added without layout changes.

Eye toggle: present, toggles between `type="password"` and `type="text"`. Same SVG 21.5x15.5, fill `#1C2C42` revealed, `#C9C9C9` hidden. Positioned `absolute right-[30px]`.

Log-in button: always `bg-[#4784f8]` (or Noterly brand colour). Always enabled. Calls `onUnlock()` on press.

No error message element needed in v1 (no validation). Can be omitted or stubbed as hidden.

Focus handling on input: same `onPointerDown` pattern with `preventScroll: true`.

### Future expansion

When real authentication is added:
- Wire `passwordRequired` flag
- Add credential validation to `handleSubmit`
- Add error message element (already in Reminderly template)
- The screen layout, button positions, and navigation flow require no changes

---

## Part 6: Exact measurement summary for implementation

This section consolidates all exact values for direct use in implementation prompts.

Overlay outer shell: `bg-white content-stretch flex flex-col items-center relative rounded-tl-[20px] rounded-tr-[20px] size-full`

Content column: `flex flex-col h-full relative w-full max-w-[768px]`

Login container: `flex flex-col items-start pt-[30px] px-[30px] pb-[30px] relative w-full flex-1 min-h-0`
Login inner: `flex flex-col items-center size-full`
Login top group: `content-stretch flex flex-col gap-[60px] items-center pt-[80px] relative size-full`
Logo group: `content-stretch flex flex-col gap-[29px] items-center relative shrink-0`
Logo: 50x50px SVG
App name: Lato Bold 22px `#1C2C42` center
Inputs group: `content-stretch flex flex-col gap-[30px] items-center relative shrink-0 w-full`
Input: `h-[60px] rounded-[100px]`, border `#BABABA` / `#939393` focus, text 20px center
Button: `h-[60px] rounded-[100px] w-full bg-[#4784f8]`, text Lato Bold 20px white

PageShell: `flex flex-col gap-[30px] items-start pt-[30px] px-[20px] pb-[60px] relative w-full flex-1 min-h-0` + `style={{ overflowY: 'auto' }}`

Home header: `content-stretch flex items-center justify-between relative shrink-0 w-full`
Home title: Lato Bold 20px `#1C2C42`
Close button: 25.456x25.456px, plus SVG 18x18 rotated 45deg, fill `#1C2C42`

BackHeader: `content-stretch flex items-center justify-between relative shrink-0 w-full mb-[15px]`
Back chevron: SVG 9x17, fill `#1C2C42`
Back group gap: 20px
Page title: Lato Bold 20px `#1C2C42`

ToggleRow: `flex h-[30px] items-center justify-between w-full`
Label: Lato Bold 17px, `#1C2C42` on, `#C9C9C9` off, `#D9D9D9` disabled
Toggle: 56x30px rounded-[37.5px], `#4784f8` on, `#C9C9C9` off, `#D9D9D9` disabled, circle 22.5px
Info icon: 16.5x16.5px SVG, `#939393` default, `#D9D9D9` disabled/off
Label-to-info gap: 16px

MenuRow: `button flex h-[30px] items-center justify-between w-full pr-[15px]`
Label: Lato Bold 17px, `#1C2C42` active, `#D9D9D9` disabled
Chevron: SVG 7x13, `#939393` active, `#D9D9D9` disabled
Label-to-info gap: 16px

SectionSubtitle: `flex h-[10px] items-center w-full`
Text: Lato SemiBold 14px `#939393`

KeyLine: `w-full h-px bg-[#E4E4E4] shrink-0`

Confirmation modal card: `bg-white rounded-[32px] py-[40px] px-[34px] gap-[35px]` width 322px
Modal title: Lato Bold 20px `#1C2C42` center
Modal body: Lato SemiBold 17px `#939393` center
Cancel button: `h-[50px] rounded-[100px] px-[16px] bg-[#BABABA]`
Confirm button: `h-[50px] rounded-[100px] px-[16px] bg-[#4784F8]`
Button text: Lato Bold 17px white

DevToolsInfoOverlay card: `bg-white rounded-[32px] pt-[35px] pb-[35px] px-[32px] gap-[40px]` width 340px
Info header: Lato Bold 20px `#1C2C42` center fontWeight 700
Info body: Lato Bold 17px `#BABABA` center fontWeight 700 lineHeight 24px
Info close button: `bg-[#4784f8] h-[50px] w-full rounded-[100px]`, text Lato Bold 17px white "Close"

Home NavRow (plain): `h-[60px]`, Lato Bold 17px `#1C2C42`, padding right 15px
Home NavRowWithToggle: `h-[60px]`, toggle SVG 56x30, label 17px on=`#1C2C42` off=`#D9D9D9`, padding right 15px, gap 16px between toggle and label
Home row dividers: `divide-y divide-[#E4E4E4]`
