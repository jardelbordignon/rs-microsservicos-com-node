export enum ERole {
	SELLER = 'seller',
	BUYER = 'buyer',
}

export interface IUser {
	id: string
	email: string
	firstName: string
	lastName: string
	role: ERole
	status: string
	createdAt: string
	updatedAt: string
}

export interface IAuthDto {
	email: string
	password: string
}

export interface IAuthResponse {
	user: IUser
	token: string
}

export interface IRegisterDto extends IAuthDto {
	firstName: string
	lastName: string
	role: ERole
}

export interface IRegisterResponse {
	id: string
	email: string
	firstName: string
	lastName: string
	role: ERole
	status: string
	createdAt: string
	updatedAt: string
}

export interface IUserInfo {
	id: string
	email: string
	role: ERole
}

export interface IRegisterGatewayResponse {
	user: IRegisterResponse
}

export interface IUserSession {
	valid: boolean
	user: IUser | null
}
