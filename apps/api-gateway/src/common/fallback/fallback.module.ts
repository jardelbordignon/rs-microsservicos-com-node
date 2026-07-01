import { Module } from '@nestjs/common'
import { FallbackService } from './fallback.service'

@Module({
	providers: [FallbackService],
	exports: [FallbackService],
})
export class FallbackModule {}
