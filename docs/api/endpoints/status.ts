import { f, opt, s } from '../schema'
import { endpoint, group } from '../types'

export const engineGroup = group({
  id: 'engine',
  title: 'Engine',
  doc: 'Lifecycle and configuration of the `edge-engine` daemon. None of these have an `edge-core-js` equivalent — they describe the daemon itself — and none need a session.',
  endpoints: [
    endpoint({
      id: 'engineStatus',
      summary: 'Engine liveness and summary',
      description:
        'The readiness probe the client polls after auto-spawning the engine.',
      coreCall: null,
      coreNote: 'Engine lifecycle; the daemon is not part of the core API.',
      method: 'GET',
      path: '/engine/status',
      source: 'src/cli/engine/routes/status.ts',
      cli: [
        {
          command: 'engine-status',
          usage: 'engine-status',
          example: 'edge-cli engine-status'
        }
      ],
      success: {
        status: 200,
        schema: s.object([
          f('pid', s.int(40123)),
          f('apiVersion', s.string({ example: '1.0.0' })),
          f('uptimeSeconds', s.number({ example: 12 })),
          f('sessionCount', s.int(1)),
          f('testMode', s.boolean()),
          f(
            'idleShutdownAt',
            s.union(s.date(), s.null()),
            '`null` when no idle shutdown is scheduled.'
          ),
          f(
            'tcpPort',
            s.union(s.int(9008), s.null()),
            '`null` unless started with `--tcp`.'
          ),
          f('socketPath', s.string()),
          f('locale', s.string({ example: 'en-US' })),
          f('decimalSeparator', s.string({ example: '.' })),
          f('groupingSeparator', s.string({ example: ',' }))
        ])
      },
      errors: ['ENGINE_SHUTTING_DOWN']
    }),

    endpoint({
      id: 'engineConfig',
      summary: 'Configured context options',
      description:
        'What the engine passed to `makeEdgeContext`. Contains no secrets. Use it to assert tester hosts before a test run.',
      coreCall: null,
      coreNote: 'Reflects EdgeContextOptions the engine supplied at startup.',
      method: 'GET',
      path: '/engine/config',
      source: 'src/cli/engine/routes/status.ts',
      cli: [
        {
          command: 'engine-config',
          usage: 'engine-config',
          example: 'edge-cli -t engine-config'
        }
      ],
      success: {
        status: 200,
        schema: s.object([
          f('appId', s.string({ example: '' })),
          f('testMode', s.boolean()),
          f('directory', s.string({ example: '/Users/you/.edge-cli' })),
          f(
            'servers',
            s.object([
              opt('loginServer', s.string()),
              opt('infoServer', s.string()),
              opt('changeServer', s.string()),
              opt('syncServer', s.union(s.string(), s.array(s.string())))
            ])
          ),
          f('plugins', s.array(s.string()))
        ])
      },
      notes: [
        'Outside `-t` / `--test`, `servers` is an **empty object** — core is using its built-in production defaults, so there is nothing to echo back.'
      ]
    }),

    endpoint({
      id: 'engineStop',
      summary: 'Stop the engine',
      description:
        'Logs out every session, closes the context, unlinks the socket and run-file, then exits. The engine answers before it starts tearing down, so a response is not proof the process is gone.',
      coreCall: null,
      coreNote: 'Engine lifecycle. Internally calls context.close().',
      method: 'POST',
      path: '/engine/stop',
      source: 'src/cli/engine/routes/status.ts',
      cli: [
        {
          command: 'engine-stop',
          usage: 'engine-stop',
          example: 'edge-cli engine-stop'
        }
      ],
      body: s.object([], { open: true }),
      bodyDoc: 'None.',
      success: { status: 200, schema: s.ref('Ok') },
      notes: [
        'In-flight callers may see `503 ENGINE_SHUTTING_DOWN` once teardown starts.'
      ]
    }),

    endpoint({
      id: 'engineSessions',
      summary: 'List active sessions',
      coreCall: null,
      coreNote:
        'The session registry is an engine construct; core has no multi-account session concept.',
      method: 'GET',
      path: '/engine/sessions',
      source: 'src/cli/engine/routes/login.ts',
      cli: [
        {
          command: 'engine-sessions',
          usage: 'engine-sessions',
          example: 'edge-cli engine-sessions'
        }
      ],
      success: {
        status: 200,
        schema: s.array(s.ref('Session')),
        doc: 'A bare JSON array.'
      }
    }),

    endpoint({
      id: 'engineEvents',
      summary: 'Subscribe to engine events',
      description:
        'Server-Sent Events. Handled directly in `server.ts` rather than through the router, so there is no command — attach with `curl -N` or any SSE client.',
      coreCall: null,
      coreNote:
        'Engine-side fan-out. `core.log` frames carry core’s onLog output.',
      method: 'GET',
      path: '/engine/events',
      source: 'src/cli/engine/server.ts, src/cli/engine/events.ts',
      cli: [],
      success: {
        status: 200,
        doc: '`text/event-stream`. Each frame is `event: <type>` then `data: <json>`. The stream opens with a `: ok` comment.'
      },
      notes: [
        'Event types: `core.log` `{ source, message, type }`; `session.created` `{ sessionId, username, loginMethod }`; `session.expired` `{ sessionId, reason }` where reason is `logout` \\| `expired` \\| `shutdown` \\| `cancelled`; `engine.shutdown` `{ reason }`.',
        '`sessionId` in events is truncated to its first 10 characters plus an ellipsis.',
        'A client that falls more than 1 MiB behind is disconnected rather than buffered.',
        'There is no edge-login event. Poll `GET /pending-edge-login/{pendingId}` for QR-login progress.'
      ]
    })
  ]
})
