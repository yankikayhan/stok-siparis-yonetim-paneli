import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { profileOptions } from '../api/profile-api'

// Kur cevirimi yapilmaz; profil tercihi yalnizca bicimlendirme para birimini belirler.
export function useCurrencyFormatter(maximumFractionDigits?: number) {
  // select ile yalnizca currency'ye abonelik: profilin diger alanlari degisince render tetiklenmez.
  // throwOnError: false — bu hook dort sayfadan cagriliyor; ikincil bir bicimlendirme verisi
  // yuzunden tum uygulama boundary'ye dusmemeli, asagidaki TRY fallback'i zaten dogru sonuc uretir.
  const { data: currency } = useQuery({
    ...profileOptions(),
    select: (profile) => profile.currency,
    throwOnError: false,
  })

  // Profil henuz yuklenmediyse TRY ile baslar; veri gelince formatter yeniden kurulur.
  return useMemo(
    () =>
      new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: currency ?? 'TRY',
        maximumFractionDigits,
      }),
    [currency, maximumFractionDigits],
  )
}
