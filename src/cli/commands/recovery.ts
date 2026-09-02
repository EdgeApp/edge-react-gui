import { printJson } from '../client/output'
import { command, requireSession, UsageError } from '../command'
import { parseCommandArgs } from '../commandArgs'

const recoveryChangeCmd = command(
  'change-recovery',
  {
    usage:
      'change-recovery --question=<q> --answer=<a> [--question= --answer=]…',
    help: 'Set recovery questions and answers for the current account',
    needsSession: true
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(recoveryChangeCmd, argv, {
      positional: 'none',
      flags: { question: 'repeat', answer: 'repeat' }
    })
    const questions = args.strings('question')
    const answers = args.strings('answer')
    if (questions.length === 0 || questions.length !== answers.length) {
      throw new UsageError(
        recoveryChangeCmd,
        'Provide matching --question and --answer pairs'
      )
    }
    const sessionId = requireSession(ctx)
    printJson(
      await ctx.client.post(
        `/account/${encodeURIComponent(sessionId)}/change-recovery`,
        { questions, answers }
      )
    )
  }
)

const recoveryQuestionsCmd = command(
  'fetch-recovery-questions',
  {
    usage: 'fetch-recovery-questions <username> --recovery-key=<key>',
    help: "Show a user's recovery questions"
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(recoveryQuestionsCmd, argv, {
      positional: 'required',
      flags: { 'recovery-key': 'string' }
    })
    const query = new URLSearchParams({
      recoveryKey: args.requireString('recovery-key'),
      username: args.positional!
    })
    printJson(
      await ctx.client.get(`/fetch-recovery-questions?${query.toString()}`)
    )
  }
)

command(
  'delete-recovery',
  {
    usage: 'delete-recovery',
    help: 'Disable recovery login (account.deleteRecovery)',
    needsSession: true
  },
  async ctx => {
    const sessionId = requireSession(ctx)
    await ctx.client.post(
      `/account/${encodeURIComponent(sessionId)}/delete-recovery`
    )
    printJson({ ok: true })
  }
)
