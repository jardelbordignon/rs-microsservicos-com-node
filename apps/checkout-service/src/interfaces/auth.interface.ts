export enum ERole {
	SELLER = 'seller',
	BUYER = 'buyer',
}

export interface IUserInfo {
	id: string
	email: string
	role: ERole
}
