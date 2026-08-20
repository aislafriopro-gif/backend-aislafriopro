import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Media } from '../../../media/entities/media.entity';
import { Product } from '../../entities/product.entity';

@Entity('product_images')
export class ProductImage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  productId!: string;

  @ManyToOne(() => Product, (product) => product.images, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'productId' })
  product!: Product;

  @Column({ type: 'uuid', nullable: true })
  mediaId!: string | null;

  @ManyToOne(() => Media, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'mediaId' })
  media!: Media | null;

  @Column({ type: 'int', nullable: false, default: 0 })
  displayOrder!: number;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
