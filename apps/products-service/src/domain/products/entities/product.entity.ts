import {
	Column,
	CreateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm'

@Entity('products')
export class Product {
	@PrimaryGeneratedColumn('uuid')
	id: string

	@Column({ type: 'varchar', length: 255, nullable: false })
	name: string

	@Column({ type: 'text', nullable: false })
	description: string

	@Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
	price: string

	@Column({ type: 'int', default: 0, nullable: false })
	stock: number

	@Column({ type: 'uuid', name: 'seller_id', nullable: false })
	sellerId: string

	@Column({ type: 'boolean', name: 'is_active', default: true, nullable: false })
	isActive: boolean

	@CreateDateColumn({ name: 'created_at' })
	createdAt: Date

	@UpdateDateColumn({ name: 'updated_at' })
	updatedAt: Date
}
