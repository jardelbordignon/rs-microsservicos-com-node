import { execSync } from 'node:child_process'

const ports = [4001, 4002, 4003, 4004, 4005]

for (const port of ports) {
  try {
    execSync(`kill -9 $(lsof -t -i:${port})`, { stdio: 'ignore' })
    console.log(`✔ Porta ${port} liberada`)
  } catch {
    // nenhuma aplicação usando a porta
  }
}