import { command, UsageError } from '../command'
import { requireAccount, requireContext } from '../util/session'

command(
  'recovery2-questions',
  {
    usage: '<key> <username>',
    help: "Shows a user's recovery questions",
    needsContext: true
  },
  async function (console, session, argv) {
    if (argv.length !== 2) throw new UsageError(this)
    const context = requireContext(session)
    const key = argv[0]
    const username = argv[1]

    await context.fetchRecovery2Questions(key, username).then(questions => {
      questions.forEach(question => {
        console.log(question)
      })
    })
  }
)

command(
  'recovery2-login',
  {
    usage: '<key> <username> <answers>...',
    help: 'Logs the user in with a recovery key and answers',
    needsContext: true
  },
  async function (console, session, argv) {
    if (argv.length < 2) throw new UsageError(this)
    const context = requireContext(session)
    const key = argv[0]
    const username = argv[1]

    const answers: string[] = []
    for (let i = 2; i < argv.length; ++i) {
      answers.push(argv[i])
    }

    await context
      .loginWithRecovery2(key, username, answers, {})
      .then(account => {
        session.account = account
      })
  }
)

command(
  'recovery2-setup',
  {
    usage: '[<question> <answer>]...',
    help: 'Creates or changes the recovery questions for a login',
    needsLogin: true
  },
  async function (console, session, argv) {
    if (argv.length % 2 !== 0) throw new UsageError(this)
    const account = requireAccount(session)

    const questions: string[] = []
    const answers: string[] = []
    for (let i = 0; i < argv.length; i += 2) {
      questions.push(argv[i])
      answers.push(argv[i + 1])
    }

    await account.changeRecovery(questions, answers).then(key => {
      console.log(`Recovery key: ${key}`)
    })
  }
)
