import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity('admin_credentials')
export class AdminCredentialEntity {
  @PrimaryColumn({ type: 'text' })
  id!: string
  @Column({ type: 'text' })
  password_hash!: string
  @Column({ type: 'text' })
  version!: string
}
