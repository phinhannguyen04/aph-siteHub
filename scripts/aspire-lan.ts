// Runs the Aspire AppHost reachable from the LAN: detects this machine's LAN IP, opens the
// UI port in ufw (idempotent) and starts the AppHost with LAN_HOST set.
//   LAN_HOST=<ip>  override the detected address     LAN_PORT=<port>  UI port (default 8113)
const uiPort = Number(Bun.env.LAN_PORT ?? 8113)

async function output(cmd: string[]): Promise<string> {
  const proc = Bun.spawn(cmd, { stdout: 'pipe', stderr: 'ignore' })
  const text = await new Response(proc.stdout).text()
  await proc.exited
  return text
}

async function run(cmd: string[], env: Record<string, string | undefined> = Bun.env) {
  const proc = Bun.spawn(cmd, { env, stdin: 'inherit', stdout: 'inherit', stderr: 'inherit' })
  return proc.exited
}

const lanHost =
  Bun.env.LAN_HOST ??
  /\bsrc (\d+\.\d+\.\d+\.\d+)/.exec(await output(['ip', '-4', 'route', 'get', '1.1.1.1']))?.[1]
if (!lanHost) {
  throw new Error('Cannot detect the LAN IP; set LAN_HOST=<ip> and retry.')
}

if (Bun.which('ufw')) {
  for (const port of [uiPort]) {
    // "Skipping adding existing rule" makes this safe to repeat; sudo may ask for a password once.
    const code = await run(['sudo', 'ufw', 'allow', `${port}/tcp`])
    if (code !== 0) {
      console.warn(`Could not open ${port}/tcp in ufw (exit ${code}); continuing.`)
    }
  }
} else {
  console.warn('ufw not found: open the ports in your firewall if other machines cannot connect.')
}

console.log(`UI:        http://${lanHost}:${uiPort}`)
process.exit(
  await run(['dotnet', 'run', '--project', 'src/APH.SiteHub.AppHost'], {
    ...Bun.env,
    LAN_HOST: lanHost,
    LAN_PORT: String(uiPort),
  }),
)
export {}
