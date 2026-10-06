import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import { httpData } from '../../common/errors/result'
import { SessionGuard } from '../auth/guards/session.guard'
import { AccountDto } from './dto/account.dto'
import { UpdateAccountDto } from './dto/update-account.dto'
import { AccountsService } from './accounts.service'

@Controller('api/accounts')
@UseGuards(SessionGuard)
export class AccountsController {
  constructor(private readonly accounts: AccountsService) {}

  @Get()
  async list() {
    return { accounts: httpData(await this.accounts.list()) }
  }

  @Get('stats')
  async getStats() {
    return { stats: httpData(await this.accounts.getStats()) }
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return { account: httpData(await this.accounts.findById(id)) }
  }

  @Get(':id/secret-key')
  @Header('Cache-Control', 'no-store')
  async getSecretKey(@Param('id') id: string) {
    return { secret_key: httpData(await this.accounts.getSecretKey(id)) }
  }

  @Post()
  async create(@Body() input: AccountDto) {
    return { account: httpData(await this.accounts.create(input)) }
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() input: UpdateAccountDto) {
    httpData(input.assertHasChanges())
    return { account: httpData(await this.accounts.update(id, input)) }
  }

  @Delete(':id')
  @HttpCode(200)
  async delete(@Param('id') id: string) {
    httpData(await this.accounts.delete(id))
    return { ok: true }
  }
}
