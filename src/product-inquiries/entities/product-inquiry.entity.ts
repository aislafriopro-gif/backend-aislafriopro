import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';

@Entity('product_inquiries')
@Index(['productId'])
export class ProductInquiry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 50 })
  phone!: string;

  @Column({ type: 'uuid' })
  productId!: string;

  @ManyToOne(() => Product, { eager: false, nullable: false })
  @JoinColumn({ name: 'productId' })
  product!: Product;

  @Column({ type: 'text' })
  message!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
