import { TypeOrmModule } from '@nestjs/typeorm'
import { TagEntity } from './entities/tag.entity'
import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { TagsController } from './tags.controller'
import { TagsService } from './tags.service'
@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([TagEntity])],
  controllers: [TagsController],
  providers: [TagsService],
  exports: [TagsService],
})
export class TagsModule {}
