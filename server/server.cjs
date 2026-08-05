const path = require('node:path')
const { randomUUID } = require('node:crypto')
const jsonServer = require('json-server')

const server = jsonServer.create()
const router = jsonServer.router(path.join(__dirname, 'db.json'))
const delayArgument = process.argv.find((argument) => argument.startsWith('--delay='))
const delay = delayArgument ? Number(delayArgument.split('=')[1]) : 0

server.use(jsonServer.defaults())
server.use(jsonServer.bodyParser)

if (Number.isFinite(delay) && delay > 0) {
  server.use((_request, _response, next) => setTimeout(next, delay))
}

server.post('/orders', (request, response) => {
  const { customerId, items } = request.body ?? {}

  if (typeof customerId !== 'string' || !Array.isArray(items) || items.length === 0) {
    return response.status(400).json({ message: 'Musteri ve en az bir siparis kalemi gereklidir.' })
  }

  const customer = router.db.get('customers').find({ id: customerId }).value()

  if (!customer) {
    return response.status(404).json({ message: 'Musteri bulunamadi.' })
  }

  const requestedQuantities = new Map()

  for (const item of items) {
    if (typeof item?.productId !== 'string' || !Number.isInteger(item.quantity) || item.quantity <= 0) {
      return response.status(400).json({ message: 'Gecersiz siparis kalemi.' })
    }

    requestedQuantities.set(item.productId, (requestedQuantities.get(item.productId) ?? 0) + item.quantity)
  }

  const products = []

  for (const [productId, quantity] of requestedQuantities) {
    const product = router.db.get('products').find({ id: productId }).value()

    if (!product || !product.active) {
      return response.status(404).json({ message: 'Siparisteki urunlerden biri bulunamadi.' })
    }

    if (product.stock < quantity) {
      return response.status(409).json({ message: `${product.name} icin yeterli stok yok.` })
    }

    products.push({ product, quantity })
  }

  const createdAt = new Date().toISOString()
  const orderItems = products.map(({ product, quantity }) => ({
    productId: product.id,
    productName: product.name,
    quantity,
    unitPrice: product.price,
    lineTotal: product.price * quantity,
  }))
  const order = {
    id: `ord-${randomUUID()}`,
    customerId,
    status: 'pending',
    total: orderItems.reduce((total, item) => total + item.lineTotal, 0),
    createdAt,
    items: orderItems,
  }

  for (const { product, quantity } of products) {
    router.db
      .get('products')
      .find({ id: product.id })
      .assign({ stock: product.stock - quantity, updatedAt: createdAt })
      .write()
  }

  router.db.get('orders').push(order).write()
  return response.status(201).json(order)
})

server.patch('/orders/:id', (request, response) => {
  const existingOrder = router.db.get('orders').find({ id: request.params.id }).value()

  if (!existingOrder) {
    return response.status(404).json({ message: 'Siparis bulunamadi.' })
  }

  const { status, cancelReason } = request.body ?? {}

  if (!['pending', 'paid', 'shipped', 'cancelled'].includes(status)) {
    return response.status(400).json({ message: 'Gecersiz siparis durumu.' })
  }

  router.db
    .get('orders')
    .find({ id: existingOrder.id })
    .assign({
      status,
      // undefined atanan key'ler JSON'a yazilmaz; durumla ilgisiz alanlar boylece temizlenir.
      trackingNumber:
        status === 'shipped'
          ? existingOrder.trackingNumber ?? `TRK-${randomUUID().slice(0, 8).toUpperCase()}`
          : undefined,
      cancelReason: status === 'cancelled' ? cancelReason ?? 'Belirtilmedi' : undefined,
    })
    .write()

  return response.json(router.db.get('orders').find({ id: existingOrder.id }).value())
})

// json-server'in hazir sorgulari yetmiyor: arama ad VEYA SKU'da calisir,
// dusuk stok ise iki alanin karsilastirmasidir (stock <= reorderLevel).
server.get('/products', (request, response) => {
  const { search, categoryId, stock, _page, _limit } = request.query

  let products = router.db.get('products').value()

  if (typeof search === 'string' && search.trim() !== '') {
    // Veri sozlesmesi ASCII (diakritiksiz); tr-TR locale burada I->i donusumunu bozar.
    const term = search.trim().toLowerCase()
    products = products.filter((product) =>
      `${product.name} ${product.sku}`.toLowerCase().includes(term),
    )
  }

  if (typeof categoryId === 'string' && categoryId !== '') {
    products = products.filter((product) => product.categoryId === categoryId)
  }

  if (stock === 'low' || stock === 'in-stock') {
    products = products.filter(
      (product) => (product.stock <= product.reorderLevel) === (stock === 'low'),
    )
  }

  // Toplam, sayfalama uygulanmadan onceki filtrelenmis sayidir.
  response.set('X-Total-Count', String(products.length))
  // Cross-origin istemci bu header'i ancak expose edilirse okuyabilir.
  response.set('Access-Control-Expose-Headers', 'X-Total-Count')

  const page = Number(_page)
  const limit = Number(_limit)

  if (Number.isInteger(page) && page > 0 && Number.isInteger(limit) && limit > 0) {
    products = products.slice((page - 1) * limit, page * limit)
  }

  return response.json(products)
})

server.use(router)

server.listen(3001, () => {
  console.log('Mock API listening on http://localhost:3001')
})