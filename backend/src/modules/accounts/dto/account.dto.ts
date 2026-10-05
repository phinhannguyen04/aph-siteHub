import { Transform } from 'class-transformer'
import {
  IsBoolean,
  IsDateString,
  IsDefined,
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
} from 'class-validator'

export class AccountDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  provider!: string

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  login_name!: string

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  external_account_id!: string

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsEmail()
  email!: string

  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'Password cannot be blank' })
  password!: string

  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'Secret key cannot be blank' })
  secret_key!: string

  @IsDefined()
  @IsBoolean()
  is_limit!: boolean

  @IsDefined()
  @IsDateString({ strict: true })
  created_at!: string
}
