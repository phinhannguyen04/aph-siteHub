import { PartialType } from '@nestjs/mapped-types'
import { ValidationError } from '../../common/errors/validation-error'
import { CreateWebsiteDto } from './create-website.dto'

export class UpdateWebsiteDto extends PartialType(CreateWebsiteDto) {
  assertHasChanges(): void {
    if (this.name === undefined && this.url === undefined && this.tag_ids === undefined)
      throw new ValidationError('Provide a website name, URL or tags')
  }
}
