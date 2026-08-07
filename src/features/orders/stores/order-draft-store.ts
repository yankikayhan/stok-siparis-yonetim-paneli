import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { OrderFormInput } from '../api/orders-api'

type OrderDraftState = {
  draft: OrderFormInput | null
  saveDraft: (draft: OrderFormInput) => void
  clearDraft: () => void
}

// Form state'in client state'e kopyalanmasi normalde sinir ihlalidir (tek dogruluk kaynagi);
// burada bilinçli istisna: dialog unmount olunca RHF state'i olur, taslak oturum boyunca yasar.
// persist YOK: taslak yarim kalmis istir, oturumlar arasi tasinacak kadar guvenilir veri degildir.
export const useOrderDraftStore = create<OrderDraftState>()(
  devtools(
    (set) => ({
      draft: null,
      saveDraft: (draft) => set({ draft }, false, 'saveDraft'),
      clearDraft: () => set({ draft: null }, false, 'clearDraft'),
    }),
    { name: 'order-draft-store', enabled: import.meta.env.DEV },
  ),
)
