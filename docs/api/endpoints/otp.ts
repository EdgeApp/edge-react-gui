import { f, nul, opt, s } from '../schema'
import { endpoint, group } from '../types'
import { sessionId } from './common'

export const otpGroup = group({
  id: 'otp',
  title: 'Two-factor authentication',
  doc: 'OTP state and the reset flow a user falls back on after losing their authenticator.',
  endpoints: [
    endpoint({
      id: 'otpKey',
      summary: 'Read the 2FA secret and reset state',
      coreCall: 'account.otpKey',
      coreNote: 'Also carries account.otpResetDate.',
      method: 'GET',
      path: '/accounts/{sessionId}/otp-key',
      source: 'src/cli/engine/routes/otp.ts',
      cli: [
        { command: 'otp-key', usage: 'otp-key', example: 'edge-cli otp-key' }
      ],
      pathParams: [sessionId],
      success: {
        status: 200,
        schema: s.object([
          nul(
            'otpKey',
            s.string({ example: 'NB2W…' }),
            'Secret material. `null` when OTP is off.'
          ),
          nul('otpResetDate', s.date(), 'Set when a reset has been requested.')
        ])
      }
    }),

    endpoint({
      id: 'enableOtp',
      summary: 'Enable 2FA',
      coreCall: 'account.enableOtp',
      method: 'POST',
      path: '/accounts/{sessionId}/enable-otp',
      source: 'src/cli/engine/routes/otp.ts',
      cli: [
        {
          command: 'enable-otp',
          usage: 'enable-otp [--timeout=<n>]',
          flags: [{ flag: '--timeout=<n>', maps: 'timeout', target: 'body' }],
          example: 'edge-cli enable-otp'
        }
      ],
      pathParams: [sessionId],
      body: s.object([
        opt(
          'timeout',
          s.number(),
          'Core `enableOtp(timeout)`. The reset waiting period; core supplies the default when omitted.'
        )
      ]),
      success: {
        status: 200,
        schema: s.object([
          nul('otpKey', s.string(), 'The new secret. Record it now.')
        ])
      }
    }),

    endpoint({
      id: 'disableOtp',
      summary: 'Disable 2FA',
      coreCall: 'account.disableOtp',
      method: 'POST',
      path: '/accounts/{sessionId}/disable-otp',
      source: 'src/cli/engine/routes/otp.ts',
      cli: [
        {
          command: 'disable-otp',
          usage: 'disable-otp',
          example: 'edge-cli disable-otp'
        }
      ],
      pathParams: [sessionId],
      success: { status: 204 }
    }),

    endpoint({
      id: 'cancelOtpReset',
      summary: 'Cancel a pending 2FA reset',
      description:
        'The defence against someone else requesting a reset on your account.',
      coreCall: 'account.cancelOtpReset',
      method: 'POST',
      path: '/accounts/{sessionId}/cancel-otp-reset',
      source: 'src/cli/engine/routes/otp.ts',
      cli: [
        {
          command: 'cancel-otp-reset',
          usage: 'cancel-otp-reset',
          example: 'edge-cli cancel-otp-reset'
        }
      ],
      pathParams: [sessionId],
      success: { status: 204 }
    }),

    endpoint({
      id: 'repairOtp',
      summary: 'Re-point the account at a known 2FA secret',
      coreCall: 'account.repairOtp',
      method: 'POST',
      path: '/accounts/{sessionId}/repair-otp',
      source: 'src/cli/engine/routes/otp.ts',
      cli: [],
      pathParams: [sessionId],
      body: s.object([f('otpKey', s.string({ example: 'NB2W…' }))]),
      success: { status: 204 },
      errors: ['OTP_REQUIRED', 'BAD_REQUEST']
    })
  ]
})

export const vouchersGroup = group({
  id: 'vouchers',
  title: 'Login vouchers',
  doc: 'When 2FA blocks a login, the login server issues a voucher an already-trusted device can approve or reject.',
  endpoints: [
    endpoint({
      id: 'pendingVouchers',
      summary: 'List pending vouchers',
      coreCall: 'account.pendingVouchers',
      method: 'GET',
      path: '/accounts/{sessionId}/pending-vouchers',
      source: 'src/cli/engine/routes/vouchers.ts',
      cli: [],
      pathParams: [sessionId],
      success: {
        status: 200,
        schema: s.object([
          f(
            'pendingVouchers',
            s.array(
              s.core(
                'EdgePendingVoucher',
                'voucherId, activates, created, deviceDescription, ipDescription, …'
              )
            )
          )
        ])
      }
    }),

    endpoint({
      id: 'approveVoucher',
      summary: 'Approve a voucher',
      description: 'Lets the waiting device finish logging in.',
      coreCall: 'account.approveVoucher',
      method: 'POST',
      path: '/accounts/{sessionId}/approve-voucher',
      source: 'src/cli/engine/routes/vouchers.ts',
      cli: [],
      pathParams: [sessionId],
      body: s.object([
        f(
          'voucherId',
          s.string(),
          'From `GET …/pending-vouchers`, or an `OTP_REQUIRED` error’s `details.voucherId`.'
        )
      ]),
      success: { status: 204 },
      errors: ['BAD_REQUEST', 'NETWORK_ERROR']
    }),

    endpoint({
      id: 'rejectVoucher',
      summary: 'Reject a voucher',
      coreCall: 'account.rejectVoucher',
      method: 'POST',
      path: '/accounts/{sessionId}/reject-voucher',
      source: 'src/cli/engine/routes/vouchers.ts',
      cli: [],
      pathParams: [sessionId],
      body: s.object([f('voucherId', s.string())]),
      success: { status: 204 },
      errors: ['BAD_REQUEST', 'NETWORK_ERROR']
    })
  ]
})

export const lobbyGroup = group({
  id: 'lobby',
  title: 'Approving a QR login',
  doc: 'The other side of `POST /request-edge-login`: a logged-in account inspecting and approving a login somebody scanned.',
  endpoints: [
    endpoint({
      id: 'fetchLobby',
      summary: 'Inspect a login request',
      description:
        'Shows who is asking, so a human can decide before approving.',
      coreCall: 'account.fetchLobby',
      method: 'GET',
      path: '/accounts/{sessionId}/fetch-lobby',
      source: 'src/cli/engine/routes/lobby.ts',
      cli: [
        {
          command: 'fetch-lobby',
          usage: 'fetch-lobby <lobbyId>',
          example: 'edge-cli fetch-lobby HbC9mVJ2xR4tN8pL'
        }
      ],
      pathParams: [sessionId],
      query: [
        {
          name: 'lobbyId',
          schema: s.string({ example: 'HbC9mVJ2xR4tN8pL' }),
          required: true,
          doc: 'From the QR code or an `edge://edge/<lobbyId>` link.'
        }
      ],
      success: {
        status: 200,
        schema: s.object([
          f('lobbyId', s.string()),
          nul(
            'loginRequest',
            s.object([
              f('appId', s.string()),
              f('displayName', s.string()),
              nul('displayImageDarkUrl', s.string()),
              nul('displayImageLightUrl', s.string())
            ]),
            '`null` when the lobby carries no login request.'
          )
        ])
      },
      errors: ['BAD_REQUEST', 'NETWORK_ERROR']
    }),

    endpoint({
      id: 'approveLoginRequest',
      summary: 'Approve a login request',
      description: '**Grants the requesting device access to this account.**',
      coreCall: 'EdgeLoginRequest.approve',
      coreNote: 'Reached through account.fetchLobby(lobbyId).loginRequest.',
      method: 'POST',
      path: '/accounts/{sessionId}/approve-login-request',
      source: 'src/cli/engine/routes/lobby.ts',
      cli: [
        {
          command: 'approve-login-request',
          usage: 'approve-login-request <lobbyId>',
          example: 'edge-cli approve-login-request HbC9mVJ2xR4tN8pL'
        }
      ],
      pathParams: [sessionId],
      body: s.object([f('lobbyId', s.string())]),
      success: { status: 200, schema: s.ref('Ok') },
      errors: ['NO_LOGIN_REQUEST', 'BAD_REQUEST', 'NETWORK_ERROR'],
      notes: [
        'The lobby is re-fetched on approve, so a request that expired in between fails with `404 NO_LOGIN_REQUEST`.'
      ]
    })
  ]
})
