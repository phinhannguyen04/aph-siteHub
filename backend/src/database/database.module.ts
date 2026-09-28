import {
  DynamicModule,
  Global,
  Inject,
  Injectable,
  Module,
  OnApplicationShutdown,
} from '@nestjs/common'
import type { Surreal } from 'surrealdb'
import { orm } from 'surqlize'
import type { AppConfig } from '../config/app-config'
import { APP_CONFIG } from '../config/config.tokens'
import { connectDb } from './surreal.client'
import { DATABASE, DATABASE_OWNED, ORM } from './database.tokens'
import { adminCredentials, tags, websites } from './schema'

export function createOrm(db: Surreal) {
  return orm(db, websites, tags, adminCredentials)
}

export type SiteOrm = ReturnType<typeof createOrm>

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
        { provide: ORM, useFactory: createOrm, inject: [DATABASE] },
        { provide: DATABASE_OWNED, useValue: !existingDatabase },
        DatabaseShutdown,
      ],
      exports: [DATABASE, ORM],
    }
  }
}
