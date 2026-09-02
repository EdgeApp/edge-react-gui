import { printJson } from '../client/output'
import { command, requireSession, UsageError } from '../command'
import { parseCommandArgs } from '../commandArgs'

const recovery2SetupCmd = command(
  'change-recovery',
  {
    usage:
      'change-recovery --question=<q> --answer=<a> [--question= --answer=]…',
    help: 'Set recovery questions and answers for the current account',
    needsSession: true
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(recovery2SetupCmd, argv, {
      positional: 'none',
      flags: { question: 'repeat', answer: 'repeat' }
    })
    const questions = args.strings('question')
    const answers = args.strings('answer')
    if (questions.length === 0 || questions.length !== answers.length) {
      throw new UsageError(
        recovery2SetupCmd,
        'Provide matching --question and --answer pairs'
      )
    }
    const sessionId = requireSession(ctx)
    printJson(
      await ctx.client.post(
        `/accounts/${encodeURIComponent(sessionId)}/change-recovery`,
        { questions, answers }
      )
    )
  }
)

const recovery2QuestionsCmd = command(
  'fetch-recovery2-questions',
  {
    usage: 'fetch-recovery2-questions <username> --recovery-key=<key>',
    help: "Show a user's recovery questions"
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(recovery2QuestionsCmd, argv, {
      positional: 'required',
      flags: { 'recovery-key': 'string' }
    })
    const query = new URLSearchParams({
      recovery2Key: args.requireString('recovery-key'),
      username: args.positional!
    })
    printJson(
      await ctx.client.get(`/fetch-recovery2-questions?${query.toString()}`)
    )
  }
)
