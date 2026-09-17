import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Moon, Rows3, Sun } from 'lucide-react'
import { cloneElement, useId } from 'react'
import { useForm } from 'react-hook-form'
import { useUiStore } from '../../../shared/stores/ui-store'
import { Button } from '../../../shared/components/button'
import { PageHeader } from '../../../shared/components/page-header'
import {
  profileOptions,
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
  const profileQuery = useQuery(profileOptions())

  // isError degil: veri varsa sayfa cizilir, hata toast kanalinda kalir (throwOnError ile ayni yuklem).
  if (profileQuery.data === undefined) {
    return <SettingsLoadingState />
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Uygulama"
        title="Ayarlar"
        description="Profil bilgilerinizi ve calisma tercihlerinizi yonetin."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
        <ProfileSettingsForm profile={profileQuery.data} />
        <div className="space-y-6">
          <section className="border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">Gorunum</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Bu tercihler tarayicinizda saklanir.</p>
            <fieldset className="mt-5">
              <legend className="text-sm font-medium text-slate-800 dark:text-slate-200">Tema</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <PreferenceButton active={theme === 'light'} icon={Sun} label="Acik" onClick={() => setTheme('light')} />
                <PreferenceButton active={theme === 'dark'} icon={Moon} label="Koyu" onClick={() => setTheme('dark')} />
              </div>
            </fieldset>
            <fieldset className="mt-5">
              <legend className="text-sm font-medium text-slate-800 dark:text-slate-200">Tablo yogunlugu</legend>
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
    // onTouched dengesi: onSubmit ilk hatayi cok gec, onChange dokunulmamis alanda cok erken gosterir.
    mode: 'onTouched',
    // Hata bir kez gorunduginde duzeltme geri bildirimi tus vurusunda gelir.
    reValidateMode: 'onChange',
    defaultValues: profile,
  })
  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    // Form hata ve basari mesajlarini kendi icinde gosterir; global toast susturulur.
    meta: { suppressErrorToast: true },
    onSuccess: (updatedProfile) => {
      // Tipli key: setQueryData'ya elle generic vermeye gerek kalmaz.
      queryClient.setQueryData(profileOptions().queryKey, updatedProfile)
      form.reset(updatedProfile)
    },
  })

  return (
    <section className="border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">Profil</h2>
      <form className="mt-5 space-y-4" onSubmit={form.handleSubmit((values) => updateProfileMutation.mutate(values))}>
        <FormField label="Ad soyad" error={form.formState.errors.name?.message}><input {...form.register('name')} className="form-input" /></FormField>
        <FormField label="E-posta" error={form.formState.errors.email?.message}><input {...form.register('email')} type="email" className="form-input" /></FormField>
        <FormField label="Sirket" error={form.formState.errors.companyName?.message}><input {...form.register('companyName')} className="form-input" /></FormField>
        <FormField label="Para birimi" error={form.formState.errors.currency?.message}>
          <select {...form.register('currency')} className="form-input"><option value="TRY">TRY - Turk Lirasi</option><option value="USD">USD - Amerikan Dolari</option><option value="EUR">EUR - Euro</option></select>
        </FormField>
        {updateProfileMutation.isError && <p className="text-sm text-rose-700 dark:text-rose-400">{updateProfileMutation.error.message}</p>}
        {updateProfileMutation.isSuccess && <p className="text-sm text-brand-700 dark:text-brand-200">Profil kaydedildi.</p>}
        <div className="flex justify-end border-t border-slate-200 pt-4 dark:border-slate-700">
          <Button type="submit" disabled={!form.formState.isDirty || updateProfileMutation.isPending}>{updateProfileMutation.isPending ? 'Kaydediliyor...' : 'Degisiklikleri kaydet'}</Button>
        </div>
      </form>
    </section>
  )
}

function PreferenceButton({ active, icon: Icon, label, onClick }: { active: boolean; icon: typeof Sun; label: string; onClick: () => void }) {
  // aria-pressed eki (B6): attribute hem erisilebilirlik hem de boyama icin tek kaynak (T6).
  return <button type="button" aria-pressed={active} onClick={onClick} className="flex h-10 items-center justify-center gap-2 border text-sm font-medium border-slate-300 text-slate-700 hover:bg-slate-50 aria-pressed:border-brand-700 aria-pressed:bg-brand-50 aria-pressed:text-brand-800 aria-pressed:hover:bg-brand-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:aria-pressed:border-brand-700 dark:aria-pressed:bg-brand-900 dark:aria-pressed:text-brand-100 dark:aria-pressed:hover:bg-brand-900"><Icon size={16} aria-hidden="true" />{label}</button>
}

type FieldElementProps = { id?: string; 'aria-invalid'?: boolean; 'aria-describedby'?: string }

// Implicit label hata metnini alana BAGLAMAZ; explicit id + aria-describedby/aria-invalid
// iliskiyi ekran okuyucuya programatik bildirir. useId cakismasiz ve render'lar arasi stabildir.
function FormField({ children, error, label }: { children: React.ReactElement<FieldElementProps>; error?: string; label: string }) {
  const fieldId = useId()
  const errorId = `${fieldId}-error`

  return (
    <div className="block text-sm font-medium text-slate-700 dark:text-slate-300">
      <label htmlFor={fieldId}>{label}</label>
      <span className="mt-1 block">
        {cloneElement(children, { id: fieldId, 'aria-invalid': error ? true : undefined, 'aria-describedby': error ? errorId : undefined })}
      </span>
      {error && <span id={errorId} className="mt-1 block text-xs font-normal text-rose-700 dark:text-rose-400">{error}</span>}
    </div>
  )
}

function SettingsLoadingState() {
  return <section aria-busy="true" className="space-y-6"><div className="h-8 w-36 animate-pulse bg-slate-200 dark:bg-slate-800" /><div className="h-96 animate-pulse border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800" /></section>
}