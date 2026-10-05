import { DynamicModule, Module } from '@nestjs/common'
import type { Connection } from './database/client'
import { AuthModule } from './modules/auth/auth.module'
import type { AppConfig } from './config/app.config'
import { ConfigModule } from './config/config.module'
import { DatabaseModule } from './database/database.module'
import { HealthModule } from './health/health.module'
import { TagsModule } from './modules/tags/tags.module'
import { WebsitesModule } from './modules/websites/websites.module'
import { AccountsModule } from './modules/accounts/accounts.module.js';

@Module({
  imports: [AccountsModule]
})
export class AppModule {
  static forRoot(config: AppConfig, connection: Connection, owned: boolean): DynamicModule {
    return {
      module: AppModule,
      imports: [
        ConfigModule.forRoot(config),
        DatabaseModule.forRoot(connection, owned),
        AuthModule,
        HealthModule,
        WebsitesModule,
        TagsModule,
      ],
    }
  }
}
