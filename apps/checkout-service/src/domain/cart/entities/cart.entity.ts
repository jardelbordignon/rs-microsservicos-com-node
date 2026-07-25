import {
	Column,
	CreateDateColumn,
	Entity,
	OneToMany,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm'
import { ECartStatus } from '../enums/cart-status.enum'
import { CartItem } from './cart-item.entity'

@Entity('carts')
export class Cart {
	@PrimaryGeneratedColumn('uuid')
	id: string

	@Column('uuid')
	userId: string

	@Column({
		type: 'enum',
		enum: ECartStatus,
		default: ECartStatus.ACTIVE,
	})
	status: ECartStatus

	@Column({
		type: 'decimal',
		precision: 10,
		scale: 2,
		default: 0,
	})
	amount: string

	@OneToMany(
		() => CartItem,
		(item) => item.cart,
		{
			cascade: true,
			eager: true,
		},
	)
	items: CartItem[]

	@CreateDateColumn()
	createdAt: Date

	@UpdateDateColumn()
	updatedAt: Date
}
