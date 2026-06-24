import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'
import { ERole, type IRegisterDto } from '@/interfaces/auth.interface'
import { LoginDto } from './login.dto'

export class RegisterDto extends LoginDto implements IRegisterDto {
	@ApiProperty({
		description: 'User name',
		example: 'John Doe',
	})
	@IsString()
	name: string

	@ApiProperty({
		description: 'User role',
		example: 'user',
	})
	@IsOptional()
	@IsString()
	role?: ERole = ERole.USER
}
