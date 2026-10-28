import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { getSettingsChecks } from '../dev/settings-checks';
import { parseTokens } from '../utils/nlc-parser';

// The settings foundation checks use in-memory storage, so they run the same in Vitest and Self Check.
describe('settings foundation', () => {
  for (const check of getSettingsChecks()) {
    it(check.name, () => check.run());
  }
});

// Phase 1.1: settings that moved to authoritative keys must have no remaining legacy reader or writer.
// Only the migration (and its checks) may name the legacy keys.
describe('no legacy settings keys in active code', () => {
  const legacyKeys = [
    'dev.listsEnabled',
    'reminderly-dev-one-minute-time-increments',
    'reminderly-notif-reminder-alerts',
    'reminderly-notif-app-badge',
    'reminderly-notif-include-today-in-badge',
    'reminderly-haptics-config',
    'reminderly-ff-tutorial-first-launch',
    'reminderly-ff-tutorial-every-start',
    'reminderly-dev-default-templates-in-clean-state',
    'reminderly-ff-siri-shortcuts',
  ];
  const allowed = ['app/settings/migration.ts', 'app/dev/settings-checks.ts', 'app/__tests__/'];
  const srcDir = path.resolve(__dirname, '../..');

  function sourceFiles(dir: string): string[] {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return sourceFiles(full);
      return /\.(ts|tsx|js)$/.test(entry.name) ? [full] : [];
    });
  }

  it('legacy keys appear only in the migration and its checks', () => {
    const offenders: string[] = [];
    for (const file of sourceFiles(srcDir)) {
      const relative = path.relative(srcDir, file);
      if (allowed.some((prefix) => relative.startsWith(prefix))) continue;
      const text = fs.readFileSync(file, 'utf8');
      for (const key of legacyKeys) {
        if (text.includes(`'${key}'`) || text.includes(`"${key}"`)) offenders.push(`${relative}: ${key}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

// Phase 2: every Dev tools control appears exactly once. Dev tools holds no user preferences.
describe('dev tools controls', () => {
  const files = ['components/DevToolsOverlay.tsx', '../imports/DevTools.tsx'].map((file) =>
    fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8'),
  ).join('\n');
  const controls = [
    // Feature flags
    'Reminders', 'Enable reminders', 'Repeat reminders', '1 minute time increments', 'Calendar',
    'Lists', 'Enable lists', 'Smart reminders', 'List templates', 'Use template set in clean state', 'Pinned lists',
    'Natural Language Capture', 'Enable Natural Language Capture',
    'Notifications',
    'Siri shortcuts', 'Siri for reminders',
    'Onboarding', 'Enable onboarding', 'Show tutorial on first launch',
    'System', 'Haptics', 'Sounds', 'Lock screen widget', 'Settings menu', 'Show info icons',
    // Testing tools
    'Testing tools', 'Self checks', 'Dummy reminders', 'Dummy lists', 'Show tutorial on every app start',
    // Access and diagnostics
    'Dev tools password', 'Password required',
  ];

  it.each(controls)('%s appears exactly once', (label) => {
    expect(files.split(`label="${label}"`).length - 1).toBe(1);
  });
});

// Natural Language Capture > Examples: each example shows the words John approved in blue (2026-10-28).
describe('NLC examples page', () => {
  const source = fs.readFileSync(path.resolve(__dirname, '../components/SettingsPanelContent.tsx'), 'utf8');
  const examples = [...source.match(/NLC_EXAMPLES[^=]*= \[([\s\S]*?)\n\];/)![1].matchAll(/text: '([^']+)'/g)].map((m) => m[1]);
  const expected: Record<string, string[]> = {
    'Call mum tomorrow at 3pm': ['tomorrow', '3pm'],
    'Dentist next Friday at 10:30am': ['next Friday', '10:30am'],
    'Put the bins out every Tuesday evening': ['every Tuesday', 'evening'],
    'Gym Mon, Wed, Fri at 7am': ['Mon, Wed, Fri', '7am'],
    'Take the bread out in 20 minutes': ['in 20 minutes'],
    'Pay rent on 1/12': ['1/12'],
    'Renew passport Wed 4 Nov': ['Wed 4 Nov'],
  };

  it('lists the approved examples', () => {
    expect(examples).toEqual(Object.keys(expected));
  });

  it.each(Object.entries(expected))('%s highlights the expected words', (text, words) => {
    expect(parseTokens(text).map((token) => token.text)).toEqual(words);
  });
});
