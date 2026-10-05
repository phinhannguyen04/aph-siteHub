import {
  DynamicModule,
  Global,
  Inject,
  Injectable,
  Module,
  OnApplicationShutdown,
} from '@nestjs/common'
import type { Connection } from './client'
import { DATABASE, DATABASE_OWNED } from './database.tokens'

const CONNECTION = Symbol('CONNECTION')
@Injectable()
class DatabaseShutdown implements OnApplicationShutdown {
  constructor(
    @Inject(CONNECTION) private readonly connection: Connection,
    @Inject(DATABASE_OWNED) private readonly owned: boolean,
  ) {}
  async onApplicationShutdown(): Promise<void> {
    if (this.owned) {
      const closed = await this.connection.close()
      if (closed.code !== 0) console.error(closed.error.cause ?? closed.error.message)
    }
  }
}
@Global()
@Module({})
export class DatabaseModule {
  static forRoot(connection: Connection, owned: boolean): DynamicModule {
    return {
      module: DatabaseModule,
      providers: [
        {
          provide: CONNECTION,
          useValue: connection,
        },
        {
          provide: DATABASE,
          useFactory: (connection: Connection) => connection.db,
          inject: [CONNECTION],
        },
        { provide: DATABASE_OWNED, useValue: owned },
        DatabaseShutdown,
      ],
      exports: [DATABASE],
    }
  }
}
