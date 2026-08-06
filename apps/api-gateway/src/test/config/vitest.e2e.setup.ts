import { execSync, spawn } from 'node:child_process'
import path from 'node:path'
import { createDelay } from '@repo/utils'
import { createTestApp } from '../helpers/create-test-app'

interface ServiceDbConfig {
	containerName: string
	dbUser: string
	dbPass: string
	envVarName: string
	defaultDbName: string
}

const SERVICES_DB_CONFIG: ServiceDbConfig[] = [
	{
		containerName: 'users-service-db',
		dbUser: 'postgres',
		dbPass: 'postgres',
		envVarName: 'USERS_DB_NAME',
		defaultDbName: 'users_db',
	},
	{
		containerName: 'products-service-db',
		dbUser: 'postgres',
		dbPass: 'postgres',
		envVarName: 'PRODUCTS_DB_NAME',
		defaultDbName: 'products_db',
	},
	{
		containerName: 'checkout-service-db',
		dbUser: 'postgres',
		dbPass: 'postgres',
		envVarName: 'CHECKOUT_DB_NAME',
		defaultDbName: 'checkout_db',
	},
	{
		containerName: 'payments-service-db',
		dbUser: 'postgres',
		dbPass: 'postgres',
		envVarName: 'PAYMENTS_DB_NAME',
		defaultDbName: 'payments_db',
	},
]

function runPsqlInContainer(
	containerName: string,
	user: string,
	password: string,
	sql: string,
): string {
	return execSync(
		`docker exec ${containerName} psql -U ${user} -c "${sql}"`,
		{
			env: { PGPASSWORD: password, ...process.env },
			stdio: 'pipe',
		},
	)
		.toString()
		.trim()
}

function generateTempDbNames(randomSuffix: string): Record<string, string> {
	const dbNames: Record<string, string> = {}
	for (const config of SERVICES_DB_CONFIG) {
		dbNames[config.envVarName] = `${config.defaultDbName}_${randomSuffix}`
	}
	return dbNames
}

async function createTempDatabases(dbNames: Record<string, string>): Promise<void> {
	for (const config of SERVICES_DB_CONFIG) {
		const tempDbName = dbNames[config.envVarName]
		try {
			runPsqlInContainer(
				config.containerName,
				config.dbUser,
				config.dbPass,
				`CREATE DATABASE ${tempDbName};`,
			)
			console.log(`🗄️ Banco provisório criado: ${tempDbName} (container: ${config.containerName})`)
		} catch (error) {
			const stderr = error instanceof Error ? (error as { stderr?: Buffer }).stderr?.toString() : ''
			if (stderr?.includes('already exists')) {
				console.log(`ℹ️ Banco ${tempDbName} já existe, prosseguindo`)
			} else {
				console.error(`❌ Erro ao criar banco ${tempDbName}:`, error)
				throw error
			}
		}
	}
}

async function dropTempDatabases(dbNames: Record<string, string>): Promise<void> {
	for (const config of SERVICES_DB_CONFIG) {
		const tempDbName = dbNames[config.envVarName]
		if (!tempDbName) continue

		try {
			runPsqlInContainer(
				config.containerName,
				config.dbUser,
				config.dbPass,
				`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${tempDbName}' AND pid <> pg_backend_pid();`,
			)
		} catch {
			// ignora erro ao terminar conexões (pode não haver nenhuma)
		}

		try {
			runPsqlInContainer(
				config.containerName,
				config.dbUser,
				config.dbPass,
				`DROP DATABASE IF EXISTS ${tempDbName};`,
			)
			console.log(`🗑️ Banco provisório removido: ${tempDbName} (container: ${config.containerName})`)
		} catch (error) {
			console.error(`⚠️ Erro ao remover banco ${tempDbName}:`, error)
		}
	}
}

function startAllProjects(dbNames: Record<string, string>) {
	const monorepoRoot = path.resolve(__dirname, '../../../../../')

	turbo = spawn('pnpm', ['start'], {
		cwd: monorepoRoot,
		stdio: 'inherit',
		shell: false,
		env: {
			...process.env,
			...dbNames,
		},
	})
}

async function waitUntilServicesAreReady(serviceNames?: string[]) {
	await createDelay(3000)

	for (let attempt = 1; attempt <= 5; attempt++) {
		const [apiGatewayResponse, servicesResponse] = await Promise.all([
			global.testApp.get('/health'),
			global.testApp.get('/health/services'),
		])

		const isApiGatewayHealthy = apiGatewayResponse.body.status === 'healthy'
		const isServicesHealthy = serviceNames
			? serviceNames.every(
					(name) =>
						servicesResponse.body.services.find((s) => s.name === name)?.status ===
						'healthy',
				)
			: servicesResponse.body.overallStatus === 'healthy'

		if (isApiGatewayHealthy && isServicesHealthy) {
			return true
		}

		await createDelay(1000)
	}

	throw new Error('Services health check failed')
}

let turbo: ReturnType<typeof spawn>
let tempDbNames: Record<string, string> = {}

beforeAll(async () => {
	const randomString = Math.random().toString(36).substring(2, 10)
	tempDbNames = generateTempDbNames(randomString)

	await createTempDatabases(tempDbNames)

	startAllProjects(tempDbNames)
	global.testApp = await createTestApp()
	await waitUntilServicesAreReady()

	console.log('🧪 Setup global iniciado!')
})

afterAll(async () => {
	if (turbo && !turbo.killed) {
		turbo.kill('SIGTERM')
		await new Promise<void>((resolve) => {
			turbo.once('exit', () => resolve())
		})
	}

	await dropTempDatabases(tempDbNames)

	console.log('✅ Setup global finalizado!')
})
