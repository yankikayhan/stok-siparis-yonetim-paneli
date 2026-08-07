import { beforeEach, describe, expect, it } from 'vitest'
import type { OrderFormInput } from '../api/orders-api'
import { useOrderDraftStore } from './order-draft-store'

const sampleDraft: OrderFormInput = {
  customerId: 'cus-001',
  items: [{ productId: 'prd-001', quantity: 2 }],
}

describe('useOrderDraftStore', () => {
  beforeEach(() => {
    // Store modul seviyesinde singleton; testler arasi sizintiyi onlemek icin resetlenir.
    useOrderDraftStore.setState({ draft: null })
  })

  it('saveDraft taslagi saklar', () => {
    useOrderDraftStore.getState().saveDraft(sampleDraft)

    expect(useOrderDraftStore.getState().draft).toEqual(sampleDraft)
  })

  it('saveDraft mevcut taslagin uzerine yazar', () => {
    const newerDraft: OrderFormInput = {
      customerId: 'cus-002',
      items: [{ productId: 'prd-002', quantity: 5 }],
    }

    useOrderDraftStore.getState().saveDraft(sampleDraft)
    useOrderDraftStore.getState().saveDraft(newerDraft)

    expect(useOrderDraftStore.getState().draft).toEqual(newerDraft)
  })

  it('clearDraft taslagi temizler', () => {
    useOrderDraftStore.getState().saveDraft(sampleDraft)
    useOrderDraftStore.getState().clearDraft()

    expect(useOrderDraftStore.getState().draft).toBeNull()
  })

  it('clearDraft taslak yokken de guvenlidir', () => {
    expect(() => useOrderDraftStore.getState().clearDraft()).not.toThrow()
    expect(useOrderDraftStore.getState().draft).toBeNull()
  })
})
