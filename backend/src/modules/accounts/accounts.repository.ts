import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { AccountEntity } from './entities/account.entity'
import { Repository } from 'typeorm'
import { ServiceResult } from '../../common/errors/result'
import { query } from '../../database/error'
import type { AccountStats } from './account.interface'

@Injectable()
export class AccountsRepository {
  constructor(
    @InjectRepository(AccountEntity) private readonly accounts: Repository<AccountEntity>,
  ) {}

  list(): Promise<ServiceResult<AccountEntity[]>> {
    return query(() => this.accounts.find({ order: { created_at: 'ASC' } }))
  }

  create(row: AccountEntity): Promise<ServiceResult<AccountEntity>> {
    return query(async () => {
      await this.accounts.insert(row)
      return row
    })
  }

  update(
    id: string,
    changes: Partial<Pick<AccountEntity, 'password' | 'secret_key_encrypted' | 'is_limit'>>,
  ): Promise<ServiceResult<AccountEntity | null>> {
    return query(() =>
      this.accounts.manager.transaction(async (tx) => {
        const repo = tx.getRepository(AccountEntity)
        const write = await repo.update(id, changes)

        if (!write.affected) {
          return null
        }
        return repo.findOneBy({ id })
      }),
    )
  }

  delete(id: string): Promise<ServiceResult<boolean>> {
    return query(async () => Boolean((await this.accounts.delete(id)).affected))
  }

  findById(id: string): Promise<ServiceResult<AccountEntity | null>> {
    return query(() => this.accounts.findOneBy({ id }))
  }

  findWithSecretById(id: string): Promise<ServiceResult<AccountEntity | null>> {
    return query(() =>
      this.accounts
        .createQueryBuilder('account')
        .addSelect('account.secret_key_encrypted')
        .where('account.id = :id', { id })
        .getOne(),
    )
  }

  /**
   * Check whether the provider and external ID already identify an account.
   */
  findByProviderAndExternalId(
    provider: string,
    externalId: string,
  ): Promise<ServiceResult<boolean>> {
    return query(() => this.accounts.existsBy({ provider, external_account_id: externalId }))
  }

  /**
   * Count accounts by provider and limit status.
   */
  getStats(): Promise<ServiceResult<AccountStats>> {
    return query(async () => {
      const rows = await this.accounts
        .createQueryBuilder('account')
        .select('account.provider', 'provider')
        .addSelect('COUNT(*)', 'total')
        .addSelect('COUNT(*) FILTER (WHERE account.is_limit = true)', 'limited')
        .groupBy('account.provider')
        .orderBy('account.provider', 'ASC')
        .getRawMany<{ provider: string; total: string; limited: string }>()

      const providers = rows.map((row) => {
        const total = Number(row.total)
        const limited = Number(row.limited)
        return { provider: row.provider, total, limited, unlimited: total - limited }
      })

      return {
        total: providers.reduce((sum, provider) => sum + provider.total, 0),
        limited: providers.reduce((sum, provider) => sum + provider.limited, 0),
        unlimited: providers.reduce((sum, provider) => sum + provider.unlimited, 0),
        providers,
      }
    })
  }
}
