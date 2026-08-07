// CLI katmani: fixture'i okur, db.json'i BASTAN URETIR (ekleme degil, tam degistirme).
// Yikici oldugu bilincli — README'nin "baslangic verisine don" tarifinin otomatik hali.
import { readFileSync, writeFileSync } from 'node:fs'
import { buildDatabase } from './seed.js'

const fixtureUrl = new URL('./seed-fixture.json', import.meta.url)
const databaseUrl = new URL('./db.json', import.meta.url)

const fixture = JSON.parse(readFileSync(fixtureUrl, 'utf8'))
const database = buildDatabase(fixture)

writeFileSync(databaseUrl, `${JSON.stringify(database, null, 2)}\n`)

console.log(
  `db.json uretildi: ${database.products.length} urun, ${database.customers.length} musteri, ${database.orders.length} siparis.`,
)
