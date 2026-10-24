// Siri locked-device creation (docs/plans/siri-locked-device.md): the only code the Siri intent runs in
// JavaScriptCore. Reminderly's existing Siri parsing and the "What time?" cancel check; built into one file by vite.siri-core.config.ts.
export { buildSiriReminder, isSiriCancelAnswer } from './utils/siri';
