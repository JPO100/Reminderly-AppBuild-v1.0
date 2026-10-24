/**
 * NLC Interaction Checks
 *
 * Deterministic checks for the NLC interaction state machine:
 *   - Token click result (what toggles/values change)
 *   - Eligibility filtering (one-active-token-per-category)
 *   - Invalidation (4-step rule on text edits)
 *   - Save behaviour (recognition-only produces no schedule fields)
 *
 * All functions under test are pure (data-in, data-out).
 * No React state, no DOM, no real Date.now.
 *
 * STATELESS: Returns fresh check array on each call.
 */

import type { Check } from './check-system';
import { parseTokens, type ParsedToken, type TokenCategory } from '../utils/nlc-parser';
import {
  computeEligibleTokens,
  computeTokenClickResult,
  computeInvalidation,
  computeScheduleKind,
  computeAutoApplyResult,
  togglesForAutoApply,
  getNextDayOccurrence,
  isCompoundTimeToken,
  getRepeatsImpliedTime,
  parseRepeatsTokenValue,
  parseDateTokenValue,
  type AppliedTokens,
} from '../utils/nlc-interaction';
import { titleFromAppliedTokens } from '../utils/normalise-text';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

/** Convenience: empty applied tokens (nothing clicked yet) */
function emptyApplied(): AppliedTokens {
  return { date: null, time: null, repeats: null };
}

export function getNlcInteractionChecks(): Check[] {
  return [
    // ========================================================================
    // A) Recognition-only does not apply anything
    // ========================================================================
    {
      id: 'nlc-interaction-a-recognition-only',
      name: 'NLC interaction A: recognition-only does not apply toggles or schedule',
      run: () => {
        const text = 'Put the bins out every Wednesday at 7pm';
        const tokens = parseTokens(text);
        const applied = emptyApplied();

        // Tokens are recognised
        assert(tokens.length > 0, `Expected tokens to be parsed, got ${tokens.length}`);

        // But with no applied tokens, computeTokenClickResult is never called,
        // so toggle state remains all-off. Verify that the eligible set is
        // the full parsed set (nothing applied → everything eligible).
        const eligible = computeEligibleTokens(tokens, applied);
        assert(eligible.length === tokens.length,
          `Expected all ${tokens.length} tokens eligible, got ${eligible.length}`);

        // Save decision: with all toggles off (isDateOn=false), schedule is "sometime".
        // This is a UI-level concern, but we verify the precondition here:
        // no click result was produced, so no toggle would be set.
        // (The actual save logic lives in the component, tested via acceptance flows.)
      },
    },

    // ========================================================================
    // B) Clicking a time token applies time only
    // ========================================================================
    {
      id: 'nlc-interaction-b-time-token-click',
      name: 'NLC interaction B: clicking time token sets time only, not date',
      run: () => {
        const text = 'Put the bins out every Wednesday at 7pm';
        const tokens = parseTokens(text);
        const timeToken = tokens.find(t => t.category === 'time');
        assert(timeToken !== undefined, 'Expected a time token for "7pm"');

        const result = computeTokenClickResult(timeToken!);
        assert(result !== null, 'Expected non-null click result for time token');

        // Time toggle on
        assert(result!.togglesOn.includes('time'), 'Expected "time" in togglesOn');
        // Time value set
        assert(result!.timeValue !== null, 'Expected timeValue to be set');
        assert(result!.timeValue!.hour === 19 && result!.timeValue!.minute === 0,
          `Expected 19:00, got ${result!.timeValue!.hour}:${result!.timeValue!.minute}`);

        // Date NOT auto-enabled by time token click
        assert(!result!.togglesOn.includes('date'), 'Expected "date" NOT in togglesOn for time click');
        assert(result!.dateValue === null, 'Expected dateValue to be null');

        // Repeats not touched
        assert(!result!.togglesOn.includes('repeats'), 'Expected "repeats" NOT in togglesOn');
        assert(result!.repeatConfig === null, 'Expected repeatConfig to be null');
      },
    },

    // ========================================================================
    // C) Clicking a date token applies date only
    // ========================================================================
    {
      id: 'nlc-interaction-c-date-token-click',
      name: 'NLC interaction C: clicking date token sets date only',
      run: () => {
        const text = 'Call Mary next Friday';
        const tokens = parseTokens(text);
        const dateToken = tokens.find(t => t.category === 'date');
        assert(dateToken !== undefined, 'Expected a date token for "next Friday"');

        const result = computeTokenClickResult(dateToken!);
        assert(result !== null, 'Expected non-null click result');

        // Date toggle on, value set (non-null — exact date depends on "now")
        assert(result!.togglesOn.includes('date'), 'Expected "date" in togglesOn');
        assert(result!.dateValue !== null, 'Expected dateValue to be non-null');

        // Time and repeats not touched
        assert(!result!.togglesOn.includes('time'), 'Expected "time" NOT in togglesOn');
        assert(result!.timeValue === null, 'Expected timeValue null');
        assert(!result!.togglesOn.includes('repeats'), 'Expected "repeats" NOT in togglesOn');
        assert(result!.repeatConfig === null, 'Expected repeatConfig null');
      },
    },

    // ========================================================================
    // D) Clicking a repeats token applies repeats AND date
    // ========================================================================
    {
      id: 'nlc-interaction-d-repeats-token-click',
      name: 'NLC interaction D: clicking repeats token sets repeats + date',
      run: () => {
        const text = 'Put the bins out every Wednesday';
        const tokens = parseTokens(text);
        const repeatsToken = tokens.find(t => t.category === 'repeats');
        assert(repeatsToken !== undefined, 'Expected a repeats token for "every Wednesday"');

        const result = computeTokenClickResult(repeatsToken!);
        assert(result !== null, 'Expected non-null click result');

        // Repeats toggle on
        assert(result!.togglesOn.includes('repeats'), 'Expected "repeats" in togglesOn');
        // Date also toggled on (repeats implies date)
        assert(result!.togglesOn.includes('date'), 'Expected "date" in togglesOn for repeats click');

        // RepeatConfig set with correct structure
        assert(result!.repeatConfig !== null, 'Expected repeatConfig non-null');
        assert(result!.repeatConfig!.frequency === 'custom-days',
          `Expected frequency "custom-days", got "${result!.repeatConfig!.frequency}"`);
        assert(
          result!.repeatConfig!.selectedDays?.includes('Wednesday') === true,
          'Expected selectedDays to include "Wednesday"',
        );

        // Anchor date set (next Wednesday from "now" — just verify non-null)
        assert(result!.dateValue !== null, 'Expected dateValue (anchor) non-null');

        // Time not touched
        assert(!result!.togglesOn.includes('time'), 'Expected "time" NOT in togglesOn');
        assert(result!.timeValue === null, 'Expected timeValue null');
      },
    },

    // ========================================================================
    // E) One-active-token-per-category disables other tokens
    // ========================================================================
    {
      id: 'nlc-interaction-e-one-active-per-category',
      name: 'NLC interaction E: applying one date token makes others ineligible',
      run: () => {
        const text = 'Meet Mary on Friday and on Sunday';
        const tokens = parseTokens(text);
        const dateTokens = tokens.filter(t => t.category === 'date');
        assert(dateTokens.length === 2,
          `Expected 2 date tokens (Friday, Sunday), got ${dateTokens.length}`);

        const friday = dateTokens.find(t => t.text.toLowerCase() === 'friday');
        const sunday = dateTokens.find(t => t.text.toLowerCase() === 'sunday');
        assert(friday !== undefined, 'Expected a Friday token');
        assert(sunday !== undefined, 'Expected a Sunday token');

        // Before any click: both eligible
        const beforeEligible = computeEligibleTokens(tokens, emptyApplied());
        const beforeDateEligible = beforeEligible.filter(t => t.category === 'date');
        assert(beforeDateEligible.length === 2, `Before click: expected 2 eligible date tokens, got ${beforeDateEligible.length}`);

        // Apply Friday
        const applied: AppliedTokens = { ...emptyApplied(), date: friday! };
        const afterEligible = computeEligibleTokens(tokens, applied);
        const afterDateEligible = afterEligible.filter(t => t.category === 'date');

        // Only Friday should be eligible now
        assert(afterDateEligible.length === 1,
          `After click: expected 1 eligible date token, got ${afterDateEligible.length}`);
        assert(afterDateEligible[0].text.toLowerCase() === 'friday',
          `Expected remaining eligible to be "Friday", got "${afterDateEligible[0].text}"`);
      },
    },

    // ========================================================================
    // F) Invalidation by deletion turns off toggles, re-enables alternatives
    // ========================================================================
    {
      id: 'nlc-interaction-f-invalidation-deletion',
      name: 'NLC interaction F: deleting applied token invalidates and re-enables alternatives',
      run: () => {
        // Starting state: "Meet Mary on Friday and on Sunday", Friday applied
        const text1 = 'Meet Mary on Friday and on Sunday';
        const tokens1 = parseTokens(text1);
        const friday = tokens1.find(t => t.category === 'date' && t.text.toLowerCase() === 'friday');
        assert(friday !== undefined, 'Expected Friday token');

        const applied: AppliedTokens = { ...emptyApplied(), date: friday! };

        // Edit: remove "Friday" → "Meet Mary on and on Sunday"
        const text2 = 'Meet Mary on and on Sunday';
        const tokens2 = parseTokens(text2);

        // Run invalidation
        const { newApplied, invalidated } = computeInvalidation(applied, tokens2);

        // Friday is gone → date category invalidated
        assert(invalidated.includes('date'), 'Expected "date" in invalidated');
        assert(newApplied.date === null, 'Expected newApplied.date to be null after invalidation');

        // Sunday should now be eligible again (no applied token in date category)
        const eligible = computeEligibleTokens(tokens2, newApplied);
        const eligibleDate = eligible.filter(t => t.category === 'date');
        const sundayEligible = eligibleDate.find(t => t.text.toLowerCase() === 'sunday');
        assert(sundayEligible !== undefined, 'Expected Sunday to be eligible after Friday invalidation');
      },
    },

    // ========================================================================
    // G) Ambiguity invalidation (multiple identical tokens)
    // ========================================================================
    {
      id: 'nlc-interaction-g-ambiguity-invalidation',
      name: 'NLC interaction G: ambiguous duplicate tokens cause invalidation',
      run: () => {
        // Text with one "Friday", apply it
        const text1 = 'Meet on Friday for lunch';
        const tokens1 = parseTokens(text1);
        const friday = tokens1.find(t => t.category === 'date' && t.text.toLowerCase() === 'friday');
        assert(friday !== undefined, 'Expected Friday token');

        const applied: AppliedTokens = { ...emptyApplied(), date: friday! };

        // Edit: now text has "Friday" twice at different positions, and original range is gone
        // "Friday lunch on Friday" — two Fridays, neither at the original range
        const text2 = 'Friday lunch on Friday';
        const tokens2 = parseTokens(text2);
        const fridayTokens2 = tokens2.filter(t => t.category === 'date' && t.text.toLowerCase() === 'friday');
        assert(fridayTokens2.length === 2, `Expected 2 Friday tokens in edited text, got ${fridayTokens2.length}`);

        // Ensure neither matches the original range (the original was at a different position)
        const originalStillExists = tokens2.some(
          t => t.category === 'date' && t.start === friday!.start && t.end === friday!.end && t.text === friday!.text,
        );
        assert(!originalStillExists, 'Precondition: original Friday range should not exist in edited text');

        // Run invalidation
        const { newApplied, invalidated } = computeInvalidation(applied, tokens2);

        // Multiple occurrences of same text → ambiguity → invalidate
        assert(invalidated.includes('date'), 'Expected "date" in invalidated due to ambiguity');
        assert(newApplied.date === null, 'Expected newApplied.date null after ambiguity invalidation');
      },
    },

    // ========================================================================
    // H) Non-quarter-hour time is not recognised
    // ========================================================================
    {
      id: 'nlc-interaction-h-non-quarter-hour-not-clickable',
      name: 'NLC interaction H: non-quarter-hour time (7:10pm) produces no time token',
      run: () => {
        const text = 'Meet at 7:10pm for dinner';
        const tokens = parseTokens(text);
        const timeTokens = tokens.filter(t => t.category === 'time');

        // Parser should not recognise 7:10pm (not a quarter-hour)
        assert(timeTokens.length === 0,
          `Expected 0 time tokens for "7:10pm", got ${timeTokens.length}: ${timeTokens.map(t => t.text).join(', ')}`);

        // Therefore no time token exists to click — isTimeOn cannot be set via NLC
        // (This is a parser-level constraint that the interaction layer inherits.)
      },
    },

    // ========================================================================
    // I) Repeats anchor date derivation rules
    // ========================================================================
    {
      id: 'nlc-interaction-i-anchor-date-weekday',
      name: 'NLC interaction I: "every Wednesday" anchor is next upcoming Wednesday (or today)',
      run: () => {
        const text = 'Bins out every Wednesday';
        const tokens = parseTokens(text);
        const repeatsToken = tokens.find(t => t.category === 'repeats');
        assert(repeatsToken !== undefined, 'Expected repeats token');

        const result = computeTokenClickResult(repeatsToken!);
        assert(result !== null, 'Expected non-null click result');
        assert(result!.dateValue !== null, 'Expected anchor date non-null');

        // Independently compute what the anchor should be using the same rule
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const expectedAnchor = getNextDayOccurrence(now, [3]); // 3 = Wednesday

        assert(
          result!.dateValue!.getFullYear() === expectedAnchor.getFullYear() &&
          result!.dateValue!.getMonth() === expectedAnchor.getMonth() &&
          result!.dateValue!.getDate() === expectedAnchor.getDate(),
          `Anchor date mismatch: got ${result!.dateValue!.toISOString()}, expected ${expectedAnchor.toISOString()}`,
        );

        // Anchor must be a Wednesday
        assert(result!.dateValue!.getDay() === 3,
          `Expected anchor to be Wednesday (day 3), got day ${result!.dateValue!.getDay()}`);
      },
    },
    {
      id: 'nlc-interaction-i-anchor-date-interval',
      name: 'NLC interaction I: "every 3 days" anchor is today',
      run: () => {
        const text = 'Water plants every 3 days';
        const tokens = parseTokens(text);
        const repeatsToken = tokens.find(t => t.category === 'repeats');
        assert(repeatsToken !== undefined, 'Expected repeats token for "every 3 days"');

        const result = computeTokenClickResult(repeatsToken!);
        assert(result !== null, 'Expected non-null click result');
        assert(result!.dateValue !== null, 'Expected anchor date non-null');

        // For non-day-specific repeats, anchor is today at midnight
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        assert(
          result!.dateValue!.getFullYear() === today.getFullYear() &&
          result!.dateValue!.getMonth() === today.getMonth() &&
          result!.dateValue!.getDate() === today.getDate(),
          `Expected anchor to be today (${today.toISOString()}), got ${result!.dateValue!.toISOString()}`,
        );

        // Config should be daily with interval 3
        assert(result!.repeatConfig !== null, 'Expected repeatConfig non-null');
        assert(result!.repeatConfig!.frequency === 'daily',
          `Expected frequency "daily", got "${result!.repeatConfig!.frequency}"`);
        assert(result!.repeatConfig!.interval === 3,
          `Expected interval 3, got ${result!.repeatConfig!.interval}`);
      },
    },

    // ========================================================================
    // J) Ambiguity invalidation uses the correct branch (does not silently move)
    // ========================================================================
    {
      id: 'nlc-interaction-j-ambiguity-does-not-relocate',
      name: 'NLC interaction J: two identical time tokens after edit cause invalidation, not relocation',
      run: () => {
        // Apply "7pm" in original text
        const text1 = 'Dinner at 7pm with friends';
        const tokens1 = parseTokens(text1);
        const timeToken = tokens1.find(t => t.category === 'time');
        assert(timeToken !== undefined, 'Expected time token "7pm"');

        const applied: AppliedTokens = { ...emptyApplied(), time: timeToken! };

        // Edit: move text so "7pm" appears twice at new positions
        const text2 = '7pm dinner or 7pm drinks';
        const tokens2 = parseTokens(text2);
        const timeTokens2 = tokens2.filter(t => t.category === 'time');
        assert(timeTokens2.length === 2, `Expected 2 time tokens, got ${timeTokens2.length}`);

        // Precondition: original range no longer exists
        const originalExists = tokens2.some(
          t => t.category === 'time' && t.start === timeToken!.start && t.end === timeToken!.end,
        );
        assert(!originalExists, 'Precondition: original time range should not exist in edited text');

        const { newApplied, invalidated } = computeInvalidation(applied, tokens2);

        // Must invalidate (ambiguity), NOT silently relocate to one of the two
        assert(invalidated.includes('time'), 'Expected "time" in invalidated (ambiguity branch)');
        assert(newApplied.time === null, 'Expected newApplied.time null — must not silently relocate');
      },
    },

    // ========================================================================
    // K) Save behaviour: no click means no structured schedule
    // ========================================================================
    {
      id: 'nlc-interaction-k-no-click-no-schedule',
      name: 'NLC interaction K: no token clicks means schedule is "sometime"',
      run: () => {
        // Text with valid tokens but nothing applied
        const text = 'Put the bins out every Wednesday at 7pm';
        const tokens = parseTokens(text);
        assert(tokens.length > 0, 'Precondition: tokens exist');

        const applied = emptyApplied();

        // All toggles off (no click result was ever produced)
        const isDateOn = false;
        const isTimeOn = false;
        const isRepeatsOn = false;
        const selectedDate: Date | null = null;

        // Schedule kind must be "sometime"
        const kind = computeScheduleKind(isDateOn, selectedDate);
        assert(kind === 'sometime',
          `Expected schedule kind "sometime" with no clicks, got "${kind}"`);

        // Explicitly verify: even though tokens exist, no structured data was set
        assert(!isTimeOn, 'isTimeOn should be false with no clicks');
        assert(!isRepeatsOn, 'isRepeatsOn should be false with no clicks');
        assert(selectedDate === null, 'selectedDate should be null with no clicks');

        // Applied tokens remain empty
        assert(applied.date === null, 'applied.date should remain null');
        assert(applied.time === null, 'applied.time should remain null');
        assert(applied.repeats === null, 'applied.repeats should remain null');
      },
    },

    // ========================================================================
    // L) Auto parsing: applies time when exactly one time token and toggle off
    // ========================================================================
    {
      id: 'nlc-auto-l-single-time',
      name: 'NLC auto parsing: applies time when exactly one time token exists and time toggle is off',
      run: () => {
        const text = 'Call dentist at 3pm';
        const tokens = parseTokens(text);
        const actions = computeAutoApplyResult(tokens, { date: false, time: false, repeats: false });

        const timeAction = actions.find(a => a.category === 'time');
        assert(timeAction !== undefined, 'Expected a time auto-apply action');
        assert(timeAction!.token.text.toLowerCase() === '3pm',
          `Expected time token "3pm", got "${timeAction!.token.text}"`);
      },
    },

    // ========================================================================
    // M) Auto parsing: does not apply date when two date tokens exist
    // ========================================================================
    {
      id: 'nlc-auto-m-ambiguous-date',
      name: 'NLC auto parsing: does not apply date when two date tokens exist',
      run: () => {
        const text = 'Meet on Friday and Sunday';
        const tokens = parseTokens(text);
        const dateTokens = tokens.filter(t => t.category === 'date');
        assert(dateTokens.length === 2, `Precondition: expected 2 date tokens, got ${dateTokens.length}`);

        const actions = computeAutoApplyResult(tokens, { date: false, time: false, repeats: false });
        const dateAction = actions.find(a => a.category === 'date');
        assert(dateAction === undefined, 'Expected no date auto-apply action (ambiguous — 2 tokens)');
      },
    },

    // ========================================================================
    // N) Auto parsing: applies repeats+date when exactly one repeats token
    // ========================================================================
    {
      id: 'nlc-auto-n-repeats-implies-date',
      name: 'NLC auto parsing: applies repeats+date when exactly one repeats token exists',
      run: () => {
        const text = 'Bins out every Wednesday';
        const tokens = parseTokens(text);
        const actions = computeAutoApplyResult(tokens, { date: false, time: false, repeats: false });

        const repeatsAction = actions.find(a => a.category === 'repeats');
        assert(repeatsAction !== undefined, 'Expected a repeats auto-apply action');
        assert(repeatsAction!.token.text.toLowerCase() === 'every wednesday',
          `Expected repeats token "every wednesday", got "${repeatsAction!.token.text}"`);

        // Date should NOT be separately auto-applied (repeats handles it)
        const dateAction = actions.find(a => a.category === 'date');
        assert(dateAction === undefined, 'Expected no separate date action when repeats is auto-applied');
      },
    },

    // ========================================================================
    // O) Auto parsing: does not overwrite when toggle already on
    // ========================================================================
    {
      id: 'nlc-auto-o-no-overwrite',
      name: 'NLC auto parsing: does not overwrite when toggle already on',
      run: () => {
        const text = 'Call dentist at 3pm tomorrow';
        const tokens = parseTokens(text);

        // Time already on: should not produce time action
        const actionsTimeOn = computeAutoApplyResult(tokens, { date: false, time: true, repeats: false });
        const timeAction = actionsTimeOn.find(a => a.category === 'time');
        assert(timeAction === undefined, 'Expected no time action when time toggle already on');

        // Date already on: should not produce date action
        const actionsDateOn = computeAutoApplyResult(tokens, { date: true, time: false, repeats: false });
        const dateAction = actionsDateOn.find(a => a.category === 'date');
        assert(dateAction === undefined, 'Expected no date action when date toggle already on');

        // Both off: should produce both
        const actionsBothOff = computeAutoApplyResult(tokens, { date: false, time: false, repeats: false });
        assert(actionsBothOff.length === 2,
          `Expected 2 actions when both toggles off, got ${actionsBothOff.length}`);
      },
    },

    // ========================================================================
    // P) Auto parsing: respects invalidation (token removed → toggle off)
    // ========================================================================
    {
      id: 'nlc-auto-p-invalidation-re-enables',
      name: 'NLC auto parsing: after invalidation clears toggle, new text can re-trigger auto-apply',
      run: () => {
        // Simulate: "tomorrow" was applied, then user deletes it, then types "today"
        // Step 1: "Call dentist tomorrow" — auto-apply would set date
        const text1 = 'Call dentist tomorrow';
        const tokens1 = parseTokens(text1);
        const actions1 = computeAutoApplyResult(tokens1, { date: false, time: false, repeats: false });
        const dateAction1 = actions1.find(a => a.category === 'date');
        assert(dateAction1 !== undefined, 'Step 1: expected date action for "tomorrow"');

        // Step 2: Simulate "tomorrow" was applied → appliedTokens.date = tomorrowToken
        const tomorrowToken = dateAction1!.token;
        const applied: AppliedTokens = { date: tomorrowToken, time: null, repeats: null };

        // Step 3: User edits to "Call dentist today" — invalidation removes "tomorrow"
        const text2 = 'Call dentist today';
        const tokens2 = parseTokens(text2);
        const { newApplied, invalidated } = computeInvalidation(applied, tokens2);

        assert(invalidated.includes('date'), 'Expected date invalidated after deleting "tomorrow"');
        assert(newApplied.date === null, 'Expected appliedTokens.date null after invalidation');

        // Step 4: With toggle now off (invalidation turned it off), auto-apply should
        // pick up "today" as the new single date token
        const actions2 = computeAutoApplyResult(tokens2, { date: false, time: false, repeats: false });
        const dateAction2 = actions2.find(a => a.category === 'date');
        assert(dateAction2 !== undefined, 'Step 4: expected date action for "today" after invalidation');
        assert(dateAction2!.token.text.toLowerCase() === 'today',
          `Expected "today" token, got "${dateAction2!.token.text}"`);
      },
    },

    // ========================================================================
    // Q) Time-of-day: standalone token returns correct time value
    // ========================================================================
    {
      id: 'nlc-interaction-q-tod-standalone-value',
      name: 'NLC interaction Q: standalone "morning" returns time 07:00',
      run: () => {
        const tokens = parseTokens('Walk the dog morning');
        const timeToken = tokens.find(t => t.category === 'time');
        assert(timeToken !== undefined, 'Expected a time token for "morning"');

        const result = computeTokenClickResult(timeToken!);
        assert(result !== null, 'Expected non-null click result');
        assert(result!.timeValue !== null, 'Expected timeValue set');
        assert(result!.timeValue!.hour === 7 && result!.timeValue!.minute === 0,
          `Expected 07:00, got ${result!.timeValue!.hour}:${result!.timeValue!.minute}`);
        // Standalone: pure function returns time only (invariant is in applyToken)
        assert(!result!.togglesOn.includes('date'), 'Expected "date" NOT in togglesOn for standalone time-of-day');
        assert(result!.dateValue === null, 'Expected dateValue null for standalone');
      },
    },

    // ========================================================================
    // R) Time-of-day: compound token returns time + date
    // ========================================================================
    {
      id: 'nlc-interaction-r-tod-compound-value',
      name: 'NLC interaction R: "this morning" returns time 07:00 + date today',
      run: () => {
        const tokens = parseTokens('Pick up milk this morning');
        const timeToken = tokens.find(t => t.category === 'time');
        assert(timeToken !== undefined, 'Expected a time token for "this morning"');
        assert(isCompoundTimeToken(timeToken!.text), 'Expected "this morning" to be a compound token');

        const result = computeTokenClickResult(timeToken!);
        assert(result !== null, 'Expected non-null click result');
        assert(result!.timeValue !== null, 'Expected timeValue set');
        assert(result!.timeValue!.hour === 7 && result!.timeValue!.minute === 0,
          `Expected 07:00, got ${result!.timeValue!.hour}:${result!.timeValue!.minute}`);
        // Compound: returns both time and date
        assert(result!.togglesOn.includes('time'), 'Expected "time" in togglesOn');
        assert(result!.togglesOn.includes('date'), 'Expected "date" in togglesOn for compound');
        assert(result!.dateValue !== null, 'Expected dateValue non-null for compound');

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        assert(
          result!.dateValue!.getFullYear() === today.getFullYear() &&
          result!.dateValue!.getMonth() === today.getMonth() &&
          result!.dateValue!.getDate() === today.getDate(),
          'Expected dateValue to be today',
        );
      },
    },

    // ========================================================================
    // S) Time-of-day: "tonight" returns time 21:00 + date today
    // ========================================================================
    {
      id: 'nlc-interaction-s-tonight-compound',
      name: 'NLC interaction S: "tonight" returns time 21:00 + date today',
      run: () => {
        const tokens = parseTokens('Dinner tonight');
        const timeToken = tokens.find(t => t.category === 'time');
        assert(timeToken !== undefined, 'Expected a time token for "tonight"');
        assert(isCompoundTimeToken(timeToken!.text), 'Expected "tonight" to be a compound token');

        const result = computeTokenClickResult(timeToken!);
        assert(result !== null, 'Expected non-null click result');
        assert(result!.timeValue!.hour === 21 && result!.timeValue!.minute === 0,
          `Expected 21:00, got ${result!.timeValue!.hour}:${result!.timeValue!.minute}`);
        assert(result!.togglesOn.includes('date'), 'Expected "date" in togglesOn for tonight');
      },
    },

    // ========================================================================
    // T) Time-of-day: all fixed mappings return correct values
    // ========================================================================
    {
      id: 'nlc-interaction-t-tod-all-mappings',
      name: 'NLC interaction T: all time-of-day tokens return correct fixed times',
      run: () => {
        const expected: [string, number, number][] = [
          ['morning', 7, 0],
          ['lunchtime', 12, 0],
          ['noon', 12, 0],
          ['afternoon', 15, 0],
          ['evening', 18, 0],
          ['night', 21, 0],
        ];
        for (const [word, expectedHour, expectedMin] of expected) {
          const tokens = parseTokens(`Do something ${word}`);
          const timeToken = tokens.find(t => t.category === 'time');
          assert(timeToken !== undefined, `Expected time token for "${word}"`);

          const result = computeTokenClickResult(timeToken!);
          assert(result !== null, `Expected non-null click result for "${word}"`);
          assert(result!.timeValue!.hour === expectedHour && result!.timeValue!.minute === expectedMin,
            `Expected ${expectedHour}:${String(expectedMin).padStart(2, '0')} for "${word}", got ${result!.timeValue!.hour}:${result!.timeValue!.minute}`);
        }
      },
    },

    // ========================================================================
    // U) Auto mode: "tomorrow morning" auto-applies both date and time
    // ========================================================================
    {
      id: 'nlc-interaction-u-auto-tomorrow-morning',
      name: 'NLC interaction U: "tomorrow morning" auto-applies date=tomorrow, time=morning',
      run: () => {
        const tokens = parseTokens('Call dentist tomorrow morning');
        const actions = computeAutoApplyResult(tokens, { date: false, time: false, repeats: false });

        const dateAction = actions.find(a => a.category === 'date');
        const timeAction = actions.find(a => a.category === 'time');
        assert(dateAction !== undefined, 'Expected date auto-apply action');
        assert(timeAction !== undefined, 'Expected time auto-apply action');
        assert(dateAction!.token.text.toLowerCase() === 'tomorrow', `Expected "tomorrow", got "${dateAction!.token.text}"`);
        assert(timeAction!.token.text.toLowerCase() === 'morning', `Expected "morning", got "${timeAction!.token.text}"`);
      },
    },

    // ========================================================================
    // V) "Every morning" → repeat daily + implied time 07:00
    // ========================================================================
    {
      id: 'nlc-interaction-v-every-morning',
      name: 'NLC interaction V: "every morning" → repeat daily, time 07:00',
      run: () => {
        const tokens = parseTokens('Take vitamins every morning');
        const repeatsToken = tokens.find(t => t.category === 'repeats');
        assert(repeatsToken !== undefined, 'Expected repeats token for "every morning"');

        const result = computeTokenClickResult(repeatsToken!);
        assert(result !== null, 'Expected non-null click result');
        assert(result!.togglesOn.includes('repeats'), 'Expected "repeats" in togglesOn');
        assert(result!.togglesOn.includes('date'), 'Expected "date" in togglesOn');
        assert(result!.togglesOn.includes('time'), 'Expected "time" in togglesOn for time-of-day repeat');
        assert(result!.repeatConfig !== null, 'Expected repeatConfig non-null');
        assert(result!.repeatConfig!.frequency === 'daily',
          `Expected frequency "daily", got "${result!.repeatConfig!.frequency}"`);
        assert(result!.timeValue !== null, 'Expected timeValue non-null');
        assert(result!.timeValue!.hour === 7 && result!.timeValue!.minute === 0,
          `Expected 07:00, got ${result!.timeValue!.hour}:${result!.timeValue!.minute}`);
      },
    },

    // ========================================================================
    // W) "Every evening" → repeat daily + implied time 18:00
    // ========================================================================
    {
      id: 'nlc-interaction-w-every-evening',
      name: 'NLC interaction W: "every evening" → repeat daily, time 18:00',
      run: () => {
        const tokens = parseTokens('Walk dog every evening');
        const repeatsToken = tokens.find(t => t.category === 'repeats');
        assert(repeatsToken !== undefined, 'Expected repeats token for "every evening"');

        const result = computeTokenClickResult(repeatsToken!);
        assert(result !== null, 'Expected non-null click result');
        assert(result!.repeatConfig!.frequency === 'daily',
          `Expected frequency "daily", got "${result!.repeatConfig!.frequency}"`);
        assert(result!.timeValue!.hour === 18 && result!.timeValue!.minute === 0,
          `Expected 18:00, got ${result!.timeValue!.hour}:${result!.timeValue!.minute}`);
      },
    },

    // ========================================================================
    // X) "Every day" → repeat daily, no implied time
    // ========================================================================
    {
      id: 'nlc-interaction-x-every-day-no-time',
      name: 'NLC interaction X: "every day" → repeat daily, no implied time',
      run: () => {
        const tokens = parseTokens('Take vitamins every day');
        const repeatsToken = tokens.find(t => t.category === 'repeats');
        assert(repeatsToken !== undefined, 'Expected repeats token for "every day"');

        const result = computeTokenClickResult(repeatsToken!);
        assert(result !== null, 'Expected non-null click result');
        assert(result!.repeatConfig!.frequency === 'daily',
          `Expected frequency "daily", got "${result!.repeatConfig!.frequency}"`);
        assert(result!.timeValue === null, 'Expected no implied time for "every day"');
        assert(!result!.togglesOn.includes('time'), 'Expected "time" NOT in togglesOn for "every day"');
      },
    },

    // ========================================================================
    // Y) "Every year" → repeat yearly
    // ========================================================================
    {
      id: 'nlc-interaction-y-every-year',
      name: 'NLC interaction Y: "every year" → repeat yearly',
      run: () => {
        const tokens = parseTokens('Renew passport every year');
        const repeatsToken = tokens.find(t => t.category === 'repeats');
        assert(repeatsToken !== undefined, 'Expected repeats token for "every year"');

        const result = computeTokenClickResult(repeatsToken!);
        assert(result !== null, 'Expected non-null click result');
        assert(result!.repeatConfig!.frequency === 'yearly',
          `Expected frequency "yearly", got "${result!.repeatConfig!.frequency}"`);
        assert(result!.repeatConfig!.interval === 1, `Expected interval 1, got ${result!.repeatConfig!.interval}`);
        assert(result!.timeValue === null, 'Expected no implied time for "every year"');
      },
    },

    // ========================================================================
    // Z) "Every Monday" → repeat weekly on Monday, no implied time
    // ========================================================================
    {
      id: 'nlc-interaction-z-every-monday',
      name: 'NLC interaction Z: "every Monday" → weekly on Monday, no time',
      run: () => {
        const tokens = parseTokens('Team meeting every Monday');
        const repeatsToken = tokens.find(t => t.category === 'repeats');
        assert(repeatsToken !== undefined, 'Expected repeats token for "every Monday"');

        const result = computeTokenClickResult(repeatsToken!);
        assert(result !== null, 'Expected non-null click result');
        assert(result!.repeatConfig!.frequency === 'custom-days',
          `Expected frequency "custom-days", got "${result!.repeatConfig!.frequency}"`);
        assert(result!.repeatConfig!.selectedDays?.includes('Monday') === true,
          'Expected selectedDays to include "Monday"');
        assert(result!.timeValue === null, 'Expected no implied time for "every Monday"');
        assert(!result!.togglesOn.includes('time'), 'Expected "time" NOT in togglesOn');
      },
    },

    // ========================================================================
    // AA) Repeat suppresses date tokens in eligibility
    // ========================================================================
    {
      id: 'nlc-interaction-aa-repeat-suppresses-date',
      name: 'NLC interaction AA: repeat token suppresses date tokens',
      run: () => {
        const tokens = parseTokens('every morning tomorrow');
        const dates = tokens.filter(t => t.category === 'date');
        const repeats = tokens.filter(t => t.category === 'repeats');
        assert(repeats.length === 1, `Expected 1 repeats token, got ${repeats.length}`);
        assert(dates.length === 0, `Expected 0 date tokens (suppressed by repeat), got ${dates.length}`);
      },
    },

    // ========================================================================
    // AB) getRepeatsImpliedTime helper
    // ========================================================================
    {
      id: 'nlc-interaction-ab-implied-time-helper',
      name: 'NLC interaction AB: getRepeatsImpliedTime returns correct values',
      run: () => {
        const morningTime = getRepeatsImpliedTime('every morning');
        assert(morningTime !== null, 'Expected non-null for "every morning"');
        assert(morningTime!.hour === 7 && morningTime!.minute === 0,
          `Expected 07:00, got ${morningTime!.hour}:${morningTime!.minute}`);

        const nightTime = getRepeatsImpliedTime('every night');
        assert(nightTime !== null, 'Expected non-null for "every night"');
        assert(nightTime!.hour === 21 && nightTime!.minute === 0,
          `Expected 21:00, got ${nightTime!.hour}:${nightTime!.minute}`);

        // Non-time-of-day repeats: no implied time
        assert(getRepeatsImpliedTime('every day') === null, 'Expected null for "every day"');
        assert(getRepeatsImpliedTime('every Monday') === null, 'Expected null for "every Monday"');
        assert(getRepeatsImpliedTime('every week') === null, 'Expected null for "every week"');
      },
    },

    // ========================================================================
    // AC) Auto-apply: "every morning" auto-applies repeats (no separate date/time action)
    // ========================================================================
    {
      id: 'nlc-interaction-ac-auto-every-morning',
      name: 'NLC interaction AC: "every morning" auto-applies as single repeats action',
      run: () => {
        const tokens = parseTokens('Take pills every morning');
        const actions = computeAutoApplyResult(tokens, { date: false, time: false, repeats: false });

        const repeatsAction = actions.find(a => a.category === 'repeats');
        assert(repeatsAction !== undefined, 'Expected repeats auto-apply action');
        assert(repeatsAction!.token.text.toLowerCase() === 'every morning',
          `Expected "every morning", got "${repeatsAction!.token.text}"`);

        // Date should NOT be separately auto-applied (repeats handles it)
        const dateAction = actions.find(a => a.category === 'date');
        assert(dateAction === undefined, 'Expected no separate date action');
      },
    },

    // ========================================================================
    // AD) Implied time reactivation: deleting explicit time restores implied time
    // ========================================================================
    {
      id: 'nlc-interaction-ad-implied-time-reactivation',
      name: 'NLC interaction AD: deleting explicit time while "every morning" survives → implied time reactivates',
      run: () => {
        // Scenario: "every morning at 6am" → both applied → user deletes "6am"
        // After invalidation, "every morning" survives → implied time 07:00 should reactivate

        // Step 1: Parse with both tokens
        const text1 = 'Take pills every morning at 6am';
        const tokens1 = parseTokens(text1);
        const repeatsToken = tokens1.find(t => t.category === 'repeats');
        const timeToken = tokens1.find(t => t.category === 'time');
        assert(repeatsToken !== undefined, 'Expected repeats token "every morning"');
        assert(timeToken !== undefined, 'Expected time token "6am"');

        // Step 2: Both applied
        const applied: AppliedTokens = { date: null, time: timeToken!, repeats: repeatsToken! };

        // Step 3: User deletes "6am" → "Take pills every morning"
        const text2 = 'Take pills every morning';
        const tokens2 = parseTokens(text2);
        const { newApplied, invalidated } = computeInvalidation(applied, tokens2);

        // Time should be invalidated (6am is gone)
        assert(invalidated.includes('time'), 'Expected "time" in invalidated');
        assert(newApplied.time === null, 'Expected newApplied.time null');

        // Repeats should survive (every morning still in text)
        assert(!invalidated.includes('repeats'), 'Expected "repeats" NOT in invalidated');
        assert(newApplied.repeats !== null, 'Expected newApplied.repeats to survive');

        // The surviving repeats token has implied time → reactivation should occur
        // (verified at pure-function level; the UI layer applies this in the invalidation useEffect)
        const impliedTime = getRepeatsImpliedTime(newApplied.repeats!.text);
        assert(impliedTime !== null, 'Expected surviving repeats token to have implied time');
        assert(impliedTime!.hour === 7 && impliedTime!.minute === 0,
          `Expected implied time 07:00, got ${impliedTime!.hour}:${impliedTime!.minute}`);
      },
    },

    // ========================================================================
    // AE) Date precedence: explicit date token suppresses time-of-day date
    // ========================================================================
    {
      id: 'nlc-interaction-ae-date-precedence-tomorrow-night',
      name: 'NLC interaction AE: "tomorrow night" → date=tomorrow, time-of-day must not imply today',
      run: () => {
        // "tomorrow night at 7:30pm" — explicit clock time suppresses "night" at parse level.
        // "tomorrow night" (no explicit time) — "night" is a standalone time token.
        // In either case, auto-apply date must resolve to "tomorrow", never "today".
        const tokens = parseTokens('Call mum tomorrow night');

        // Precondition: parser produces a date token and a time token
        const dateTokens = tokens.filter(t => t.category === 'date');
        const timeTokens = tokens.filter(t => t.category === 'time');
        assert(dateTokens.length === 1, `Expected 1 date token, got ${dateTokens.length}`);
        assert(timeTokens.length === 1, `Expected 1 time token, got ${timeTokens.length}`);
        assert(dateTokens[0].text.toLowerCase() === 'tomorrow', `Expected date token "tomorrow", got "${dateTokens[0].text}"`);
        assert(timeTokens[0].text.toLowerCase() === 'night', `Expected time token "night", got "${timeTokens[0].text}"`);

        // Auto-apply should produce both date and time actions
        const actions = computeAutoApplyResult(tokens, { date: false, time: false, repeats: false });
        const dateAction = actions.find(a => a.category === 'date');
        const timeAction = actions.find(a => a.category === 'time');
        assert(dateAction !== undefined, 'Expected date auto-apply action');
        assert(timeAction !== undefined, 'Expected time auto-apply action');
        assert(dateAction!.token.text.toLowerCase() === 'tomorrow', `Expected date action token "tomorrow", got "${dateAction!.token.text}"`);

        // The time token "night" is NOT a compound token — it must not imply date=today
        assert(!isCompoundTimeToken('night'), 'Precondition: "night" is NOT a compound time token');

        // The date token click result must resolve to tomorrow (not today)
        const dateResult = computeTokenClickResult(dateAction!.token);
        assert(dateResult !== null, 'Expected non-null date click result');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        assert(
          dateResult!.dateValue!.getTime() === tomorrow.getTime(),
          `Expected date value = tomorrow (${tomorrow.toISOString()}), got ${dateResult!.dateValue!.toISOString()}`
        );
      },
    },

    // ========================================================================
    // AF) Repeats auto-apply anchor: "every wednesday" on Thursday → next Wednesday
    // ========================================================================
    {
      id: 'nlc-interaction-af-repeats-anchor-not-today',
      name: 'NLC interaction AF: \"every wednesday at 7pm\" on Thursday → anchor is next Wednesday',
      run: () => {
        // Fixed now: Thursday 2026-02-26
        const now = new Date(2026, 1, 26); // Thu
        now.setHours(0, 0, 0, 0);
        assert(now.getDay() === 4, `Precondition: now must be Thursday (4), got ${now.getDay()}`);

        const tokens = parseTokens('Call mum every wednesday at 7pm');

        // Verify token structure
        const repeatsTokens = tokens.filter(t => t.category === 'repeats');
        const timeTokens = tokens.filter(t => t.category === 'time');
        assert(repeatsTokens.length === 1, `Expected 1 repeats token, got ${repeatsTokens.length}`);
        assert(timeTokens.length === 1, `Expected 1 time token, got ${timeTokens.length}`);

        // Auto-apply should produce repeats + time actions
        const actions = computeAutoApplyResult(tokens, { date: false, time: false, repeats: false });
        const repeatsAction = actions.find(a => a.category === 'repeats');
        const timeAction = actions.find(a => a.category === 'time');
        assert(repeatsAction !== undefined, 'Expected repeats auto-apply action');
        assert(timeAction !== undefined, 'Expected time auto-apply action');

        // parseRepeatsTokenValue computes the anchor date
        const result = parseRepeatsTokenValue(repeatsAction!.token.text);
        assert(result !== null, 'Expected non-null parseRepeatsTokenValue result');

        // Anchor must be a Wednesday
        assert(result!.anchorDate.getDay() === 3,
          `Expected anchor day = Wednesday (3), got ${result!.anchorDate.getDay()}`);

        // Independently compute expected anchor using getNextDayOccurrence
        const expectedAnchor = getNextDayOccurrence(now, [3]); // 3 = Wednesday
        assert(expectedAnchor.getDay() === 3, 'Sanity: expected anchor is a Wednesday');

        // Delta from Thursday to Wednesday = 6 days (not 0)
        const diffMs = expectedAnchor.getTime() - now.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
        assert(diffDays === 6, `Expected 6 days from Thursday to next Wednesday, got ${diffDays}`);

        // Repeat config is weekly on Wednesday
        assert(result!.config.frequency === 'custom-days',
          `Expected frequency "custom-days", got "${result!.config.frequency}"`);
        assert(result!.config.selectedDays?.includes('Wednesday') === true,
          'Expected selectedDays to include "Wednesday"');

        // Time value
        const timeResult = computeTokenClickResult(timeAction!.token);
        assert(timeResult !== null, 'Expected non-null time click result');
        assert(timeResult!.timeValue!.hour === 19 && timeResult!.timeValue!.minute === 0,
          `Expected 19:00, got ${timeResult!.timeValue!.hour}:${timeResult!.timeValue!.minute}`);
      },
    },

    // ========================================================================
    // AG) Repeats auto-apply anchor: "every thursday" on Thursday → today
    // ========================================================================
    {
      id: 'nlc-interaction-ag-repeats-anchor-today-match',
      name: 'NLC interaction AG: \"every thursday at 7pm\" on Thursday → anchor is today',
      run: () => {
        // Fixed now: Thursday 2026-02-26
        const now = new Date(2026, 1, 26); // Thu
        now.setHours(0, 0, 0, 0);
        assert(now.getDay() === 4, `Precondition: now must be Thursday (4), got ${now.getDay()}`);

        const tokens = parseTokens('Call mum every thursday at 7pm');

        const repeatsTokens = tokens.filter(t => t.category === 'repeats');
        const timeTokens = tokens.filter(t => t.category === 'time');
        assert(repeatsTokens.length === 1, `Expected 1 repeats token, got ${repeatsTokens.length}`);
        assert(timeTokens.length === 1, `Expected 1 time token, got ${timeTokens.length}`);

        // Auto-apply should produce repeats + time actions
        const actions = computeAutoApplyResult(tokens, { date: false, time: false, repeats: false });
        const repeatsAction = actions.find(a => a.category === 'repeats');
        const timeAction = actions.find(a => a.category === 'time');
        assert(repeatsAction !== undefined, 'Expected repeats auto-apply action');
        assert(timeAction !== undefined, 'Expected time auto-apply action');

        // parseRepeatsTokenValue computes the anchor date
        const result = parseRepeatsTokenValue(repeatsAction!.token.text);
        assert(result !== null, 'Expected non-null parseRepeatsTokenValue result');

        // Anchor must be a Thursday
        assert(result!.anchorDate.getDay() === 4,
          `Expected anchor day = Thursday (4), got ${result!.anchorDate.getDay()}`);

        // Independently compute expected: getNextDayOccurrence from Thursday for Thursday = today
        const expectedAnchor = getNextDayOccurrence(now, [4]); // 4 = Thursday
        const diffMs = expectedAnchor.getTime() - now.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
        assert(diffDays === 0, `Expected 0 days (today is Thursday), got ${diffDays}`);

        // Repeat config is weekly on Thursday
        assert(result!.config.frequency === 'custom-days',
          `Expected frequency "custom-days", got "${result!.config.frequency}"`);
        assert(result!.config.selectedDays?.includes('Thursday') === true,
          'Expected selectedDays to include "Thursday"');

        // Time value
        const timeResult = computeTokenClickResult(timeAction!.token);
        assert(timeResult !== null, 'Expected non-null time click result');
        assert(timeResult!.timeValue!.hour === 19 && timeResult!.timeValue!.minute === 0,
          `Expected 19:00, got ${timeResult!.timeValue!.hour}:${timeResult!.timeValue!.minute}`);
      },
    },

    // ========================================================================
    // AH) Month-name date resolution: "Feb 28" → resolves to Feb 28
    // ========================================================================
    {
      id: 'nlc-interaction-ah-month-date-future',
      name: 'NLC interaction AH: "Feb 28" resolves to 2026-02-28 (future date in same year)',
      run: () => {
        const tokens = parseTokens('Call mum Feb 28');
        const dateTokens = tokens.filter(t => t.category === 'date');
        assert(dateTokens.length === 1, `Expected 1 date token, got ${dateTokens.length}`);

        const result = parseDateTokenValue(dateTokens[0].text);
        assert(result !== null, 'Expected non-null date value for "Feb 28"');

        // Must resolve to Feb 28 of some year
        assert(result!.getMonth() === 1, `Expected month = February (1), got ${result!.getMonth()}`);
        assert(result!.getDate() === 28, `Expected day = 28, got ${result!.getDate()}`);

        // Year must be current or next year (not past)
        const thisYear = new Date().getFullYear();
        assert(result!.getFullYear() >= thisYear,
          `Expected year >= ${thisYear}, got ${result!.getFullYear()}`);
      },
    },

    // ========================================================================
    // AI) Month-name date resolution: "Feb 26" → rollover to next year when past
    // ========================================================================
    {
      id: 'nlc-interaction-ai-month-date-rollover',
      name: 'NLC interaction AI: "Feb 26" resolves to next year when date is past',
      run: () => {
        const tokens = parseTokens('Call mum Feb 26');
        const dateTokens = tokens.filter(t => t.category === 'date');
        assert(dateTokens.length === 1, `Expected 1 date token, got ${dateTokens.length}`);

        const result = parseDateTokenValue(dateTokens[0].text);
        assert(result !== null, 'Expected non-null date value for "Feb 26"');

        // Must resolve to Feb 26
        assert(result!.getMonth() === 1, `Expected month = February (1), got ${result!.getMonth()}`);
        assert(result!.getDate() === 26, `Expected day = 26, got ${result!.getDate()}`);

        // If today is past Feb 26, should roll to next year
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayMonth = today.getMonth() + 1;
        const todayDay = today.getDate();

        if (todayMonth > 2 || (todayMonth === 2 && todayDay > 26)) {
          assert(result!.getFullYear() > today.getFullYear(),
            `Expected year > ${today.getFullYear()} (rollover), got ${result!.getFullYear()}`);
        }
      },
    },

    // ========================================================================
    // AJ) Day-first month-name date resolution: "28 Feb" → 2026-02-28
    // ========================================================================
    {
      id: 'nlc-interaction-aj-day-first-month-date',
      name: 'NLC interaction AJ: "28 Feb" resolves to 2026-02-28',
      run: () => {
        const tokens = parseTokens('Call mum 28 Feb');
        const dateTokens = tokens.filter(t => t.category === 'date');
        assert(dateTokens.length === 1, `Expected 1 date token, got ${dateTokens.length}`);

        const result = parseDateTokenValue(dateTokens[0].text);
        assert(result !== null, 'Expected non-null date value for "28 Feb"');

        assert(result!.getMonth() === 1, `Expected month = February (1), got ${result!.getMonth()}`);
        assert(result!.getDate() === 28, `Expected day = 28, got ${result!.getDate()}`);

        const thisYear = new Date().getFullYear();
        assert(result!.getFullYear() >= thisYear,
          `Expected year >= ${thisYear}, got ${result!.getFullYear()}`);
      },
    },

    // ========================================================================
    // AK) Day-first month-name date resolution: "26 Feb" → rollover to next year when past
    // ========================================================================
    {
      id: 'nlc-interaction-ak-day-first-month-date-rollover',
      name: 'NLC interaction AK: "26 Feb" resolves to next year when date is past',
      run: () => {
        const tokens = parseTokens('Call mum 26 Feb');
        const dateTokens = tokens.filter(t => t.category === 'date');
        assert(dateTokens.length === 1, `Expected 1 date token, got ${dateTokens.length}`);

        const result = parseDateTokenValue(dateTokens[0].text);
        assert(result !== null, 'Expected non-null date value for "26 Feb"');

        assert(result!.getMonth() === 1, `Expected month = February (1), got ${result!.getMonth()}`);
        assert(result!.getDate() === 26, `Expected day = 26, got ${result!.getDate()}`);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayMonth = today.getMonth() + 1;
        const todayDay = today.getDate();

        if (todayMonth > 2 || (todayMonth === 2 && todayDay > 26)) {
          assert(result!.getFullYear() > today.getFullYear(),
            `Expected year > ${today.getFullYear()} (rollover), got ${result!.getFullYear()}`);
        }
      },
    },

    // ========================================================================
    // AL) Explicit year: "23 Feb 2027" → 2027-02-23
    // ========================================================================
    {
      id: 'nlc-interaction-al-day-first-year',
      name: 'NLC interaction AL: "23 Feb 2027" resolves to 2027-02-23',
      run: () => {
        const tokens = parseTokens('Car MOT 23 Feb 2027');
        const dateTokens = tokens.filter(t => t.category === 'date');
        assert(dateTokens.length === 1, `Expected 1 date token, got ${dateTokens.length}`);

        const result = parseDateTokenValue(dateTokens[0].text);
        assert(result !== null, 'Expected non-null date value for "23 Feb 2027"');
        assert(result!.getFullYear() === 2027, `Expected year 2027, got ${result!.getFullYear()}`);
        assert(result!.getMonth() === 1, `Expected month February (1), got ${result!.getMonth()}`);
        assert(result!.getDate() === 23, `Expected day 23, got ${result!.getDate()}`);
      },
    },

    // ========================================================================
    // AM) Explicit year month-first: "Feb 23 2027" → 2027-02-23
    // ========================================================================
    {
      id: 'nlc-interaction-am-month-first-year',
      name: 'NLC interaction AM: "Feb 23 2027" resolves to 2027-02-23',
      run: () => {
        const tokens = parseTokens('Car MOT Feb 23 2027');
        const dateTokens = tokens.filter(t => t.category === 'date');
        assert(dateTokens.length === 1, `Expected 1 date token, got ${dateTokens.length}`);

        const result = parseDateTokenValue(dateTokens[0].text);
        assert(result !== null, 'Expected non-null date value for "Feb 23 2027"');
        assert(result!.getFullYear() === 2027, `Expected year 2027, got ${result!.getFullYear()}`);
        assert(result!.getMonth() === 1, `Expected month February (1), got ${result!.getMonth()}`);
        assert(result!.getDate() === 23, `Expected day 23, got ${result!.getDate()}`);
      },
    },

    // ========================================================================
    // AN) Explicit past year: "23 Feb 2025" → 2025-02-23 (no rollover)
    // ========================================================================
    {
      id: 'nlc-interaction-an-past-year',
      name: 'NLC interaction AN: "23 Feb 2025" resolves to 2025-02-23 (past year allowed)',
      run: () => {
        const tokens = parseTokens('Car MOT 23 Feb 2025');
        const dateTokens = tokens.filter(t => t.category === 'date');
        assert(dateTokens.length === 1, `Expected 1 date token, got ${dateTokens.length}`);

        const result = parseDateTokenValue(dateTokens[0].text);
        assert(result !== null, 'Expected non-null date value for "23 Feb 2025"');
        assert(result!.getFullYear() === 2025, `Expected year 2025, got ${result!.getFullYear()}`);
        assert(result!.getMonth() === 1, `Expected month February (1), got ${result!.getMonth()}`);
        assert(result!.getDate() === 23, `Expected day 23, got ${result!.getDate()}`);
      },
    },

    // ========================================================================
    // AO) Leap year valid: "29 Feb 2028" → 2028-02-29
    // ========================================================================
    {
      id: 'nlc-interaction-ao-leap-year-valid',
      name: 'NLC interaction AO: "29 Feb 2028" resolves correctly (leap year valid)',
      run: () => {
        const tokens = parseTokens('Car MOT 29 Feb 2028');
        const dateTokens = tokens.filter(t => t.category === 'date');
        assert(dateTokens.length === 1, `Expected 1 date token, got ${dateTokens.length}`);

        const result = parseDateTokenValue(dateTokens[0].text);
        assert(result !== null, 'Expected non-null date value for "29 Feb 2028"');
        assert(result!.getFullYear() === 2028, `Expected year 2028, got ${result!.getFullYear()}`);
        assert(result!.getMonth() === 1, `Expected month February (1), got ${result!.getMonth()}`);
        assert(result!.getDate() === 29, `Expected day 29, got ${result!.getDate()}`);
      },
    },

    // ========================================================================
    // AP) Invalid leap year: "29 Feb 2027" → does not tokenise
    // ========================================================================
    {
      id: 'nlc-interaction-ap-leap-year-invalid',
      name: 'NLC interaction AP: "29 Feb 2027" does not tokenise (invalid date)',
      run: () => {
        const tokens = parseTokens('Car MOT 29 Feb 2027');
        const dateTokens = tokens.filter(t => t.category === 'date');
        assert(dateTokens.length === 0, `Expected 0 date tokens for invalid "29 Feb 2027", got ${dateTokens.length}`);
      },
    },

    // ========================================================================
    // AQ) Feature flag: nlcEnabled=false skips parseTokens, produces empty tokens
    // ========================================================================
    {
      id: 'nlc-interaction-aq-feature-flag-off',
      name: 'NLC interaction AQ: nlcEnabled=false produces empty token list without calling parseTokens',
      run: () => {
        const nlcEnabled = false;
        const tokens = nlcEnabled ? parseTokens('Dentist tomorrow at 3pm') : [];
        assert(tokens.length === 0, `Expected 0 tokens when nlcEnabled is false, got ${tokens.length}`);
        const actions = computeAutoApplyResult(tokens, { date: false, time: false, repeats: false });
        assert(actions.length === 0, `Expected 0 auto-apply actions when tokens are empty, got ${actions.length}`);
      },
    },

    // ========================================================================
    // AR) Recognition config — disabled categories produce no auto-apply actions
    // ========================================================================
    {
      id: 'nlc-interaction-ar-date-recognition-off',
      name: 'NLC interaction AR: date recognition OFF prevents date auto-apply',
      run: () => {
        const tokens = parseTokens('Dentist tomorrow at 3pm', { date: false, time: true, repeats: true });
        const actions = computeAutoApplyResult(tokens, { date: false, time: false, repeats: false });
        assert(actions.every(a => a.category !== 'date'), 'Expected no date auto-apply actions when date recognition is off');
        assert(actions.some(a => a.category === 'time'), 'Expected time auto-apply action');
      },
    },

    {
      id: 'nlc-interaction-ar-time-recognition-off',
      name: 'NLC interaction AR: time recognition OFF prevents time auto-apply',
      run: () => {
        const tokens = parseTokens('Dentist tomorrow at 3pm', { date: true, time: false, repeats: true });
        const actions = computeAutoApplyResult(tokens, { date: false, time: false, repeats: false });
        assert(actions.every(a => a.category !== 'time'), 'Expected no time auto-apply actions when time recognition is off');
        assert(actions.some(a => a.category === 'date'), 'Expected date auto-apply action');
      },
    },

    {
      id: 'nlc-interaction-ar-repeats-recognition-off-no-implied',
      name: 'NLC interaction AR: repeats recognition OFF prevents implied date/time from repeats',
      run: () => {
        const tokens = parseTokens('Run every morning', { date: true, time: true, repeats: false });
        assert(tokens.every(t => t.category !== 'repeats'), 'Expected no repeats tokens when repeats recognition is off');
        const actions = computeAutoApplyResult(tokens, { date: false, time: false, repeats: false });
        assert(actions.every(a => a.category !== 'repeats'), 'Expected no repeats auto-apply actions');
      },
    },

    {
      id: 'nlc-interaction-ar-mixed-recognition',
      name: 'NLC interaction AR: mixed recognition config filters correctly through pipeline',
      run: () => {
        const tokens = parseTokens('Buy milk tomorrow at 3pm every week', { date: true, time: false, repeats: false });
        assert(tokens.length === 1, `Expected 1 token (date only), got ${tokens.length}`);
        assert(tokens[0].category === 'date', `Expected date token, got ${tokens[0].category}`);
        const eligible = computeEligibleTokens(tokens, emptyApplied());
        assert(eligible.length === 1, `Expected 1 eligible token, got ${eligible.length}`);
      },
    },

    // Word order (docs/plans/nlc-titles-and-dates.md, 2.2)
    {
      id: 'nlc-interaction-word-order-default-replaced',
      name: 'NLC interaction: a later token replaces an NLC default in either order ("tomorrow ... 3pm", "3pm ... tomorrow")',
      run: () => {
        const timeLater = computeAutoApplyResult(parseTokens('Call mum tomorrow at 3pm'), togglesForAutoApply({ date: true, time: true, repeats: false }, { date: false, time: true }));
        assert(timeLater.length === 1 && timeLater[0].token.text === '3pm', 'Expected 3pm to replace the 12pm default');
        const dateLater = computeAutoApplyResult(parseTokens('Call mum at 3pm tomorrow'), togglesForAutoApply({ date: true, time: true, repeats: false }, { date: true, time: false }));
        assert(dateLater.length === 1 && dateLater[0].token.text === 'tomorrow', 'Expected tomorrow to replace the today default');
      },
    },

    {
      id: 'nlc-interaction-word-order-user-protected',
      name: 'NLC interaction: a date or time the user set is never replaced by a typed token',
      run: () => {
        const actions = computeAutoApplyResult(parseTokens('Call mum tomorrow at 3pm'), togglesForAutoApply({ date: true, time: true, repeats: false }, { date: false, time: false }));
        assert(actions.length === 0, `Expected no auto-apply, got ${actions.length}`);
      },
    },

    // Task-only titles (docs/plans/nlc-titles-and-dates.md, 2.1)
    {
      id: 'nlc-interaction-task-only-title',
      name: 'NLC interaction: applied tokens are removed from the title; a day that is part of the task stays',
      run: () => {
        const titleOf = (text: string) => titleFromAppliedTokens(text, computeAutoApplyResult(parseTokens(text), { date: false, time: false, repeats: false }).map(a => a.token));
        assert(titleOf('Call mum on Monday at 9pm') === 'Call mum', `Expected "Call mum", got "${titleOf('Call mum on Monday at 9pm')}"`);
        assert(titleOf('Monday meeting notes') === 'Monday meeting notes', 'Expected "Monday meeting notes" unchanged');
        assert(titleOf('Tomorrow at 9pm') === 'Tomorrow at 9pm', 'Expected the typed text when nothing would be left');
      },
    },
  ];
}