import {
	Column,
	CreateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm'

export enum UserRole {
	SELLER = 'seller',
	BUYER = 'buyer',
}

export enum UserStatus {
	ACTIVE = 'active',
	INACTIVE = 'inactive',
	PENDING = 'pending',
	BLOCKED = 'blocked',
}

@Entity('users')
export class User {
	@PrimaryGeneratedColumn('uuid')
	id: string

	@Column({ type: 'varchar', unique: true, nullable: false })
	email: string

	@Column({ type: 'varchar', nullable: false })
	password: string

	@Column({ type: 'varchar', name: 'first_name', nullable: false })
	firstName: string

	@Column({ type: 'varchar', name: 'last_name', nullable: false })
	lastName: string

	@Column({
		type: 'enum',
		enum: UserRole,
		nullable: false,
	})
	role: UserRole

	@Column({
		type: 'enum',
		enum: UserStatus,
		default: UserStatus.ACTIVE,
		nullable: false,
	})
	status: UserStatus

	@CreateDateColumn({ name: 'created_at' })
	createdAt: Date

	@UpdateDateColumn({ name: 'updated_at' })
	updatedAt: Date
}
