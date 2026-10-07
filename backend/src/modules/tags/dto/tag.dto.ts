import { httpData } from '../../../common/errors/result'
import { Transform } from 'class-transformer'
import { IsDefined, IsString } from 'class-validator'
import { normalizeTagColor, normalizeTagDescription, normalizeTagName } from '../tag-normalization'

export class TagDto {
  @Transform(({ value }) => httpData(normalizeTagName(value)))
  @IsDefined()
  @IsString()
  name!: string
  @Transform(({ value }) => httpData(normalizeTagDescription(value)))
  @IsString()
  description: string = ''
  @Transform(({ value }) => httpData(normalizeTagColor(value)))
  @IsDefined()
  @IsString()
  color!: string
}
