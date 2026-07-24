import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ProxyModule } from '@/proxy/proxy.module'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'

@Module({
	imports: [ProxyModule, HttpModule, JwtModule],
	controllers: [UsersController],
	providers: [UsersService],
})
export class UsersModule {}
