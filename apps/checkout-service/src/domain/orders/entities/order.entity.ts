import {
	Column,
	CreateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm'
import { EOrderStatus } from '../enums/order-status.enum'

@Entity('orders')
export class Order {
	@PrimaryGeneratedColumn('uuid')
	id: string

	@Column('uuid')
	userId: string

	@Column('uuid')
	cartId: string

	@Column({
		type: 'decimal',
		precision: 10,
		scale: 2,
	})
	amount: string

	@Column({
		type: 'enum',
		enum: EOrderStatus,
		default: EOrderStatus.PENDING,
	})
	status: EOrderStatus

	@Column({ type: 'varchar', length: 50 })
	paymentMethod: string

	@CreateDateColumn()
	createdAt: Date

	@UpdateDateColumn()
	updatedAt: Date
}
