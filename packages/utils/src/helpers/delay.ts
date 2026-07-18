export async function createDelay(ms: number) {
	await new Promise((resolve) => setTimeout(resolve, ms))
}
