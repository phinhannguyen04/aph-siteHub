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
import { httpData } from '../../common/errors/result'
import { CreateWebsiteDto } from './dto/create-website.dto'
import { UpdateWebsiteDto } from './dto/update-website.dto'
import { parseListQuery } from './list-query'
import { WebsitesService } from './websites.service'

@Controller('api/websites')
@UseGuards(SessionGuard)
export class WebsitesController {
  /** Receive the service handling website operations for authenticated requests. */
  constructor(private readonly websites: WebsitesService) {}

  /** Validate query parameters and return a filtered website page with pagination metadata. */
  @Get()
  async list(@Query() query: Record<string, unknown>) {
    return httpData(await this.websites.list(httpData(parseListQuery(query))))
  }

  /** Return the total number of saved websites independently of list filters. */
  @Get('count')
  async count() {
    return { count: httpData(await this.websites.count()) }
  }

  /** Create a website with its selected tags and return the public website response. */
  @Post()
  async create(@Body() input: CreateWebsiteDto) {
    return { website: httpData(await this.websites.create(input)) }
  }

  /**
   * Reject an empty patch, update the website and supplied tag links, and return the
   * public response.
   */
  @Patch(':id')
  @HttpCode(200)
  async update(@Param('id') id: string, @Body() input: UpdateWebsiteDto) {
    httpData(input.assertHasChanges())
    const website = httpData(await this.websites.update(id, input))

    return { website }
  }
}
