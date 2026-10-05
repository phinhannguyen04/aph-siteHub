import { httpData } from '../../../common/errors/result'
import { Transform } from 'class-transformer'
import {
  IsArray,
  IsDefined,
  IsString,
  IsUUID,
  ArrayMaxSize,
  ArrayUnique,
  IsOptional,
} from 'class-validator'
import { normalizeName, normalizeUrl } from '../website-normalization'

export class CreateWebsiteDto {
  @Transform(({ value }) => httpData(normalizeName(value)))
  @IsDefined({ message: 'Website name is required' })
  @IsString({ message: 'Invalid website name' })
  name!: string

  @Transform(({ value }) => httpData(normalizeUrl(value)))
  @IsDefined({ message: 'URL is required' })
  @IsString({ message: 'Invalid URL' })
  url!: string

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  tag_ids?: string[]
}
