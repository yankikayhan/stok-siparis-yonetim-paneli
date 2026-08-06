import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { profileOptions } from '../api/profile-api'

// Kur cevirimi yapilmaz; profil tercihi yalnizca bicimlendirme para birimini belirler.
export function useCurrencyFormatter(maximumFractionDigits?: number) {
  // select ile yalnizca currency'ye abonelik: profilin diger alanlari degisince render tetiklenmez.
  const { data: currency } = useQuery({ ...profileOptions(), select: (profile) => profile.currency })

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
