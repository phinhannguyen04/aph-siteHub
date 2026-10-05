import { Column, Entity, Index, PrimaryColumn } from 'typeorm'

@Entity('tags')
@Index('tags_name_key_unique', ['nameKey'], { unique: true })
export class TagEntity {
  @PrimaryColumn({ type: 'text', name: 'tag_id' })
  id!: string
  @Column({ type: 'text' })
  name!: string
  @Column({ type: 'text', name: 'name_key' })
  nameKey!: string
  @Column({ type: 'text' })
  description!: string
  @Column({ type: 'text' })
  color!: string
  @Column({ type: 'text' })
  created_at!: string
  @Column({ type: 'text' })
  updated_at!: string
}
