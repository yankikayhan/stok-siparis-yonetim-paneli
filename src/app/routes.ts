// Router child route'lari bas slash'siz SEGMENT ister, NavLink ise MUTLAK path.
// Ikisinin ayrisamamasi icin tek kaynak segment listesidir; path'ler ondan turer.
export const ROUTE_SEGMENTS = ['urunler', 'musteriler', 'siparisler', 'ayarlar'] as const

// as const sart: olmadan tip string'e genisler ve RoutePath her yolu kabul eder hale gelir.
export type RouteSegment = (typeof ROUTE_SEGMENTS)[number]

// Template literal type: segment union'i mutlak path union'ina donusur ('/' index route'udur).
export type RoutePath = '/' | `/${RouteSegment}`
