import { describe, it, expect, vi } from 'vitest'

async function load(isRelease: boolean) {
  vi.resetModules()
  vi.doMock('../config/build', () => ({ IS_RELEASE_BUILD: isRelease }))
  return import('../settings/keys')
}

describe('Release launch defaults', () => {
  it('the Dev build keeps the development defaults', async () => {
    const { SETTINGS_DEFAULTS } = await load(false)
    expect(SETTINGS_DEFAULTS['reminderly-ff-siri-reminders']).toBe('false')
  })

  it('the Release build applies only the decided overrides', async () => {
    const dev = (await load(false)).SETTINGS_DEFAULTS
    const { SETTINGS_DEFAULTS, RELEASE_DEFAULT_OVERRIDES } = await load(true)
    expect(SETTINGS_DEFAULTS['reminderly-ff-siri-reminders']).toBe('true')
    expect(SETTINGS_DEFAULTS['reminderly-pref-siri-reminders']).toBe('true')
    const changed = Object.keys(SETTINGS_DEFAULTS).filter(k => SETTINGS_DEFAULTS[k] !== dev[k])
    expect(changed.sort()).toEqual(Object.keys(RELEASE_DEFAULT_OVERRIDES).sort())
  })

  it('Linked lists stays off in Release', async () => {
    const { SETTINGS_DEFAULTS } = await load(true)
    expect(SETTINGS_DEFAULTS['reminderly-ff-linked-lists']).toBe('false')
  })
})
