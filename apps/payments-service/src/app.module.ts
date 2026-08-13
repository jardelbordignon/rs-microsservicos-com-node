import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { databaseConfig } from './config/database.config'
import { DomainModule } from './domain/domain.module'
import { EventsModule } from './events/events.module'

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),
		TypeOrmModule.forRoot(databaseConfig),
		DomainModule,
		EventsModule,
	],
})
export class AppModule {}
