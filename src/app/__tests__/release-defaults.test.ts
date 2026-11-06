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

  it('the Release build applies the approved defaults and nothing else', async () => {
    const dev = (await load(false)).SETTINGS_DEFAULTS
    const { SETTINGS_DEFAULTS, RELEASE_DEFAULT_OVERRIDES } = await load(true)
    const on = ['reminderly-ff-siri-reminders', 'reminderly-pref-siri-reminders', 'reminderly-ff-reminder-attachments', 'reminderly-ff-nlc', 'reminderly-pref-nlc', 'reminderly-ff-calendar', 'reminderly-ff-sounds', 'reminderly-ff-info-icons', 'reminderly-ff-date-presets', 'reminderly-ff-haptics']
    for (const k of on) expect(SETTINGS_DEFAULTS[k], k).toBe('true')
    expect(JSON.parse(SETTINGS_DEFAULTS['reminderly-pref-haptics']).allHaptics).toBe(true)
    const changed = Object.keys(SETTINGS_DEFAULTS).filter(k => SETTINGS_DEFAULTS[k] !== dev[k])
    expect(changed.sort()).toEqual(Object.keys(RELEASE_DEFAULT_OVERRIDES).sort())
  })

  it('every tutorial live page is on in Release', async () => {
    const { SETTINGS_DEFAULTS } = await load(true)
    const pages = Object.keys(SETTINGS_DEFAULTS).filter(k => k.includes('config-tutorial-') && k.includes('-page-'))
    expect(pages.length).toBe(17)
    for (const k of pages) expect(SETTINGS_DEFAULTS[k], k).toBe('true')
  })

  it('the Dev build is unchanged by the Release overrides', async () => {
    const { SETTINGS_DEFAULTS } = await load(false)
    expect(SETTINGS_DEFAULTS['reminderly-ff-reminder-attachments']).toBe('false')
    expect(SETTINGS_DEFAULTS['reminderly-ff-nlc']).toBe('false')
    expect(SETTINGS_DEFAULTS['reminderly-ff-calendar']).toBe('false')
    expect(JSON.parse(SETTINGS_DEFAULTS['reminderly-pref-haptics']).allHaptics).toBe(false)
  })

  it('Linked lists, default templates, paywall and feedback stay off in Release', async () => {
    const { SETTINGS_DEFAULTS } = await load(true)
    for (const k of ['reminderly-ff-linked-lists', 'reminderly-config-templates-in-clean-state', 'reminderly-ff-paywall', 'reminderly-ff-feedback']) expect(SETTINGS_DEFAULTS[k], k).toBe('false')
  })
})
