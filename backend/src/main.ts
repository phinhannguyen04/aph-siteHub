import { createApp } from './app.factory'
import { readConfig } from './config/app-config'

async function bootstrap(): Promise<void> {
  const config = readConfig()
  const app = await createApp(config)
  app.enableShutdownHooks()
  try {
    await app.listen({ port: config.port, host: '0.0.0.0' })
  } catch (error) {
    await app.close()
    throw error
  }
}

await bootstrap()
