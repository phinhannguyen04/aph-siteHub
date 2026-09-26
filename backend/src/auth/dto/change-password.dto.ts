import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator'
import { ValidationError } from '../../common/errors/validation-error'

export class ChangePasswordDto {
  @IsString({ message: 'Current password is required' })
  @IsNotEmpty({ message: 'Current password is required' })
  @MaxLength(256, { message: 'Current password must be at most 256 characters' })
  currentPassword!: string

  @IsString({ message: 'Invalid new password' })
  @MinLength(12, { message: 'New password must be between 12 and 256 characters' })
  @MaxLength(256, { message: 'New password must be between 12 and 256 characters' })
  @Matches(/\S/, { message: 'New password cannot be blank' })
  newPassword!: string

  assertDifferent(): void {
    if (this.currentPassword === this.newPassword)
      throw new ValidationError('New password must differ from the current password')
  }
}
