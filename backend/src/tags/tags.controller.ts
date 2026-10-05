import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import { httpData } from '../common/errors/result'
import { SessionGuard } from '../auth/guards/session.guard'
import { TagDto } from './dto/tag.dto'
import { TagsService } from './tags.service'
@Controller('api/tags')
@UseGuards(SessionGuard)
export class TagsController {
  constructor(private readonly tags: TagsService) {}
  @Get()
  async list() {
    return { tags: httpData(await this.tags.list()) }
  }
  @Post()
  async create(@Body() input: TagDto) {
    return { tag: httpData(await this.tags.create(input)) }
  }
  @Patch(':id')
  async update(@Param('id') id: string, @Body() input: TagDto) {
    return { tag: httpData(await this.tags.update(id, input)) }
  }
  @Delete(':id')
  @HttpCode(200)
  async delete(@Param('id') id: string) {
    httpData(await this.tags.delete(id))
    return { ok: true }
  }
}
