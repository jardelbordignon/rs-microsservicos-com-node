const title = '🧪 Proxy Users (e2e)'

describe(title, () => {
	beforeAll(() => {
		console.log(title)
	})

	const randomString = Math.random().toString(36).substring(2, 10)
	const randomEmail = `user-${randomString}@email.com`
	const userResponseExpect = expect.objectContaining({
		createdAt: expect.any(String),
		email: randomEmail,
		firstName: 'Jardel',
		id: expect.any(String),
		lastName: 'Bordignon',
		role: 'seller',
		status: 'active',
		updatedAt: expect.any(String),
	})

	it('POST /users/register faz proxy para o users-service', async () => {
		const userData = {
			email: randomEmail,
			password: 'Pwd@123',
			firstName: 'Jardel',
			lastName: 'Bordignon',
			role: 'seller',
		}

		console.log('userData', userData)

		const response = await global.testApp
			.post('/users/register')
			.send(userData)
			.expect(201)

		expect(response.body).toEqual(userResponseExpect)
	})

	it('POST /users/login faz proxy para o users-service', async () => {
		const response = await global.testApp
			.post('/users/login')
			.send({ email: randomEmail, password: 'Pwd@123' })
			.expect(200)

		expect(response.body).toEqual(
			expect.objectContaining({
				token: expect.any(String),
				user: userResponseExpect,
			}),
		)
	})
})
