import { IsNotEmpty, IsString, MaxLength } from 'class-validator'

export class LoginDto {
  @IsString({ message: 'Password is required' })
  @IsNotEmpty({ message: 'Password is required' })
  @MaxLength(256, { message: 'Password must be at most 256 characters' })
  password!: string
}
