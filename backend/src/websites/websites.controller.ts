import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import { SessionGuard } from '../auth/guards/session.guard'
import { apiError } from '../common/errors/api-error'
import { CreateWebsiteDto } from './dto/create-website.dto'
import { UpdateWebsiteDto } from './dto/update-website.dto'
import { WebsitesService } from './websites.service'

@Controller('api/websites')
@UseGuards(SessionGuard)
export class WebsitesController {
  constructor(private readonly websites: WebsitesService) {}

  @Get()
  async list() {
    return { websites: await this.websites.list() }
  }

  @Get('count')
  async count() {
    return { count: await this.websites.count() }
  }

  @Post()
  async create(@Body() input: CreateWebsiteDto) {
    return { website: await this.websites.create(input) }
  }

  @Patch(':id')
  @HttpCode(200)
  async update(@Param('id') id: string, @Body() input: UpdateWebsiteDto) {
    input.assertHasChanges()
    const website = await this.websites.update(id, input)
    if (!website) throw new HttpException(apiError('NOT_FOUND', 'Website not found'), 404)
    return { website }
  }
}
