export interface ClaudeUsage {
  calls: number
  inputTokens: number
  outputTokens: number
  cacheCreationTokens: number
  cacheReadTokens: number
}

export interface JevUsage {
  calls: number
  inputTokens: number
  outputTokens: number
}

/**
 * Accumulates token usage for one script run.
 * Claude usage is kept per model, and Jev usage is kept apart from it,
 * so the end-of-run line can report the two separately.
 */
export class TokenLedger {
  readonly claude = new Map<string, ClaudeUsage>()
  readonly jev: JevUsage = { calls: 0, inputTokens: 0, outputTokens: 0 }

  addClaude(model: string, usage: Omit<ClaudeUsage, 'calls'>): void {
    const total = this.claude.get(model) ?? emptyClaudeUsage()
    total.calls += 1
    total.inputTokens += usage.inputTokens
    total.outputTokens += usage.outputTokens
    total.cacheCreationTokens += usage.cacheCreationTokens
    total.cacheReadTokens += usage.cacheReadTokens
    this.claude.set(model, total)
  }

  addJev(inputTokens: number, outputTokens: number): void {
    this.jev.calls += 1
    this.jev.inputTokens += inputTokens
    this.jev.outputTokens += outputTokens
  }

  claudeTotal(): ClaudeUsage {
    const total = emptyClaudeUsage()
    for (const usage of this.claude.values()) {
      total.calls += usage.calls
      total.inputTokens += usage.inputTokens
      total.outputTokens += usage.outputTokens
      total.cacheCreationTokens += usage.cacheCreationTokens
      total.cacheReadTokens += usage.cacheReadTokens
    }
    return total
  }

  format(): string {
    const lines: string[] = []
    for (const [model, usage] of this.claude) {
      lines.push(`Claude ${model}: ${formatClaudeUsage(usage)}`)
    }
    if (this.claude.size === 0) lines.push('Claude: 0 calls')
    lines.push(
      `Jev: ${this.jev.calls} calls, input ${this.jev.inputTokens}, output ${this.jev.outputTokens}`
    )
    return lines.join('\n')
  }
}

export function formatClaudeUsage(usage: ClaudeUsage): string {
  return (
    `${usage.calls} calls, input ${usage.inputTokens}, output ${usage.outputTokens}, ` +
    `cache write ${usage.cacheCreationTokens}, cache read ${usage.cacheReadTokens}`
  )
}

function emptyClaudeUsage(): ClaudeUsage {
  return {
    calls: 0,
    inputTokens: 0,
    outputTokens: 0,
    cacheCreationTokens: 0,
    cacheReadTokens: 0
  }
}
