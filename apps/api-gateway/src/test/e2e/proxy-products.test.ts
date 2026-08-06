const title = '🧪 Proxy Products (e2e)'

describe(title, () => {
	beforeAll(() => {
		console.log(title)
	})

	it('GET /products faz proxy para o products-service', async () => {
		const response = await global.testApp.get('/products').expect(200)

		expect(response.body).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					createdAt: expect.any(String),
					description: expect.any(String),
					id: expect.any(String),
					isActive: expect.any(Boolean),
					name: expect.any(String),
					price: expect.any(String),
					sellerId: expect.any(String),
					stock: expect.any(Number),
					updatedAt: expect.any(String),
				}),
			]),
		)
	})

	it('GET /products/:id faz proxy para o products-service', async () => {
		const productsResponse = await global.testApp.get('/products')
		const firstProduct = productsResponse.body[0]

		const { body } = await global.testApp
			.get(`/products/${firstProduct.id}`)
			.expect(200)
		expect(body).toStrictEqual(firstProduct)
	})
})
