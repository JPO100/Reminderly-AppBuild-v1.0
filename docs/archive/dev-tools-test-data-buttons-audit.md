# Dev tools test data action button audit

Source files:
- `src/imports/DummyReminders.tsx` - dummy reminders page
- `src/imports/DummyLists.tsx` - dummy lists page

Both pages use an identical button pattern. All values below apply to both unless stated otherwise.

---

## Button layout

The two action buttons sit in a single horizontal row at the bottom of each page, outside the scrollable content area.

Row container: `flex gap-[30px] items-center relative shrink-0 w-full`

The 30px gap separates the two buttons. Both buttons use `flex-1` so they share available width equally.

---

## Button dimensions

Height: `clamp(40px, calc(20vh - 73.6px), 60px)` applied as an inline style.
This produces a responsive height between 40px (minimum) and 60px (maximum), scaling with 20% of viewport height. On a standard iPhone the result is approximately 50-55px.

Border-radius: `rounded-[100px]` (pill shape, fully rounded ends).

Width: `flex-1` (each button takes half the row width minus half the 30px gap).

---

## Clear button

### Labels by state

idle: "Clear list" (dummy reminders) / "Clear lists" (dummy lists)
confirming: "Are you sure?"
cleared: "Cleared!"

### Background colours by state

idle: `#4784F8` (Reminderly blue)
confirming: `#35506E` (dark navy blue)
cleared: `#2A4466` (darker navy blue)

The background colour change is the only visual difference between states. There is no animation or transition on the colour change.

### Behaviour

State machine: `'idle' | 'confirming' | 'cleared'`

First tap (idle → confirming): label changes to "Are you sure?", background darkens to `#35506E`. No action is taken.

Second tap (confirming → cleared): the clear action fires, label changes to "Cleared!", background darkens further to `#2A4466`.

Auto-reset: 2000ms after entering the cleared state, the button resets to idle.

Click-outside-to-cancel: while in the confirming state, clicking anywhere outside the button cancels and resets to idle. Implemented via `mousedown` listener on `document`, dismissed if the click target is outside `clearBtnRef`.

No disabled state. The button is always interactive.

No modal or toast. All feedback is inline on the button label itself.

---

## Generate button

### Labels by state

idle: "Generate list" (dummy reminders) / "Generate lists" (dummy lists)
done: "Done"

### Background colours by state

idle: `#7EC91C` (green)
done: `#6AB016` (darker green)

### Behaviour

Tapping when idle fires the generate action immediately with no confirmation. `showDone` is set to true, the label changes to "Done" and the background darkens.

Auto-close: 500ms after generate fires, the overlay closes (`onClose()` is called). The "Done" state is only visible for approximately 500ms before the panel disappears.

When `showDone` is true, tapping the button does nothing (`if (showDone) return`).

No disabled state via the HTML `disabled` attribute. The early return in the handler acts as a functional guard.

No modal or toast. All feedback is inline on the button label itself.

---

## Button typography

Both buttons: `font-['Lato:Bold',sans-serif] text-[17px] text-white whitespace-nowrap leading-[0]`
Inner text `<p>`: `leading-[normal]`
Inner padding: `px-[18px] py-[15px]`

---

## Colour summary

Clear idle: `#4784F8`
Clear confirming: `#35506E`
Clear cleared: `#2A4466`
Generate idle: `#7EC91C`
Generate done: `#6AB016`
Button text: white in all states

---

## Feedback method summary

All feedback is inline. There are no modals, no toasts, no status rows, and no separate feedback elements. The button label and background colour are the only feedback mechanisms. Both buttons use label substitution as their primary feedback pattern.

The clear button uses a two-tap confirmation (tap once to prime, tap again to confirm). The generate button requires no confirmation and gives only a brief "Done" label before the overlay closes automatically.

---

## No error states

Neither button has an error state. There is no error feedback text, no failure handling, and no error colour. If the underlying action fails (e.g. `onClearReminders` throws), no user-visible feedback is shown.
