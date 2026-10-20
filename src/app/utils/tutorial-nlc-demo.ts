// Tutorial "Type it naturally" demo (docs/plans/onboarding-gaps.md, section 3). Runs the live NLC parser with the
// user's recognition settings, so the demo only shows what the New reminder editor would recognise.

import { parseTokens, type NlcRecognitionConfig, type ParsedToken } from './nlc-parser';
import { computeTokenClickResult } from './nlc-interaction';

// "tonight" is a time token that also sets the date to today; "tomorrow" is the fallback when time recognition is off
export const NLC_DEMO_TEXTS = ['Take the bins out tonight', 'Take the bins out tomorrow'] as const;

export type NlcTutorialDemo = {
  text: string;
  token: ParsedToken;
  date: Date | null;
  time: { hour: number; minute: number } | null;
};

/** The first demo text the live parser recognises with these settings, or null when neither is recognised. */
export function getNlcTutorialDemo(recognition: NlcRecognitionConfig): NlcTutorialDemo | null {
  for (const text of NLC_DEMO_TEXTS) {
    const tokens = parseTokens(text, recognition);
    if (tokens.length !== 1) continue;
    const result = computeTokenClickResult(tokens[0]);
    if (!result) continue;
    return { text, token: tokens[0], date: result.dateValue, time: result.timeValue };
  }
  return null;
}
