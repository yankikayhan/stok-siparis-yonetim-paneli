// Saf uretim katmani: fs erisimi ve yan etkisi YOKTUR. Fixture disaridan arguman olarak gelir,
// dosyaya yazan taraf seed-cli.js'tir. Test bu modulu import edince db.json'a dokunulmaz.
// Idempotentlik sarti: Math.random ve new Date() (o an) KULLANILMAZ; her deger indeksten turer.

const MS_PER_HOUR = 3_600_000
const MS_PER_DAY = 86_400_000

export function buildDatabase(fixture) {
  const products = buildProducts(fixture)

  return {
    categories: fixture.categories,
    products,
    customers: fixture.customers,
    orders: buildOrders(fixture, products),
    profile: fixture.profile,
  }
}

function buildProducts({ categories, categoryCodes, productBases, productVariants, productSeed }) {
  const products = []
  // Kategori ici sayac: ad/varyant secimi global indeksten degil kategori icindeki siradan turer,
  // boylece ayni kategoride ayni (taban, varyant) cifti tekrar etmez.
  const categoryCounters = new Map(categories.map((category) => [category.id, 0]))
  const firstCreatedAt = Date.parse(productSeed.firstCreatedAt)

  for (let index = 1; index <= productSeed.count; index += 1) {
    const category = categories[(index - 1) % categories.length]
    const categoryIndex = categoryCounters.get(category.id)
    categoryCounters.set(category.id, categoryIndex + 1)

    const bases = productBases[category.id]
    const base = bases[categoryIndex % bases.length]
    // Ad tekilligi kapasiteye bagli: kategori basina en fazla 334 urun, 12 taban x 30 varyant = 360 kombinasyon.
    const variantIndex = Math.floor(categoryIndex / bases.length) % productVariants.length

    const isLowStock = index % 5 === 0
    // Iki kural kesisir: 50'nin kati her zaman 5'in de katidir, yani 20 urun hem pasif hem dusuk stok.
    // Kesisim bilerek uretilir; bos olsaydi "metrikler active-only" karari dogrulanamazdi.
    const isPassive = index % 10 === 9 || index % 50 === 0
    const reorderLevel = 5 + (index % 11)
    const createdAt = new Date(firstCreatedAt + (index - 1) * productSeed.createdAtStepHours * MS_PER_HOUR)

    products.push({
      id: `prd-${String(index).padStart(4, '0')}`,
      name: `${base.name} ${productVariants[variantIndex]}`,
      sku: `${categoryCodes[category.id]}-${base.code}-${String(index).padStart(4, '0')}`,
      categoryId: category.id,
      price: base.price + variantIndex * productSeed.priceVariantStep,
      stock: isLowStock ? Math.max(0, reorderLevel - (index % 4)) : reorderLevel + 5 + (index % 40),
      reorderLevel,
      active: !isPassive,
      createdAt: createdAt.toISOString(),
      updatedAt: new Date(createdAt.getTime() + (index % 30) * MS_PER_DAY).toISOString(),
    })
  }

  return products
}

function buildOrders({ orderSeed, orderStatusPattern, cancelReasons }, products) {
  // Kanonik veri isletme gecmisi degildir: siparisler stogu DUSURMEZ.
  // Kalemler yalniz aktif urunlerden secilir; pasif urun yolu KOSUL 2.4'te elle sinanir.
  const activeProducts = products.filter((product) => product.active)
  const firstCreatedAt = Date.parse(orderSeed.firstCreatedAt)

  return orderStatusPattern.map((status, patternIndex) => {
    const index = patternIndex + 1
    const items = buildOrderItems(index, activeProducts)

    return {
      id: `ord-${String(index).padStart(3, '0')}`,
      customerId: resolveCustomerId(index, orderSeed),
      status,
      // Durum bazli alanlar orderSchema'nin discriminated union dallarindan gelir; ilgisiz dalin
      // alani nesneye HIC eklenmez (Zod strict olmadigi icin fazla alani sessizce strip ederdi).
      ...(status === 'shipped' ? { trackingNumber: buildTrackingNumber(index) } : {}),
      ...(status === 'cancelled' ? { cancelReason: cancelReasons[index % cancelReasons.length] } : {}),
      total: items.reduce((total, item) => total + item.lineTotal, 0),
      createdAt: new Date(firstCreatedAt + patternIndex * orderSeed.createdAtStepHours * MS_PER_HOUR).toISOString(),
      items,
    }
  })
}

function buildOrderItems(index, activeProducts) {
  const items = []
  const usedProductIds = new Set()

  for (let itemIndex = 0; itemIndex < 1 + (index % 3); itemIndex += 1) {
    let productIndex = (index * 7 + itemIndex * 13) % activeProducts.length

    // Ayni sipariste ayni urunun iki kez gecmesi kanonik veride istenmez; carpisma varsa kaydirilir.
    while (usedProductIds.has(activeProducts[productIndex].id)) {
      productIndex = (productIndex + 1) % activeProducts.length
    }

    const product = activeProducts[productIndex]
    const quantity = 1 + ((index + itemIndex) % 4)
    usedProductIds.add(product.id)

    items.push({
      productId: product.id,
      productName: product.name,
      quantity,
      unitPrice: product.price,
      // Yuvarlama YOK: kayan nokta artiklari deterministiktir ve README'nin beyan ettigi sinirin ornegidir.
      lineTotal: product.price * quantity,
    })
  }

  return items
}

function resolveCustomerId(index, { primaryCustomerId, primaryOrderCount, rotationCustomerIds }) {
  if (index <= primaryOrderCount) return primaryCustomerId

  return rotationCustomerIds[(index - primaryOrderCount - 1) % rotationCustomerIds.length]
}

function buildTrackingNumber(index) {
  // randomUUID yerine indeksten turetilmis sabit hash; sunucunun urettigi formatla ayni gorunumde.
  return `TRK-${((index * 2654435761) % 0xffffffff).toString(16).toUpperCase().padStart(8, '0')}`
}
