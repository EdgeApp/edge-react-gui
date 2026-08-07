import { printJson } from '../client/output'
import { command, requireSession, UsageError } from '../command'

const recovery2SetupCmd = command(
  'recovery2-setup',
  {
    usage: 'recovery2-setup <question> <answer> [<question> <answer>]...',
    help: 'Set recovery questions and answers for the current account',
    needsSession: true
  },
  async (ctx, argv) => {
    if (argv.length === 0 || argv.length % 2 !== 0) {
      throw new UsageError(recovery2SetupCmd)
    }
    const sessionId = requireSession(ctx)
    const questions: string[] = []
    const answers: string[] = []
    for (let i = 0; i < argv.length; i += 2) {
      questions.push(argv[i])
      answers.push(argv[i + 1])
    }
    printJson(
      await ctx.client.put(
        `/v1/accounts/${encodeURIComponent(sessionId)}/recovery`,
        { questions, answers }
      )
    )
  }
)

const recovery2QuestionsCmd = command(
  'recovery2-questions',
  {
    usage: 'recovery2-questions <recovery2Key> <username>',
    help: "Show a user's recovery questions"
  },
  async (ctx, argv) => {
    if (argv.length !== 2) throw new UsageError(recovery2QuestionsCmd)
    const [recovery2Key, username] = argv
    const query = new URLSearchParams({ recovery2Key, username })
    printJson(
      await ctx.client.get(`/v1/recovery2-questions?${query.toString()}`)
    )
  }
)
