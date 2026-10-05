import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { SessionGuard } from '../auth/guards/session.guard'
import { httpData } from '../common/errors/result'
import { CreateWebsiteDto } from './dto/create-website.dto'
import { UpdateWebsiteDto } from './dto/update-website.dto'
import { parseListQuery } from './list-query'
import { WebsitesService } from './websites.service'

@Controller('api/websites')
@UseGuards(SessionGuard)
export class WebsitesController {
  constructor(private readonly websites: WebsitesService) {}

  @Get()
  async list(@Query() query: Record<string, unknown>) {
    return httpData(await this.websites.list(httpData(parseListQuery(query))))
  }

  @Get('count')
  async count() {
    return { count: httpData(await this.websites.count()) }
  }

  @Post()
  async create(@Body() input: CreateWebsiteDto) {
    return { website: httpData(await this.websites.create(input)) }
  }

  @Patch(':id')
  @HttpCode(200)
  async update(@Param('id') id: string, @Body() input: UpdateWebsiteDto) {
    httpData(input.assertHasChanges())
    const website = httpData(await this.websites.update(id, input))
    return { website }
  }
}
