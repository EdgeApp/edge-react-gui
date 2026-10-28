import { spawn } from 'child_process'
import {
  asArray,
  asBoolean,
  asJSON,
  asNumber,
  asObject,
  asOptional,
  asString
} from 'cleaners'
import fs from 'fs'
import os from 'os'
import path from 'path'

import type { TokenLedger } from './ledger'

export type ClaudeModel = 'haiku' | 'sonnet' | 'opus'

export interface ClaudeRequest {
  model: ClaudeModel
  /** Sent as the system prompt, which both backends cache as a prefix. */
  system: string
  prompt: string
}

const API_MODEL_IDS: Record<ClaudeModel, string> = {
  haiku: 'claude-haiku-5-5',
  sonnet: 'claude-sonnet-5-5',
  opus: 'claude-opus-5-5'
}
const MAX_ATTEMPTS = 3
const MAX_OUTPUT_TOKENS = 32000

const asCliResult = asJSON(
  asObject({
    is_error: asBoolean,
    result: asString,
    usage: asObject({
      input_tokens: asNumber,
      output_tokens: asNumber,
      cache_creation_input_tokens: asOptional(asNumber, 0),
      cache_read_input_tokens: asOptional(asNumber, 0)
    })
  })
)

const asApiResult = asJSON(
  asObject({
    content: asArray(asObject({ type: asString, text: asOptional(asString) })),
    usage: asObject({
      input_tokens: asNumber,
      output_tokens: asNumber,
      cache_creation_input_tokens: asOptional(asNumber, 0),
      cache_read_input_tokens: asOptional(asNumber, 0)
    })
  })
)

/**
 * Sends one prompt to Claude and returns the text reply.
 * Uses the Anthropic Messages API when ANTHROPIC_API_KEY is set,
 * and the local `claude` CLI (the developer's subscription) otherwise.
 */
export async function askClaude(
  request: ClaudeRequest,
  ledger: TokenLedger
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  let lastError: unknown
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; ++attempt) {
    try {
      return apiKey != null && apiKey !== ''
        ? await askApi(request, apiKey, ledger)
        : await askCli(request, ledger)
    } catch (error: unknown) {
      lastError = error
      console.warn(
        `Claude ${request.model} attempt ${attempt} failed: ${errorMessage(
          error
        )}`
      )
      await delay(5000 * attempt)
    }
  }
  throw lastError
}

export function describeBackend(): string {
  const apiKey = process.env.ANTHROPIC_API_KEY
  return apiKey != null && apiKey !== ''
    ? 'Anthropic API (ANTHROPIC_API_KEY)'
    : 'claude CLI (subscription)'
}

async function askCli(
  request: ClaudeRequest,
  ledger: TokenLedger
): Promise<string> {
  const args = [
    '-p',
    '--model',
    request.model,
    '--output-format',
    'json',
    '--system-prompt',
    request.system,
    '--tools',
    '',
    '--setting-sources',
    '',
    '--strict-mcp-config',
    '--no-session-persistence',
    '--exclude-dynamic-system-prompt-sections'
  ]
  const stdout = await runProcess('claude', args, request.prompt, emptyCwd())
  const result = asCliResult(stdout)
  ledger.addClaude(request.model, {
    inputTokens: result.usage.input_tokens,
    outputTokens: result.usage.output_tokens,
    cacheCreationTokens: result.usage.cache_creation_input_tokens,
    cacheReadTokens: result.usage.cache_read_input_tokens
  })
  if (result.is_error) throw new Error(result.result)
  return result.result
}

async function askApi(
  request: ClaudeRequest,
  apiKey: string,
  ledger: TokenLedger
): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'x-api-key': apiKey
    },
    body: JSON.stringify({
      model: API_MODEL_IDS[request.model],
      max_tokens: MAX_OUTPUT_TOKENS,
      system: [
        {
          type: 'text',
          text: request.system,
          cache_control: { type: 'ephemeral' }
        }
      ],
      messages: [{ role: 'user', content: request.prompt }]
    })
  })
  const text = await response.text()
  if (!response.ok) {
    throw new Error(`Anthropic API ${response.status}: ${text.slice(0, 500)}`)
  }
  const result = asApiResult(text)
  ledger.addClaude(request.model, {
    inputTokens: result.usage.input_tokens,
    outputTokens: result.usage.output_tokens,
    cacheCreationTokens: result.usage.cache_creation_input_tokens,
    cacheReadTokens: result.usage.cache_read_input_tokens
  })
  return result.content.map(block => block.text ?? '').join('')
}

let cliCwd: string | undefined

/**
 * The CLI runs from an empty directory so no project instructions
 * or settings leak into the prompt.
 */
function emptyCwd(): string {
  cliCwd ??= fs.mkdtempSync(path.join(os.tmpdir(), 'localize-claude-'))
  return cliCwd
}

async function runProcess(
  command: string,
  args: string[],
  stdin: string,
  cwd: string
): Promise<string> {
  return await new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString()
    })
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString()
    })
    child.on('error', reject)
    child.on('close', code => {
      // The CLI exits non-zero on a model error but still prints the
      // JSON result, which carries the usage and the error text:
      if (code === 0 || stdout.trim().startsWith('{')) resolve(stdout)
      else reject(new Error(`${command} exited ${code}: ${stderr.trim()}`))
    })
    child.stdin.end(stdin)
  })
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export async function delay(ms: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms))
}
