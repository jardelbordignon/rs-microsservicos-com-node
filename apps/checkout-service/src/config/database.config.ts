import type { TypeOrmModuleOptions } from '@nestjs/typeorm'

const isDevelopment = process.env.NODE_ENV === 'development'

export const databaseConfig: TypeOrmModuleOptions = {
	type: 'postgres',
	host: process.env.DB_HOST || 'localhost',
	port: Number(process.env.DB_PORT || '5433'),
	username: process.env.DB_USER || 'postgres',
	password: process.env.DB_PASS || 'postgres',
	database: process.env.DB_NAME || 'checkout_db',
	entities: [`${__dirname}/../**/*.entity{.ts,.js}`],
	synchronize: isDevelopment,
	logging: isDevelopment,
}
