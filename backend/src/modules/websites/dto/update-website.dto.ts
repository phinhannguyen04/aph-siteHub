import { PartialType } from '@nestjs/mapped-types'
import { serviceFailure, success, type ServiceResult } from '../../../common/errors/result'
import { CreateWebsiteDto } from './create-website.dto'

export class UpdateWebsiteDto extends PartialType(CreateWebsiteDto) {
  /** Reject website patches that provide no name, URL, or tag changes. */
  assertHasChanges(): ServiceResult<void> {
    if (this.name === undefined && this.url === undefined && this.tag_ids === undefined) {
      return serviceFailure('VALIDATION_ERROR', 'Provide a website name, URL or tags', 400)
    }

    return success(undefined)
  }
}
