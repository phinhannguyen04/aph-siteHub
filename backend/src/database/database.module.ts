import {
  DynamicModule,
  Global,
  Inject,
  Injectable,
  Module,
  OnApplicationShutdown,
} from '@nestjs/common'
import { httpData } from '../common/errors/result'
import type { AppConfig } from '../config/app-config'
import { APP_CONFIG } from '../config/config.tokens'
import { connectDb, type Connection, type Database } from './client'
import { DATABASE, DATABASE_OWNED } from './database.tokens'

const CONNECTION = Symbol('CONNECTION')
@Injectable()
class DatabaseShutdown implements OnApplicationShutdown {
  constructor(
    @Inject(CONNECTION) private readonly connection: Connection,
    @Inject(DATABASE_OWNED) private readonly owned: boolean,
  ) {}
  async onApplicationShutdown(): Promise<void> {
    if (this.owned) await this.connection.close()
  }
}
@Global()
@Module({})
export class DatabaseModule {
  static forRoot(existingDatabase?: Database): DynamicModule {
    return {
      module: DatabaseModule,
      providers: [
        {
          provide: CONNECTION,
          useFactory: async (config: AppConfig): Promise<Connection> =>
            existingDatabase
              ? { db: existingDatabase, close: async () => {} }
              : httpData(await connectDb(config)),
          inject: [APP_CONFIG],
        },
        {
          provide: DATABASE,
          useFactory: (connection: Connection) => connection.db,
          inject: [CONNECTION],
        },
        { provide: DATABASE_OWNED, useValue: !existingDatabase },
        DatabaseShutdown,
      ],
      exports: [DATABASE],
    }
  }
}
