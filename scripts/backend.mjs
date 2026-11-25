// Node loads the workspace .env (--env-file in package.json) and passes it to the .NET process.
import { spawn } from 'node:child_process'

const project = 'src/APH.SiteHub.Api/APH.SiteHub.Api.csproj'
const command = process.argv[2] ?? 'dev'
const commands = {
  dev: ['watch', '--project', project, 'run'],
  migrate: ['run', '--project', project, '--', '--migrate'],
}
const args = commands[command]
if (!args) {
  throw new Error(`Unknown backend command: ${command}`)
}
const child = spawn('dotnet', args, {
  env: {
    ...process.env,
    ASPNETCORE_ENVIRONMENT:
      process.env.ASPNETCORE_ENVIRONMENT ?? (command === 'dev' ? 'Development' : 'Production'),
  },
  stdio: 'inherit',
})
child.on('exit', (code) => process.exit(code ?? 1))
