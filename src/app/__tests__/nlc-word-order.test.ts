import { describe, it, expect } from 'vitest';
import { parseTokens } from '../utils/nlc-parser';
import { computeAutoApplyResult, togglesForAutoApply, timeSetsToday } from '../utils/nlc-interaction';

// NLC word order, Stage 2 (docs/plans/nlc-titles-and-dates.md, 2.2 and condition 2): a row NLC filled in as a
// default can take a later token; rows set by the user or from a token are never overwritten.

const applied = (text: string, toggles: { date: boolean; time: boolean; repeats: boolean }, defaults: { date: boolean; time: boolean }) =>
  computeAutoApplyResult(parseTokens(text), togglesForAutoApply(toggles, defaults)).map((a) => `${a.category}:${a.token.text}`);

describe('togglesForAutoApply', () => {
  it('treats rows NLC defaulted as off and leaves the rest', () => {
    expect(togglesForAutoApply({ date: true, time: true, repeats: true }, { date: false, time: true })).toEqual({ date: true, time: false, repeats: true });
    expect(togglesForAutoApply({ date: true, time: true, repeats: false }, { date: true, time: false })).toEqual({ date: false, time: true, repeats: false });
    expect(togglesForAutoApply({ date: false, time: false, repeats: false }, { date: true, time: true })).toEqual({ date: false, time: false, repeats: false });
  });
});

describe('both typing orders (condition 2)', () => {
  it('"tomorrow", pause, "at 3pm": the 3pm replaces the 12pm default', () => {
    // After "tomorrow" applied: Date on from the token, Time on at the 12pm default
    expect(applied('Call mum tomorrow at 3pm', { date: true, time: true, repeats: false }, { date: false, time: true })).toEqual(['time:3pm']);
  });

  it('"at 3pm", pause, "tomorrow": tomorrow replaces the today default', () => {
    // After "3pm" applied: Time on from the token, Date on at the today default
    expect(applied('Call mum at 3pm tomorrow', { date: true, time: true, repeats: false }, { date: true, time: false })).toEqual(['date:tomorrow']);
  });

  it('typed in one go: both apply', () => {
    expect(applied('Call mum tomorrow at 3pm', { date: false, time: false, repeats: false }, { date: false, time: false })).toEqual(['date:tomorrow', 'time:3pm']);
  });

  it('"tomorrow morning": morning replaces the 12pm default', () => {
    expect(applied('Call mum tomorrow morning', { date: true, time: true, repeats: false }, { date: false, time: true })).toEqual(['time:morning']);
  });

  it('"every morning at 6am": 6am replaces the implied 7am', () => {
    expect(applied('Gym every morning at 6am', { date: true, time: true, repeats: true }, { date: false, time: true })).toEqual(['time:6am']);
  });

  it('"at 9am every Monday": the repeat can still anchor the date', () => {
    expect(applied('Gym at 9am every Monday', { date: true, time: true, repeats: false }, { date: true, time: false })).toEqual(['repeats:every Monday']);
  });
});

describe('protected values (condition 2)', () => {
  it('a time the user set is not replaced by a typed time', () => {
    expect(applied('Call mum tomorrow at 3pm', { date: true, time: true, repeats: false }, { date: false, time: false })).toEqual([]);
  });

  it('a date the user set is not replaced by a typed date', () => {
    expect(applied('Call mum at 3pm tomorrow', { date: true, time: true, repeats: false }, { date: false, time: false })).toEqual([]);
  });

  it('two tokens in a category stay ambiguous, default or not', () => {
    expect(applied('Call mum tomorrow at 3pm or 4pm', { date: true, time: true, repeats: false }, { date: false, time: true })).toEqual([]);
  });
});

// Click mode (Tap highlighted words on): each highlighted token is tapped separately (John, 24 Oct; Kai approved)
describe('click mode applies each token separately', () => {
  it('tapping a time with Date off sets today, even with an untapped date token', () => {
    expect(timeSetsToday('click', { isDateOn: false, hasDateToken: true, isCompound: false })).toBe(true);
    expect(timeSetsToday('click', { isDateOn: true, hasDateToken: true, isCompound: true })).toBe(false);
  });

  it('auto mode is unchanged: a date token in the text applies itself', () => {
    expect(timeSetsToday('auto', { isDateOn: false, hasDateToken: true, isCompound: false })).toBe(false);
    expect(timeSetsToday('auto', { isDateOn: false, hasDateToken: false, isCompound: false })).toBe(true);
    expect(timeSetsToday('auto', { isDateOn: true, hasDateToken: false, isCompound: true })).toBe(true);
    expect(timeSetsToday('auto', { isDateOn: true, hasDateToken: false, isCompound: false })).toBe(false);
  });
});
