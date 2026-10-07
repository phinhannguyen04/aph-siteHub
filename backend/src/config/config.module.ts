import { DynamicModule, Global, Module } from '@nestjs/common'
import type { AppConfig } from './app.config'
import { APP_CONFIG } from './config.tokens'

@Global()
@Module({})
export class ConfigModule {
  /**
   * Expose the supplied application configuration through the global APP_CONFIG
   * injection token.
   */
  static forRoot(config: AppConfig): DynamicModule {
    return {
      module: ConfigModule,
      providers: [{ provide: APP_CONFIG, useValue: config }],
      exports: [APP_CONFIG],
    }
  }
}
