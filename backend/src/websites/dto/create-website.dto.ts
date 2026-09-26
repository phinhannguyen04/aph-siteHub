import { Transform } from 'class-transformer'
import { IsDefined, IsString } from 'class-validator'
import { normalizeName, normalizeUrl } from '../website-normalization'

export class CreateWebsiteDto {
  @Transform(({ value }) => normalizeName(value))
  @IsDefined({ message: 'Website name is required' })
  @IsString({ message: 'Invalid website name' })
  name!: string

  @Transform(({ value }) => normalizeUrl(value))
  @IsDefined({ message: 'URL is required' })
  @IsString({ message: 'Invalid URL' })
  url!: string
}
