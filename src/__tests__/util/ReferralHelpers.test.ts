import { describe, expect, it } from '@jest/globals'

import type { AccountReferral, Promotion } from '../../types/ReferralTypes'
import type { PluginTweak } from '../../types/TweakTypes'
import { bestOfPlugins } from '../../util/ReferralHelpers'

const now = new Date('2026-09-24T12:00:00Z')

const tweak = (
  pluginId: string,
  extra: Partial<PluginTweak> = {}
): PluginTweak => ({
  pluginId,
  disabled: false,
  startDate: new Date('2026-09-20T00:00:00Z'),
  durationDays: 14,
  ...extra
})

const promo = (installerId: string, plugins: PluginTweak[]): Promotion => ({
  installerId,
  hiddenMessages: {},
  messages: [],
  plugins
})

const referral = (promotions: Promotion[]): AccountReferral => ({
  promotions,
  ignoreAccountSwap: false,
  hiddenAccountMessages: {},
  activePromotions: []
})

describe('bestOfPlugins', () => {
  it('lets a promotion outrank the preferred exchange from the settings', () => {
    const out = bestOfPlugins(
      [],
      referral([
        promo('nexchange_test', [tweak('nexchange', { preferredSwap: true })])
      ]),
      'changenow',
      now
    )
    expect(out.preferredSwapPluginId).toBe('nexchange')
  })

  it('reports the promotion as the source when it only sets an exchange preference', () => {
    const out = bestOfPlugins(
      [],
      referral([
        promo('nexchange_test', [tweak('nexchange', { preferredSwap: true })])
      ]),
      'changenow',
      now
    )
    expect(out.swapSource).toEqual({
      type: 'promotion',
      installerId: 'nexchange_test'
    })
  })

  it('still reports the promotion when it sets both preferences', () => {
    const out = bestOfPlugins(
      [],
      referral([
        promo('nexchange_test', [
          tweak('nexchange', { preferredSwap: true, preferredFiat: true })
        ])
      ]),
      undefined,
      now
    )
    expect(out.preferredSwapPluginId).toBe('nexchange')
    expect(out.swapSource).toEqual({
      type: 'promotion',
      installerId: 'nexchange_test'
    })
  })

  it('does not blame a promotion that sets no exchange preference', () => {
    // A buy/sell-only promotion, with nothing else preferring an exchange:
    // undefined equals undefined, so the gate needs its second test.
    const out = bestOfPlugins(
      [],
      referral([
        promo('moonpay_promo', [tweak('moonpay', { preferredFiat: true })])
      ]),
      undefined,
      now
    )
    expect(out.preferredSwapPluginId).toBeUndefined()
    expect(out.swapSource.type).not.toBe('promotion')
  })

  it('ignores an expired promotion entirely', () => {
    const stale = tweak('nexchange', {
      preferredSwap: true,
      startDate: new Date('2026-08-01T00:00:00Z'),
      durationDays: 7
    })
    const out = bestOfPlugins(
      [],
      referral([promo('old_promo', [stale])]),
      'changenow',
      now
    )
    expect(out.preferredSwapPluginId).toBe('changenow')
    expect(out.swapSource.type).not.toBe('promotion')
  })
})
