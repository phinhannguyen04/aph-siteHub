import { PartialType, PickType } from '@nestjs/mapped-types'
import { serviceFailure, success, type ServiceResult } from '../../../common/errors/result'
import { AccountDto } from './account.dto'

export class UpdateAccountDto extends PartialType(
  PickType(AccountDto, ['password', 'secret_key', 'is_limit'] as const),
  { skipNullProperties: false },
) {
  assertHasChanges(): ServiceResult<void> {
    if (
      this.password === undefined &&
      this.secret_key === undefined &&
      this.is_limit === undefined
    ) {
      return serviceFailure('VALIDATION_ERROR', 'Provide at least one account field to update', 400)
    }
    return success(undefined)
  }
}
