import { z } from 'zod'

// Zod'un varsayilan hata mesajlarini Turkce'ye cevirir; ozel mesajlar bundan etkilenmez.
z.config(z.locales.tr())
