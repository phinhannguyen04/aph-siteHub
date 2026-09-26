import { DynamicModule, Module } from '@nestjs/common'
import type { Surreal } from 'surrealdb'
import { AuthModule } from './auth/auth.module'
import type { AppConfig } from './config/app-config'
import { ConfigModule } from './config/config.module'
import { DatabaseModule } from './database/database.module'
import { HealthModule } from './health/health.module'
import { WebsitesModule } from './websites/websites.module'

@Module({})
export class AppModule {
  static forRoot(config: AppConfig, existingDatabase?: Surreal): DynamicModule {
    return {
      module: AppModule,
      imports: [
        ConfigModule.forRoot(config),
        DatabaseModule.forRoot(existingDatabase),
        AuthModule,
        HealthModule,
        WebsitesModule,
      ],
    }
  }
}
