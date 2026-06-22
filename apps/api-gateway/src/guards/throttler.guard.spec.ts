import { Reflector } from '@nestjs/core'
import { Test } from '@nestjs/testing'
import { ThrottlerModuleOptions, ThrottlerStorage } from '@nestjs/throttler'

import { CustomThrottlerGuard } from './throttler.guard'

describe('CustomThrottlerGuard', () => {
	let guard: CustomThrottlerGuard

	beforeEach(async () => {
		const moduleRef = await Test.createTestingModule({
			providers: [
				CustomThrottlerGuard,
				{
					provide: Reflector,
					useClass: Reflector,
				},
				{
					provide: 'THROTTLER:MODULE_OPTIONS',
					useValue: {
						throttlers: [],
					} satisfies ThrottlerModuleOptions,
				},
				{
					provide: ThrottlerStorage,
					useValue: {
						increment: jest.fn().mockResolvedValue({
							isBlocked: false,
							timeToBlockExpire: 1,
							timeToExpire: 1,
							totalHits: 1,
						}),
					},
				},
			],
		}).compile()

		guard = moduleRef.get(CustomThrottlerGuard)
	})

	it('should be defined', () => {
		expect(guard).toBeDefined()
	})
})
