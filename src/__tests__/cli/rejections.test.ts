import { describe, expect, it, jest } from '@jest/globals'

import { logUnhandledRejection } from '../../cli/engine/rejections'

describe('logUnhandledRejection', () => {
  it('logs the stack of an Error and the text of anything else', () => {
    const logged: Array<[string, unknown]> = []
    const lines: string[] = []
    const handle = logUnhandledRejection(
      { error: (message, extra) => logged.push([message, extra]) },
      line => lines.push(line)
    )
    const error = new Error('Unauthorized: You must authenticate')
    handle(error)
    handle('plain text')
    handle({ code: -32000 })
    handle(undefined)
    expect(lines[0]).toContain(
      'Unhandled promise rejection: Error: Unauthorized'
    )
    expect(lines.slice(1)).toEqual([
      '[edge-engine] Unhandled promise rejection: plain text',
      '[edge-engine] Unhandled promise rejection: {"code":-32000}',
      '[edge-engine] Unhandled promise rejection: undefined'
    ])
    expect(logged[0]).toEqual([
      'Unhandled promise rejection',
      { error: error.stack }
    ])
    const noStack = new Error('bare')
    noStack.stack = undefined
    handle(noStack)
    expect(lines[4]).toBe('[edge-engine] Unhandled promise rejection: bare')
  })

  it('survives a logger that throws', () => {
    const lines: string[] = []
    const handle = logUnhandledRejection(
      {
        error: () => {
          throw new Error('disk full')
        }
      },
      line => lines.push(line)
    )
    expect(() => {
      handle(new Error('x'))
    }).not.toThrow()
    expect(lines).toHaveLength(1)
  })

  it('writes to stderr by default', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    try {
      logUnhandledRejection({ error: () => {} })('late failure')
      expect(spy).toHaveBeenCalledWith(
        '[edge-engine] Unhandled promise rejection: late failure'
      )
    } finally {
      spy.mockRestore()
    }
  })
})
