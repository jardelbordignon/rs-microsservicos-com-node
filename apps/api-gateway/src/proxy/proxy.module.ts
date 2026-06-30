import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { CircuitBreakerModule } from '@/common/circuit-breaker/circuit-breaker.module'
import { ProxyService } from './service/proxy.service'

@Module({
	imports: [CircuitBreakerModule, HttpModule],
	providers: [ProxyService],
	exports: [ProxyService],
})
export class ProxyModule {}
