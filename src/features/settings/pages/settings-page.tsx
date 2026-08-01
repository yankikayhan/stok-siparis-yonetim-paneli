import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Moon, Rows3, Sun } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useUiStore } from '../../../shared/stores/ui-store'
import {
  getProfile,
  profileQueryKeys,
  profileSchema,
  updateProfile,
  type Profile,
  type ProfileFormValues,
} from '../api/profile-api'

export function SettingsPage() {
  const theme = useUiStore((state) => state.theme)
  const setTheme = useUiStore((state) => state.setTheme)
  const tableDensity = useUiStore((state) => state.tableDensity)
  const setTableDensity = useUiStore((state) => state.setTableDensity)
  const profileQuery = useQuery({ queryKey: profileQueryKeys.detail(), queryFn: getProfile })

  if (profileQuery.isPending) {
    return <SettingsLoadingState />
  }

  if (profileQuery.isError) {
    return (
      <section className="border border-rose-200 bg-rose-50 p-6">
        <h1 className="text-base font-semibold text-rose-950">Ayarlar yuklenemedi</h1>
        <p className="mt-2 text-sm text-rose-800">{profileQuery.error.message}</p>
        <button type="button" onClick={() => void profileQuery.refetch()} className="mt-4 rounded-md bg-rose-700 px-3 py-2 text-sm font-medium text-white hover:bg-rose-800">Tekrar dene</button>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium text-teal-700">Uygulama</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Ayarlar</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Profil bilgilerinizi ve calisma tercihlerinizi yonetin.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
        <ProfileSettingsForm profile={profileQuery.data} />
        <div className="space-y-6">
          <section className="border border-slate-200 bg-white p-5">
            <h2 className="text-base font-semibold text-slate-950">Gorunum</h2>
            <p className="mt-1 text-sm text-slate-600">Bu tercihler tarayicinizda saklanir.</p>
            <fieldset className="mt-5">
              <legend className="text-sm font-medium text-slate-800">Tema</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <PreferenceButton active={theme === 'light'} icon={Sun} label="Acik" onClick={() => setTheme('light')} />
                <PreferenceButton active={theme === 'dark'} icon={Moon} label="Koyu" onClick={() => setTheme('dark')} />
              </div>
            </fieldset>
            <fieldset className="mt-5">
              <legend className="text-sm font-medium text-slate-800">Tablo yogunlugu</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <PreferenceButton active={tableDensity === 'comfortable'} icon={Rows3} label="Rahat" onClick={() => setTableDensity('comfortable')} />
                <PreferenceButton active={tableDensity === 'compact'} icon={Rows3} label="Sik" onClick={() => setTableDensity('compact')} />
              </div>
            </fieldset>
          </section>
        </div>
      </div>
    </section>
  )
}

function ProfileSettingsForm({ profile }: { profile: Profile }) {
  const queryClient = useQueryClient()
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: profile,
  })
  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(profileQueryKeys.detail(), updatedProfile)
      form.reset(updatedProfile)
    },
  })

  return (
    <section className="border border-slate-200 bg-white p-5">
      <h2 className="text-base font-semibold text-slate-950">Profil</h2>
      <form className="mt-5 space-y-4" onSubmit={form.handleSubmit((values) => updateProfileMutation.mutate(values))}>
        <FormField label="Ad soyad" error={form.formState.errors.name?.message}><input {...form.register('name')} className="form-input" /></FormField>
        <FormField label="E-posta" error={form.formState.errors.email?.message}><input {...form.register('email')} type="email" className="form-input" /></FormField>
        <FormField label="Sirket" error={form.formState.errors.companyName?.message}><input {...form.register('companyName')} className="form-input" /></FormField>
        <FormField label="Para birimi" error={form.formState.errors.currency?.message}>
          <select {...form.register('currency')} className="form-input"><option value="TRY">TRY - Turk Lirasi</option><option value="USD">USD - Amerikan Dolari</option><option value="EUR">EUR - Euro</option></select>
        </FormField>
        {updateProfileMutation.isError && <p className="text-sm text-rose-700">{updateProfileMutation.error.message}</p>}
        {updateProfileMutation.isSuccess && <p className="text-sm text-teal-700">Profil kaydedildi.</p>}
        <div className="flex justify-end border-t border-slate-200 pt-4">
          <button type="submit" disabled={!form.formState.isDirty || updateProfileMutation.isPending} className="rounded-md bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50">{updateProfileMutation.isPending ? 'Kaydediliyor...' : 'Degisiklikleri kaydet'}</button>
        </div>
      </form>
    </section>
  )
}

function PreferenceButton({ active, icon: Icon, label, onClick }: { active: boolean; icon: typeof Sun; label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`flex h-10 items-center justify-center gap-2 border text-sm font-medium ${active ? 'border-teal-700 bg-teal-50 text-teal-800' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}><Icon size={16} aria-hidden="true" />{label}</button>
}

function FormField({ children, error, label }: { children: React.ReactNode; error?: string; label: string }) {
  return <label className="block text-sm font-medium text-slate-700"><span>{label}</span><span className="mt-1 block">{children}</span>{error && <span className="mt-1 block text-xs font-normal text-rose-700">{error}</span>}</label>
}

function SettingsLoadingState() {
  return <section aria-busy="true" className="space-y-6"><div className="h-8 w-36 animate-pulse bg-slate-200" /><div className="h-96 animate-pulse border border-slate-200 bg-white" /></section>
}