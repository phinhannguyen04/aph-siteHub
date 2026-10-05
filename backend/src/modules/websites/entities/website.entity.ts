import { Column, Entity, Index, PrimaryColumn } from 'typeorm'

@Entity('websites')
@Index('websites_created_id_idx', ['created_at', 'id'])
export class WebsiteEntity {
  @PrimaryColumn({ type: 'text', name: 'website_id' })
  id!: string
  @Column({ type: 'text' })
  name!: string
  @Column({ type: 'text' })
  url!: string
  @Column({ type: 'text', name: 'search_text' })
  searchText!: string
  @Column({ type: 'text' })
  created_at!: string
  @Column({ type: 'text' })
  updated_at!: string
}
