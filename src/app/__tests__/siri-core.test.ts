import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import fs from 'fs';
import vm from 'vm';
import path from 'path';
import { build } from 'vite';
import { buildSiriReminder, isSiriCancelAnswer } from '../utils/siri';

// The Siri core bundle (vite.siri-core.config.ts) run as the Siri intent will run it: one plain script in an empty
// sandbox with no window, document or localStorage. It must give exactly what the app's own code gives.
type SiriCore = { buildSiriReminder: typeof buildSiriReminder; isSiriCancelAnswer: typeof isSiriCancelAnswer };
let sandbox: Record<string, unknown>;
let core: SiriCore;
let builtCode = '';

beforeAll(async () => {
  const output = await build({
    configFile: path.resolve(__dirname, '../../../vite.siri-core.config.ts'),
    logLevel: 'silent',
    build: { write: false },
  });
  const chunk = (Array.isArray(output) ? output[0] : output as { output: { code?: string }[] }).output[0] as { code: string };
  builtCode = chunk.code;
  sandbox = {};
  vm.runInNewContext(chunk.code, sandbox);
  core = sandbox.ReminderlySiri as SiriCore;
}, 60000);

afterEach(() => { vi.useRealTimers(); });

// The core sees the test's clock, as JavaScriptCore sees the device clock
function inCore(text: string, now: Date, repeats: boolean) {
  sandbox.Date = Date;
  return JSON.parse(JSON.stringify(core.buildSiriReminder(text, now, repeats)));
}

const PHRASES = [
  'Call Mum at 6pm', 'Call Mum at 9am', 'Call Mum tomorrow at 9am', 'Call Mum today at 9am', 'Gym this morning',
  'Take the bins out tonight', 'Dentist March 5', 'Dentist 5th of March', 'Dentist October 22', 'Dentist March 5 2026',
  'Dentist January 2', 'Pay rent next Monday', 'Take pills every day', 'Team meeting every Monday at 10am',
  'Buy milk & eggs', 'Buy milk', 'Call Dave at 3pm on Friday', 'Book flights in two weeks',
  'Call Mum in 10 minutes', 'Call Mum in an hour', 'Call Mum in two hours', 'Call Mum in 2 days',
  "Call Mum at 4 o'clock", 'Call Mum at half past four', 'Call Mum at four pm', 'Call Mum the day after tomorrow',
  'Call Mum Friday evening', 'Call Mum at 4:10pm', 'Call Mum at 16:10',
  "Call Mum tomorrow at 4 o'clock", "Call Mum tomorrow at 9 o'clock",
];
const NOWS = [
  new Date(2026, 9, 22, 15, 0), // Thursday afternoon
  new Date(2026, 9, 22, 7, 30), // Thursday morning
  new Date(2026, 11, 31, 22, 0), // New Year's Eve
  new Date(2026, 9, 24, 23, 59), // the night before the clock change
];

describe('Siri core bundle', () => {
  it('the copy bundled into the iOS app is up to date (run npm run build:siri-core)', () => {
    const bundled = fs.readFileSync(path.resolve(__dirname, '../../../ios/App/App/siri-core.js'), 'utf8');
    expect(bundled).toBe(builtCode);
  });

  it('exposes only buildSiriReminder and isSiriCancelAnswer', () => {
    expect(Object.keys(core).sort()).toEqual(['buildSiriReminder', 'isSiriCancelAnswer']);
  });

  it('cancel answers to "What time?" match the app code', () => {
    for (const answer of ['cancel', 'Stop.', 'never mind', 'forget it', '3pm', 'banana']) {
      expect(core.isSiriCancelAnswer(answer)).toBe(isSiriCancelAnswer(answer));
    }
  });

  it('runs with no DOM and matches the app code for every phrase, time and repeat setting', () => {
    vi.useFakeTimers();
    for (const now of NOWS) {
      vi.setSystemTime(now);
      for (const text of PHRASES) for (const repeats of [true, false]) {
        expect(inCore(text, now, repeats)).toEqual(JSON.parse(JSON.stringify(buildSiriReminder(text, now, repeats))));
      }
    }
  });
});
