// Bun loads the workspace .env and passes it to the .NET process without shell expansion.
const project = 'src/APH.SiteHub.Api/APH.SiteHub.Api.csproj'
const command = Bun.argv[2] ?? 'dev'
const commands: Record<string, string[]> = {
  dev: ['dotnet', 'watch', '--project', project, 'run'],
  migrate: ['dotnet', 'run', '--project', project, '--', '--migrate'],
  'hash-password': ['dotnet', 'run', '--project', project, '--', '--hash-password'],
  'reset-password': ['dotnet', 'run', '--project', project, '--', '--reset-password'],
}
const args = commands[command]
if (!args) {
  throw new Error(`Unknown backend command: ${command}`)
}
const child = Bun.spawn(args, {
  env: {
    ...Bun.env,
    ASPNETCORE_ENVIRONMENT:
      Bun.env.ASPNETCORE_ENVIRONMENT ?? (command === 'dev' ? 'Development' : 'Production'),
  },
  stdin: 'inherit',
  stdout: 'inherit',
  stderr: 'inherit',
})
process.exit(await child.exited)
export {}
