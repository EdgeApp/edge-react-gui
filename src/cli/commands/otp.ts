import { command, UsageError } from '../command'
import { requireAccount, requireContext } from '../util/session'

command(
  'otp-status',
  {
    usage: '',
    help: 'Displays the OTP key for this account',
    needsLogin: true
  },
  function (console, session, argv) {
    if (argv.length !== 0) throw new UsageError(this)
    const account = requireAccount(session)

    if (account.otpKey != null) {
      console.log(`OTP enabled with key ${account.otpKey}`)
    } else console.log('OTP disabled')
    if (account.otpResetDate != null) {
      console.log(`OTP reset will occur at ${String(account.otpResetDate)}`)
    } else console.log('No OTP reset pending')
  }
)

command(
  'otp-enable',
  {
    usage: '[<timeout>]',
    help: 'Enables OTP for this account',
    needsLogin: true
  },
  async function (console, session, argv) {
    if (argv.length > 1) throw new UsageError(this)
    const account = requireAccount(session)
    const timeout = Number(argv[0])

    await account.enableOtp(timeout).then(() => {
      console.log(account.otpKey)
    })
  }
)

command(
  'otp-disable',
  {
    usage: '',
    help: 'Disables OTP for this account',
    needsLogin: true
  },
  async function (console, session, argv) {
    if (argv.length !== 0) throw new UsageError(this)
    const account = requireAccount(session)

    await account.disableOtp()
  }
)

command(
  'otp-reset-cancel',
  {
    usage: '',
    help: 'Cancels a pending OTP reset for this account',
    needsLogin: true
  },
  async function (console, session, argv) {
    if (argv.length !== 0) throw new UsageError(this)
    const account = requireAccount(session)

    await account.cancelOtpReset()
  }
)

command(
  'otp-reset-request',
  {
    usage: '<username> <reset token>',
    help: 'Requests an OTP reset for this account',
    needsContext: true
  },
  async function (console, session, argv) {
    if (argv.length !== 2) throw new UsageError(this)
    const context = requireContext(session)
    const username = argv[0]
    const resetToken = argv[1]

    await context.requestOtpReset(username, resetToken).then(date => {
      console.log(date)
    })
  }
)
