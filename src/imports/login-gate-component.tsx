Proceed with a lightweight client-side login gate in front of the dev tools. This is not intended to provide real security - it is only to prevent casual access. Do not introduce any server-side functionality, authentication providers, encryption, hashing, or external services.

Trigger behaviour

Triple-clicking the Reminderly logo text element must no longer open the dev tools home directly. Instead, it must open a login overlay.

Login overlay UI

The login overlay must contain exactly the following elements:

* one password input field
* one submit button
* one inline error message area (shown only when the password is incorrect)

The visual layout and styling of the login overlay will be provided via an attached component. Replicate that component exactly. Do not reinterpret, redesign, or introduce additional UI elements.

Overlay implementation

The login overlay must use the same overlay container and behaviour used by the existing content overlays.

Implementation must follow the rules defined in:

docs/design.md

Requirements:

* use the existing overlay container pattern already used by other overlays
* follow the same sizing rules
* follow the same spacing rules
* follow the same responsive behaviour across breakpoints
* do not introduce any new overlay wrappers, containers, abstractions, or overlay systems

Authentication logic

Use a simple client-side password comparison.

Implementation rules:

* define a single constant in the client code for the password
* set the password constant to '123' for the initial implementation and testing
* when the user submits the password, compare the entered value directly to this constant
* if the values match, close the login overlay and open the dev tools home
* if the values do not match, show the inline error message and keep the overlay open
* do not add password visibility toggles, validation rules, animations, rate limiting, or additional UX behaviour

Session behaviour

Authentication must be session-based only.

Rules:

* once the correct password has been entered, dev tools remain unlocked for the current app session
* refreshing the application must reset the lock and require the password again
* do not persist authentication in localStorage, sessionStorage, cookies, or any other storage

Technical constraints

* do not add server-side code
* do not introduce Supabase or any authentication service
* do not add encryption or hashing libraries
* do not create contexts or global authentication systems
* do not introduce new architectural patterns
* do not modify reminder logic or any other existing application behaviour

All logic must remain within the existing dev tools flow and use a single boolean state flag representing whether dev tools are unlocked.

Outcome

The result must be a minimal client-side gate that prevents casual access to dev tools while remaining fully consistent with the existing overlay system and without introducing any additional architecture or complexity.
