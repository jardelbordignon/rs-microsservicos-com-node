export const serviceNames = ['users', 'products', 'checkout', 'payments'] as const

export type TServiceName = (typeof serviceNames)[number]

export type TServiceConfig = Record<TServiceName, { url: string; timeout: number }>

export const getServiceConfig = (): TServiceConfig => ({
	users: {
		url: process.env.USERS_SERVICE_URL ?? '',
		timeout: 10000,
	},
	products: {
		url: process.env.PRODUCTS_SERVICE_URL ?? '',
		timeout: 10000,
	},
	checkout: {
		url: process.env.CHECKOUT_SERVICE_URL ?? '',
		timeout: 10000,
	},
	payments: {
		url: process.env.PAYMENTS_SERVICE_URL ?? '',
		timeout: 10000,
	},
})

export const getService = (serviceName: TServiceName) =>
	getServiceConfig()[serviceName]
