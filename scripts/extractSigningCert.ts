import childProcess from 'child_process'
import prompts from 'prompts'

// -----------------------------------------------------------------------------
// extractSigningCert
//
// Extract the SHA-256 signing-certificate digest(s) from an Android keystore in
// the exact form the info server's attestation allow-list expects
// (info_data/appAttestation -> androidApps -> { release: [...], debug: [...] }).
//
// Android key attestation reports each signing certificate as
// SHA-256(DER-encoded X.509 cert). `keytool -list -v` prints that same value as
// its "SHA256:" fingerprint, so this tool runs keytool and normalizes the
// fingerprint to lowercase hex with the colons stripped.
//
// This is the reusable tool for turning Edge's (decrypted) production keystore
// into the digest that must be pinned in the info server. For local testing it
// is also used on the fake release keystore and the debug keystore.
//
// Usage:
//   node -r sucrase/register scripts/extractSigningCert.ts <keystore> [alias] \
//     [--storepass <password>]
//
// Password resolution order: --storepass flag, KEYSTORE_PASSWORD env var, then
// an interactive prompt. The password reaches keytool over stdin, so it never
// appears in keytool's argv; note that --storepass still puts it in this
// script's own argv, so prefer the env var or the prompt for the real keystore.
// When no alias is given, every entry in the keystore is printed.
// -----------------------------------------------------------------------------

interface Args {
  keystore?: string
  alias?: string
  storepass?: string
}

const parseArgs = (argv: string[]): Args => {
  const args: Args = {}
  const positional: string[] = []
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--storepass' || arg === '-p') {
      args.storepass = argv[++i]
    } else if (arg.startsWith('--storepass=')) {
      args.storepass = arg.slice('--storepass='.length)
    } else {
      positional.push(arg)
    }
  }
  args.keystore = positional[0]
  args.alias = positional[1]
  return args
}

const normalizeDigest = (fingerprint: string): string =>
  fingerprint.replace(/:/g, '').trim().toLowerCase()

const main = async (): Promise<void> => {
  const args = parseArgs(process.argv.slice(2))

  if (args.keystore == null || args.keystore === '') {
    mylog(
      'Usage: node -r sucrase/register scripts/extractSigningCert.ts <keystore> [alias] [--storepass <password>]'
    )
    process.exit(1)
  }

  let storepass = args.storepass ?? process.env.KEYSTORE_PASSWORD
  if (storepass == null || storepass === '') {
    const answer = await prompts({
      name: 'storepass',
      type: 'password',
      message: `Enter store password for ${args.keystore}`,
      validate: (v: string) => v.trim() !== ''
    })
    storepass = answer.storepass
  }
  if (storepass == null || storepass === '') {
    mylog('No store password provided; aborting.')
    process.exit(1)
  }

  // -J-Duser.language=en forces English labels so parsing is locale-independent.
  const keytoolArgs = [
    '-list',
    '-v',
    '-J-Duser.language=en',
    '-keystore',
    args.keystore
  ]
  if (args.alias != null) keytoolArgs.push('-alias', args.alias)
  const output = runKeytool(keytoolArgs, storepass)

  // Pair each "Alias name:" with the following "SHA256:" fingerprint. When a
  // single alias was requested keytool omits the alias header, so fall back to
  // the requested alias name.
  const lines = output.split('\n')
  const entries: Array<{ alias: string; digest: string }> = []
  let currentAlias = args.alias ?? '(unknown)'
  for (const line of lines) {
    const aliasMatch = /^Alias name:\s*(.+)$/.exec(line)
    if (aliasMatch != null) {
      currentAlias = aliasMatch[1].trim()
      continue
    }
    const shaMatch = /SHA256:\s*([0-9A-Fa-f:]+)/.exec(line)
    if (shaMatch != null) {
      entries.push({
        alias: currentAlias,
        digest: normalizeDigest(shaMatch[1])
      })
    }
  }

  if (entries.length === 0) {
    mylog('No SHA-256 fingerprint found in keytool output:')
    mylog(output)
    process.exit(1)
  }

  mylog('')
  mylog('Signing certificate SHA-256 digest(s):')
  mylog(
    '  (paste into info_data/appAttestation -> androidApps -> release/debug)'
  )
  mylog('')
  for (const entry of entries) {
    mylog(`  alias "${entry.alias}":`)
    mylog(`    ${entry.digest}`)
  }
  mylog('')
}

const mylog = console.log

/**
 * Run keytool and return its stdout.
 *
 * Arguments are passed as an array rather than a shell string. Keystore
 * passwords routinely contain characters the shell acts on, and interpolating
 * them yields either a silently wrong password or an outright syntax error
 * instead of a digest - `se$cret`x123` fails with "unexpected EOF". The
 * password goes over stdin rather than `-storepass`, which keeps it out of the
 * process list too; keytool prompts for it on stderr, leaving stdout parseable.
 */
function runKeytool(args: string[], storepass: string): string {
  try {
    return childProcess.execFileSync('keytool', args, {
      encoding: 'utf8',
      input: `${storepass}\n`,
      timeout: 600000,
      killSignal: 'SIGKILL',
      stdio: ['pipe', 'pipe', 'pipe']
    })
  } catch (error) {
    // keytool reports why it failed ("keystore password was incorrect", "Alias
    // <name> does not exist") on *stdout*, followed by a Java stack trace;
    // stderr holds only the password prompt. Surface the first line, so the
    // developer gets the reason instead of a bare non-zero exit.
    const stdout = (error as { stdout?: string }).stdout ?? ''
    const reason = stdout
      .split('\n')
      .find(line => line.startsWith('keytool error:'))
    mylog(reason ?? stdout.split('\n')[0])
    throw error
  }
}

main().catch((e: unknown) => {
  console.log(String(e))
  process.exit(1)
})
