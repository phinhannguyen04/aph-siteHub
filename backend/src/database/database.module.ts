import {
  DynamicModule,
  Global,
  Inject,
  Injectable,
  Module,
  OnApplicationShutdown,
} from '@nestjs/common'
import type { Surreal } from 'surrealdb'
import type { AppConfig } from '../config/app-config'
import { APP_CONFIG } from '../config/config.tokens'
import { connectDb } from './surreal.client'
import { DATABASE, DATABASE_OWNED } from './database.tokens'

@Injectable()
class DatabaseShutdown implements OnApplicationShutdown {
  constructor(
    @Inject(DATABASE) private readonly db: Surreal,
    @Inject(DATABASE_OWNED) private readonly owned: boolean,
  ) {}

  async onApplicationShutdown(): Promise<void> {
    if (this.owned) await this.db.close()
  }
}

@Global()
@Module({})
export class DatabaseModule {
  static forRoot(existingDatabase?: Surreal): DynamicModule {
    return {
      module: DatabaseModule,
      providers: [
        {
          provide: DATABASE,
          useFactory: (config: AppConfig) => existingDatabase ?? connectDb(config),
          inject: [APP_CONFIG],
        },
        { provide: DATABASE_OWNED, useValue: !existingDatabase },
        DatabaseShutdown,
      ],
      exports: [DATABASE],
    }
  }
}
