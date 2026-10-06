import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from '../auth/auth.module'
import { AccountEntity } from './entities/account.entity'
import { AccountsController } from './accounts.controller'
import { AccountsRepository } from './accounts.repository'
import { AccountsService } from './accounts.service'
import { AccountSecretService } from './account-secret.service'

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([AccountEntity])],
  controllers: [AccountsController],
  providers: [AccountsRepository, AccountsService, AccountSecretService],
  exports: [AccountsService],
})
export class AccountsModule {}
