import { readStoredBool } from "../settings/useStoredSetting";

export function isListsEnabled(): boolean {
  return readStoredBool("reminderly-ff-lists");
}
