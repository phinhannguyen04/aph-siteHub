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
  /** Receive the service handling account operations for authenticated requests. */
  constructor(private readonly accounts: AccountsService) {}

  /** Return public account records without passwords or encrypted secret keys. */
  @Get()
  async list() {
    return { accounts: httpData(await this.accounts.list()) }
  }

  /** Return account totals and provider-level counts grouped by limit status. */
  @Get('stats')
  async getStats() {
    return { stats: httpData(await this.accounts.getStats()) }
  }

  /** Return public details for one account or translate a missing account into a 404 response. */
  @Get(':id')
  async findById(@Param('id') id: string) {
    return { account: httpData(await this.accounts.findById(id)) }
  }

  /**
   * Return the decrypted account secret with caching disabled for the authenticated
   * administrator.
   */
  @Get(':id/secret-key')
  @Header('Cache-Control', 'no-store')
  async getSecretKey(@Param('id') id: string) {
    return { secret_key: httpData(await this.accounts.getSecretKey(id)) }
  }

  /** Create an account from validated input and return its public fields. */
  @Post()
  async create(@Body() input: AccountDto) {
    return { account: httpData(await this.accounts.create(input)) }
  }

  /**
   * Reject an empty patch, update the supplied credentials or limit status, and return
   * public account fields.
   */
  @Patch(':id')
  async update(@Param('id') id: string, @Body() input: UpdateAccountDto) {
    httpData(input.assertHasChanges())

    return { account: httpData(await this.accounts.update(id, input)) }
  }

  /** Delete an account and acknowledge success, returning 404 when the account does not exist. */
  @Delete(':id')
  @HttpCode(200)
  async delete(@Param('id') id: string) {
    httpData(await this.accounts.delete(id))

    return { ok: true }
  }
}
