import { describe, expect, it } from '@jest/globals'
import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'

import { DAppIcon, pickDAppIconUri } from '../../components/icons/DAppIcon'
import { FakeProviders } from '../../util/fake/FakeProviders'

describe('pickDAppIconUri', () => {
  it('returns undefined without icons', () => {
    expect(pickDAppIconUri(undefined)).toBeUndefined()
    expect(pickDAppIconUri([])).toBeUndefined()
  })

  it('takes the first raster icon', () => {
    expect(
      pickDAppIconUri([
        'https://dapp.example/a.png',
        'https://dapp.example/b.png'
      ])
    ).toBe('https://dapp.example/a.png')
  })

  it('skips svg icons, even with a query or fragment', () => {
    expect(
      pickDAppIconUri([
        'https://dapp.example/logo.svg',
        'https://dapp.example/logo.SVG?v=2',
        'https://dapp.example/logo.svg#mark',
        'https://dapp.example/logo.png'
      ])
    ).toBe('https://dapp.example/logo.png')
  })

  it('skips relative, empty, and non-http icons', () => {
    expect(
      pickDAppIconUri([
        '',
        '/favicon.png',
        'favicon.png',
        'ipfs://bafy/logo.png',
        'https:///logo.png'
      ])
    ).toBeUndefined()
  })

  it('accepts raster data uris but not svg ones', () => {
    expect(
      pickDAppIconUri([
        'data:image/svg+xml;base64,AAAA',
        'data:image/png;base64,AAAA'
      ])
    ).toBe('data:image/png;base64,AAAA')
  })

  it('keeps an svg-looking query on a raster path', () => {
    expect(pickDAppIconUri(['https://cdn.example/icon?format=.svg'])).toBe(
      'https://cdn.example/icon?format=.svg'
    )
  })
})

describe('DAppIcon', () => {
  it('shows the fallback without artwork', () => {
    const rendered = render(
      <FakeProviders>
        <DAppIcon />
      </FakeProviders>
    )
    expect(rendered.queryByTestId('dAppIconFallback')).not.toBeNull()
    expect(rendered.queryByTestId('dAppIconImage')).toBeNull()
    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })

  it('falls back when the artwork fails to load', () => {
    const uri = 'https://dapp.example/logo.png'
    const rendered = render(
      <FakeProviders>
        <DAppIcon uri={uri} />
      </FakeProviders>
    )
    fireEvent(rendered.getByTestId('dAppIconImage'), 'error')
    expect(rendered.queryByTestId('dAppIconFallback')).not.toBeNull()

    // New artwork gets its own chance to load:
    rendered.rerender(
      <FakeProviders>
        <DAppIcon uri="https://dapp.example/other.png" />
      </FakeProviders>
    )
    expect(rendered.queryByTestId('dAppIconImage')).not.toBeNull()
    rendered.unmount()
  })
})
