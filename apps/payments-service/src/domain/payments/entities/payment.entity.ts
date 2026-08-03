import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm'
import { EPaymentStatus } from '../enums/payment-status.enum'

@Entity('payments')
export class Payment {
	@PrimaryGeneratedColumn('uuid')
	id: string

	@Index({ unique: true })
	@Column({ type: 'uuid', name: 'order_id', nullable: false })
	orderId: string

	@Column({ type: 'uuid', name: 'user_id', nullable: false })
	userId: string

	@Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
	amount: string

	@Column({
		type: 'enum',
		enum: EPaymentStatus,
		default: EPaymentStatus.PENDING,
		nullable: false,
	})
	status: EPaymentStatus

	@Column({ type: 'varchar', length: 50, nullable: false, name: 'payment_method' })
	paymentMethod: string

	@Column({ type: 'varchar', length: 255, nullable: true, name: 'transaction_id' })
	transactionId: string | null

	@Column({ type: 'varchar', length: 255, nullable: true, name: 'rejection_reason' })
	rejectionReason: string | null

	@Column({ type: 'timestamp', nullable: true, name: 'processed_at' })
	processedAt: Date | null

	// Controle de lease
	@Column({ type: 'timestamp', nullable: true, name: 'processing_started_at' })
	processingStartedAt: Date | null

	@Column({
		type: 'uuid',
		nullable: true,
		name: 'processing_token',
	})
	processingToken: string | null

	@Column({
		type: 'timestamp',
		nullable: true,
		name: 'result_event_published_at',
	})
	resultEventPublishedAt: Date | null

	@CreateDateColumn({ type: 'timestamp', name: 'created_at' })
	createdAt: Date

	@UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
	updatedAt: Date
}
