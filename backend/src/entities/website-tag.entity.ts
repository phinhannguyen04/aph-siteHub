import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn, type Relation } from 'typeorm'
import { TagEntity } from './tag.entity'
import { WebsiteEntity } from './website.entity'

@Entity('website_tags')
@Index('website_tags_tag_idx', ['tagId'])
export class WebsiteTagEntity {
  @PrimaryColumn({ type: 'text', name: 'website_id' })
  websiteId!: string
  @PrimaryColumn({ type: 'text', name: 'tag_id' })
  tagId!: string
  @Column({ type: 'integer' })
  position!: number
  @ManyToOne(() => WebsiteEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'website_id', referencedColumnName: 'id' })
  website!: Relation<WebsiteEntity>
  @ManyToOne(() => TagEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tag_id', referencedColumnName: 'id' })
  tag!: Relation<TagEntity>
}
