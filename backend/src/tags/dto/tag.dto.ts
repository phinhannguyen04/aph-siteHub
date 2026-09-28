import { Transform } from 'class-transformer'
import { IsDefined, IsString } from 'class-validator'
import { normalizeTagColor, normalizeTagDescription, normalizeTagName } from '../tag-normalization'
export class TagDto {
  @Transform(({ value }) => normalizeTagName(value))
  @IsDefined()
  @IsString()
  name!: string
  @Transform(({ value }) => normalizeTagDescription(value))
  @IsString()
  description: string = ''
  @Transform(({ value }) => normalizeTagColor(value))
  @IsDefined()
  @IsString()
  color!: string
}
