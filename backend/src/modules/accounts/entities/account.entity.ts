import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity('accounts')
export class AccountEntity {
  @PrimaryColumn({
    type: 'text',
    name: 'account_id',
  })
  id!: string

  @Column({
    type: 'text',
    name: 'provider',
  })
  provider!: string

  @Column({
    type: 'text',
    name: 'name',
  })
  login_name!: string

  @Column({
    type: 'text',
    name: 'external_account_id',
  })
  external_account_id!: string

  /**
   * For login
   */
  @Column({
    type: 'text',
    name: 'email',
  })
  email!: string

  /**
   * For login
   */
  @Column({
    type: 'text',
    name: 'password',
  })
  password!: string

  @Column({
    type: 'text',
    name: 'secret_key_encrypted',
    select: false,
  })
  secret_key_encrypted!: string

  @Column({
    type: 'boolean',
    name: 'is_limit',
    default: false,
  })
  is_limit!: boolean

  @Column({
    type: 'timestamptz',
    name: 'created_at',
  })
  created_at!: Date
}
