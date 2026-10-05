import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { AccountEntity } from "./entities/account.entity";
import { Repository } from "typeorm";
import { ServiceResult } from "../../common/errors/result";
import { query } from "../../database/error";

@Injectable()
export class AccountsRepository {
    constructor(@InjectRepository(AccountEntity) private readonly accounts: Repository<AccountEntity>) {}

    list(): Promise<ServiceResult<AccountEntity[]>> {
        return query(() => this.accounts.find({ order: {created_at: 'ASC'}}))
    }

    create(row: AccountEntity): Promise<ServiceResult<AccountEntity>> {
        return query(async () => {
            await this.accounts.insert(row)
            return row
        })
    }

    update(
        id: string,
        changes: Pick<AccountEntity, 'password' | 'secret_key_encrypted' | 'is_limit'>
    ): Promise<ServiceResult<AccountEntity | null>> {
        return query(() => 
            this.accounts.manager.transaction(async (tx) => {
                const repo = tx.getRepository(AccountEntity)
                const write = await repo.update(id, changes)
                
                if (!write.affected) {
                    return null
                }
                return repo.findOneBy({ id })
            })
        )
    }

    delete(id: string): Promise<ServiceResult<boolean>> {
        return query(async () => Boolean((await this.accounts.delete(id))))
    }

    findById(id: string): Promise<ServiceResult< AccountEntity| null>> {
        return query(() => this.accounts.findOneBy({ id }))
    }

    /**
     * Kiểm tra account trùng trước khi tạo
     */
    findByProviderAndExternalId() {
        
    }

    /**
     * Tổng account, thống kê theo provider và trạng thái
     */
    getStats() {

    }
}