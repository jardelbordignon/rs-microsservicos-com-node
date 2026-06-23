import { Reflector } from '@nestjs/core'
import { Test } from '@nestjs/testing'
import { JwtAuthGuard } from './auth.guard'

describe('JwtAuthGuard', () => {
	let guard: JwtAuthGuard

	beforeEach(async () => {
		const moduleRef = await Test.createTestingModule({
			providers: [
				JwtAuthGuard,
				{
					provide: Reflector,
					useClass: Reflector,
				},
			],
		}).compile()

		guard = moduleRef.get(JwtAuthGuard)
	})

	it('should be defined', () => {
		expect(guard).toBeDefined()
	})
})
