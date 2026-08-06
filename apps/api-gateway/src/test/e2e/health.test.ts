const title = '🧪 Health (e2e)'

describe(title, () => {
	beforeAll(() => {
		console.log(title)
	})

	it('GET /health', async () => {
		const response = await global.testApp.get('/health').expect(200)

		expect(response.body).toEqual(
			expect.objectContaining({
				status: 'healthy',
			}),
		)
	})

	it('GET /health/live', async () => {
		const response = await global.testApp.get('/health/live').expect(200)

		expect(response.body).toEqual(
			expect.objectContaining({
				status: 'alive',
			}),
		)
	})
})
