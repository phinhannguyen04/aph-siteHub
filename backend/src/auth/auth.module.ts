import { TypeOrmModule } from '@nestjs/typeorm'
import { AdminCredentialEntity } from './entities/admin-credential.entity'
import { Module } from '@nestjs/common'
import { AuthController } from './auth.controller'
import { SessionGuard } from './guards/session.guard'
import { CredentialsService } from './credentials.service'

@Module({
  imports: [TypeOrmModule.forFeature([AdminCredentialEntity])],
  controllers: [AuthController],
  providers: [CredentialsService, SessionGuard],
  exports: [CredentialsService, SessionGuard],
})
export class AuthModule {}
