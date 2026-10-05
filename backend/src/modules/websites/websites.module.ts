import { TypeOrmModule } from '@nestjs/typeorm'
import { WebsiteEntity } from './entities/website.entity'
import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { WebsitesController } from './websites.controller'
import { WebsitesService } from './websites.service'

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([WebsiteEntity])],
  controllers: [WebsitesController],
  providers: [WebsitesService],
})
export class WebsitesModule {}
