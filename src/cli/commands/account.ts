import { printJson } from '../client/output'
import { command, requireSession, UsageError } from '../command'
import { parseCommandArgs } from '../commandArgs'

function accountPath(sessionId: string, suffix: string): string {
  return `/account/${encodeURIComponent(sessionId)}${suffix}`
}

command(
  'sync',
  {
    usage: 'sync',
    help: 'Force an account data sync (account.sync)',
    needsSession: true
  },
  async ctx => {
    const sessionId = requireSession(ctx)
    await ctx.client.post(accountPath(sessionId, '/sync'))
    printJson({ ok: true })
  }
)

const deleteRemoteCmd = command(
  'delete-remote-account',
  {
    usage: 'delete-remote-account --yes',
    help: 'Permanently delete the remote account (account.deleteRemoteAccount)',
    needsSession: true
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(deleteRemoteCmd, argv, {
      positional: 'none',
      flags: { yes: 'boolean' }
    })
    // The endpoint has no guard, so the guard lives here: this is
    // irreversible and takes the account's funds with it.
    if (!args.boolean('yes')) {
      throw new UsageError(
        deleteRemoteCmd,
        'delete-remote-account is irreversible; pass --yes to confirm'
      )
    }
    const sessionId = requireSession(ctx)
    await ctx.client.post(accountPath(sessionId, '/delete-remote-account'))
    ctx.setSessionId(null)
    printJson({ ok: true })
  }
)

const changeUsernameCmd = command(
  'change-username',
  {
    usage: 'change-username --username=<username> [--password=<password>]',
    help: 'Change the account username (account.changeUsername)',
    needsSession: true
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(changeUsernameCmd, argv, {
      positional: 'none',
      flags: { username: 'string', password: 'string' }
    })
    const sessionId = requireSession(ctx)
    await ctx.client.post(accountPath(sessionId, '/change-username'), {
      username: args.requireString('username'),
      password: args.string('password')
    })
    printJson({ ok: true })
  }
)

command(
  'pending-vouchers',
  {
    usage: 'pending-vouchers',
    help: 'List pending 2FA vouchers (account.pendingVouchers)',
    needsSession: true
  },
  async ctx => {
    const sessionId = requireSession(ctx)
    printJson(await ctx.client.get(accountPath(sessionId, '/pending-vouchers')))
  }
)

const approveVoucherCmd = command(
  'approve-voucher',
  {
    usage: 'approve-voucher --voucher-id=<voucherId>',
    help: 'Approve a pending 2FA voucher (account.approveVoucher)',
    needsSession: true
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(approveVoucherCmd, argv, {
      positional: 'none',
      flags: { 'voucher-id': 'string' }
    })
    const sessionId = requireSession(ctx)
    await ctx.client.post(accountPath(sessionId, '/approve-voucher'), {
      voucherId: args.requireString('voucher-id')
    })
    printJson({ ok: true })
  }
)

const rejectVoucherCmd = command(
  'reject-voucher',
  {
    usage: 'reject-voucher --voucher-id=<voucherId>',
    help: 'Reject a pending 2FA voucher (account.rejectVoucher)',
    needsSession: true
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(rejectVoucherCmd, argv, {
      positional: 'none',
      flags: { 'voucher-id': 'string' }
    })
    const sessionId = requireSession(ctx)
    await ctx.client.post(accountPath(sessionId, '/reject-voucher'), {
      voucherId: args.requireString('voucher-id')
    })
    printJson({ ok: true })
  }
)
