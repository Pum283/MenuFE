import { useEffect, useMemo, useState } from 'react'
import type { CafeDto } from '../types/api'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Field } from '../components/ui/Field'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { ImageLightbox } from '../components/ui/ImageLightbox'
import { FilePicker } from '../components/ui/FilePicker'
import { Table, Td, Th } from '../components/ui/Table'
import { useToast } from '../components/ui/Toast'
import { createCafe, getCafes, getCafesByLang, updateCafe, uploadCafeHero, uploadCafeLogo } from '../utils/api'

type EditState = {
  id: string | null
  code: string
  nameVi: string
  nameEn: string
  isActive: boolean
}

function toEditState(cafeVi?: CafeDto, cafeEn?: CafeDto): EditState {
  return {
    id: cafeVi?.id ?? cafeEn?.id ?? null,
    code: cafeVi?.code ?? cafeEn?.code ?? '',
    nameVi: cafeVi?.name ?? '',
    nameEn: cafeEn?.name ?? '',
    isActive: cafeVi?.isActive ?? cafeEn?.isActive ?? true,
  }
}

export function CafesPage() {
  const toast = useToast()
  const [cafes, setCafes] = useState<CafeDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [edit, setEdit] = useState<EditState>(() => toEditState())
  const isEditing = edit.id != null
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const [lightboxAlt, setLightboxAlt] = useState<string>('')

  const editingCafe = useMemo(() => cafes.find((c) => c.id === edit.id) ?? null, [cafes, edit.id])

  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null)
  const [pendingHeroFile, setPendingHeroFile] = useState<File | null>(null)
  const [pendingLogoPreviewUrl, setPendingLogoPreviewUrl] = useState<string | null>(null)
  const [pendingHeroPreviewUrl, setPendingHeroPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (pendingLogoPreviewUrl) URL.revokeObjectURL(pendingLogoPreviewUrl)
      if (pendingHeroPreviewUrl) URL.revokeObjectURL(pendingHeroPreviewUrl)
    }
  }, [pendingLogoPreviewUrl, pendingHeroPreviewUrl])

  async function refresh() {
    setIsLoading(true)
    try {
      const data = await getCafes()
      setCafes(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Tải danh sách quán thất bại')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  const canSubmit = useMemo(
    () => edit.code.trim() && edit.nameVi.trim() && edit.nameEn.trim() && !isSubmitting,
    [edit, isSubmitting],
  )

  return (
    <div className="space-y-6">
      <Card
        title="Quản lý quán"
        description="Admin: tạo/sửa quán, bật/tắt hoạt động, upload logo và ảnh nền."
        right={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={() => {
                setEdit(toEditState())
                setIsModalOpen(true)
              }}
              disabled={isSubmitting}
            >
              Tạo
            </Button>
            <Button type="button" variant="secondary" onClick={() => void refresh()} disabled={isLoading || isSubmitting}>
              Tải lại
            </Button>
          </div>
        }
      >
        <ImageLightbox
          src={lightboxSrc}
          alt={lightboxAlt}
          isOpen={Boolean(lightboxSrc)}
          onClose={() => setLightboxSrc(null)}
        />

        <Modal
          title={isEditing ? `Chỉnh sửa quán (${edit.code})` : 'Tạo quán'}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setEdit(toEditState())
            setPendingLogoFile(null)
            setPendingHeroFile(null)
            if (pendingLogoPreviewUrl) URL.revokeObjectURL(pendingLogoPreviewUrl)
            if (pendingHeroPreviewUrl) URL.revokeObjectURL(pendingHeroPreviewUrl)
            setPendingLogoPreviewUrl(null)
            setPendingHeroPreviewUrl(null)
          }}
          footer={
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsModalOpen(false)
                  setEdit(toEditState())
                  setPendingLogoFile(null)
                  setPendingHeroFile(null)
                  if (pendingLogoPreviewUrl) URL.revokeObjectURL(pendingLogoPreviewUrl)
                  if (pendingHeroPreviewUrl) URL.revokeObjectURL(pendingHeroPreviewUrl)
                  setPendingLogoPreviewUrl(null)
                  setPendingHeroPreviewUrl(null)
                }}
              >
                Huỷ
              </Button>
              <Button
                type="button"
                disabled={!canSubmit}
                onClick={async () => {
                  setIsSubmitting(true)
                  try {
                    const payload = {
                      code: edit.code,
                      translations: { vi: { name: edit.nameVi }, en: { name: edit.nameEn } },
                      isActive: edit.isActive,
                    }
                    if (isEditing && edit.id != null) {
                      await updateCafe(edit.id, payload)
                    } else {
                      const created = await createCafe(payload)
                      if (pendingLogoFile) {
                        await uploadCafeLogo(created.id, pendingLogoFile)
                        toast.success('Upload logo thành công.')
                      }
                      if (pendingHeroFile) {
                        await uploadCafeHero(created.id, pendingHeroFile)
                        toast.success('Upload ảnh nền thành công.')
                      }
                    }
                    toast.success('Lưu quán thành công.')
                    setIsModalOpen(false)
                    setEdit(toEditState())
                    setPendingLogoFile(null)
                    setPendingHeroFile(null)
                    if (pendingLogoPreviewUrl) URL.revokeObjectURL(pendingLogoPreviewUrl)
                    if (pendingHeroPreviewUrl) URL.revokeObjectURL(pendingHeroPreviewUrl)
                    setPendingLogoPreviewUrl(null)
                    setPendingHeroPreviewUrl(null)
                    await refresh()
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : 'Lưu quán thất bại')
                  } finally {
                    setIsSubmitting(false)
                  }
                }}
              >
                Lưu
              </Button>
            </>
          }
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Code (kebab-case)" hint="Ví dụ: zi-coffee / cua-ngo-cafe / the-hideout-cafe">
              <Input
                value={edit.code}
                onChange={(e) => setEdit((s) => ({ ...s, code: e.target.value }))}
                disabled={isEditing}
              />
            </Field>
            <Field label="Tên quán (VI)">
              <Input value={edit.nameVi} onChange={(e) => setEdit((s) => ({ ...s, nameVi: e.target.value }))} />
            </Field>
            <Field label="Tên quán (EN)">
              <Input value={edit.nameEn} onChange={(e) => setEdit((s) => ({ ...s, nameEn: e.target.value }))} />
            </Field>
            <Field label="Trạng thái">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={edit.isActive}
                  disabled={isSubmitting}
                  onClick={() => setEdit((s) => ({ ...s, isActive: !s.isActive }))}
                  className={[
                    'relative inline-flex h-7 w-12 items-center rounded-full border transition-colors',
                    edit.isActive
                      ? 'border-[rgb(var(--fe-success))] bg-[rgb(var(--fe-success))]'
                      : 'border-[rgb(var(--fe-line))] bg-[rgb(var(--fe-surface))]',
                    isSubmitting ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
                  ].join(' ')}
                >
                  <span
                    aria-hidden="true"
                    className={[
                      'inline-block h-5 w-5 transform rounded-full bg-white transition-transform',
                      edit.isActive ? 'translate-x-6' : 'translate-x-1',
                    ].join(' ')}
                  />
                </button>
                <div className="text-sm font-semibold text-[rgb(var(--fe-muted))]">{edit.isActive ? 'Active' : 'Inactive'}</div>
              </div>
            </Field>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Field label="Logo">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="group relative h-14 w-14 shrink-0 overflow-hidden rounded-(--fe-radius) border border-[rgb(var(--fe-line))] bg-[rgb(var(--fe-surface))]"
                  onClick={() => {
                    const src = isEditing ? editingCafe?.logoUrl : pendingLogoPreviewUrl
                    if (!src) return
                    setLightboxSrc(src)
                    setLightboxAlt(`${edit.nameVi || edit.nameEn || edit.code || 'Cafe'} logo`)
                  }}
                  disabled={!(isEditing ? editingCafe?.logoUrl : pendingLogoPreviewUrl)}
                  aria-label="Xem logo"
                >
                  {isEditing ? (
                    editingCafe?.logoUrl ? (
                      <>
                        <img
                          src={editingCafe.logoUrl}
                          alt={`${editingCafe.name} logo`}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:bg-black/35 group-hover:opacity-100">
                          Xem
                        </div>
                      </>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-[rgb(var(--fe-muted))]">—</div>
                    )
                  ) : pendingLogoPreviewUrl ? (
                    <img
                      src={pendingLogoPreviewUrl}
                      alt="Logo preview"
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-[rgb(var(--fe-muted))]">—</div>
                  )}
                </button>

                <FilePicker
                  disabled={isSubmitting}
                  buttonText="Chọn logo"
                  hideMeta
                  onPick={async (file) => {
                    if (isEditing && edit.id) {
                      setIsSubmitting(true)
                      try {
                        await uploadCafeLogo(edit.id, file)
                        toast.success('Upload logo thành công.')
                        await refresh()
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : 'Upload logo thất bại')
                      } finally {
                        setIsSubmitting(false)
                      }
                      return
                    }

                    setPendingLogoFile(file)
                    if (pendingLogoPreviewUrl) URL.revokeObjectURL(pendingLogoPreviewUrl)
                    setPendingLogoPreviewUrl(URL.createObjectURL(file))
                  }}
                />
              </div>
              {!isEditing && pendingLogoFile ? (
                <div className="mt-2 text-xs font-semibold text-[rgb(var(--fe-muted))]">Logo sẽ được upload sau khi tạo quán.</div>
              ) : null}
            </Field>

            <Field label="Ảnh nền">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="group relative h-14 w-20 shrink-0 overflow-hidden rounded-(--fe-radius) border border-[rgb(var(--fe-line))] bg-[rgb(var(--fe-surface))]"
                  onClick={() => {
                    const src = isEditing ? editingCafe?.heroImageUrl : pendingHeroPreviewUrl
                    if (!src) return
                    setLightboxSrc(src)
                    setLightboxAlt(`${edit.nameVi || edit.nameEn || edit.code || 'Cafe'} ảnh nền`)
                  }}
                  disabled={!(isEditing ? editingCafe?.heroImageUrl : pendingHeroPreviewUrl)}
                  aria-label="Xem ảnh nền"
                >
                  {isEditing ? (
                    editingCafe?.heroImageUrl ? (
                      <>
                        <img
                          src={editingCafe.heroImageUrl}
                          alt={`${editingCafe.name} ảnh nền`}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:bg-black/35 group-hover:opacity-100">
                          Xem
                        </div>
                      </>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-[rgb(var(--fe-muted))]">—</div>
                    )
                  ) : pendingHeroPreviewUrl ? (
                    <img
                      src={pendingHeroPreviewUrl}
                      alt="Ảnh nền preview"
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-[rgb(var(--fe-muted))]">—</div>
                  )}
                </button>

                <FilePicker
                  disabled={isSubmitting}
                  buttonText="Chọn ảnh nền"
                  hideMeta
                  onPick={async (file) => {
                    if (isEditing && edit.id) {
                      setIsSubmitting(true)
                      try {
                        await uploadCafeHero(edit.id, file)
                        toast.success('Upload ảnh nền thành công.')
                        await refresh()
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : 'Upload ảnh nền thất bại')
                      } finally {
                        setIsSubmitting(false)
                      }
                      return
                    }

                    setPendingHeroFile(file)
                    if (pendingHeroPreviewUrl) URL.revokeObjectURL(pendingHeroPreviewUrl)
                    setPendingHeroPreviewUrl(URL.createObjectURL(file))
                  }}
                />
              </div>
              {!isEditing && pendingHeroFile ? (
                <div className="mt-2 text-xs font-semibold text-[rgb(var(--fe-muted))]">Ảnh nền sẽ được upload sau khi tạo quán.</div>
              ) : null}
            </Field>
          </div>
        </Modal>

        <div className="mb-3 text-sm font-semibold text-[rgb(var(--fe-muted))]">Danh sách quán</div>

        <div className="md:hidden">
          {cafes.length === 0 && !isLoading ? (
            <div className="rounded-(--fe-radius) border border-[rgb(var(--fe-line))] bg-white p-4 text-sm font-semibold text-[rgb(var(--fe-muted))]">
              Chưa có quán nào.
            </div>
          ) : (
            <div className="grid gap-3">
              {cafes.map((cafe) => (
                <div key={cafe.id} className="rounded-(--fe-radius) border border-[rgb(var(--fe-line))] bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-[rgb(var(--fe-text))]">{cafe.name}</div>
                      <div className="mt-1 truncate text-xs font-semibold text-[rgb(var(--fe-muted))]">{cafe.code}</div>
                    </div>
                    <div
                      className={[
                        'shrink-0 rounded-[calc(var(--fe-radius)+999px)] border px-3 py-1 text-xs font-semibold',
                        cafe.isActive
                          ? 'border-[rgb(var(--fe-success))] bg-[rgba(var(--fe-success),0.10)] text-[rgb(var(--fe-success))]'
                          : 'border-[rgb(var(--fe-line))] bg-[rgb(var(--fe-surface))] text-[rgb(var(--fe-muted))]',
                      ].join(' ')}
                    >
                      {cafe.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs font-semibold text-[rgb(var(--fe-muted))]">Logo</div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="group relative h-10 w-10 shrink-0 overflow-hidden rounded-(--fe-radius) border border-[rgb(var(--fe-line))] bg-[rgb(var(--fe-surface))]"
                          onClick={() => {
                            if (!cafe.logoUrl) return
                            setLightboxSrc(cafe.logoUrl)
                            setLightboxAlt(`${cafe.name} logo`)
                          }}
                          disabled={!cafe.logoUrl}
                        >
                          {cafe.logoUrl ? (
                            <>
                              <img src={cafe.logoUrl} alt={`${cafe.name} logo`} className="h-full w-full object-cover" loading="lazy" />
                              <div className="pointer-events-none absolute inset-0 bg-black/0 opacity-0 transition-opacity group-hover:bg-black/35 group-hover:opacity-100" />
                            </>
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-[rgb(var(--fe-muted))]">—</div>
                          )}
                        </button>
                        <FilePicker
                          disabled={isSubmitting}
                          buttonText="Tải logo"
                          hideMeta
                          onPick={async (file) => {
                            setIsSubmitting(true)
                            try {
                              await uploadCafeLogo(cafe.id, file)
                              toast.success('Upload logo thành công.')
                              await refresh()
                            } catch (err) {
                              toast.error(err instanceof Error ? err.message : 'Upload logo thất bại')
                            } finally {
                              setIsSubmitting(false)
                            }
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs font-semibold text-[rgb(var(--fe-muted))]">Ảnh nền</div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="group relative h-10 w-14 shrink-0 overflow-hidden rounded-(--fe-radius) border border-[rgb(var(--fe-line))] bg-[rgb(var(--fe-surface))]"
                          onClick={() => {
                            if (!cafe.heroImageUrl) return
                            setLightboxSrc(cafe.heroImageUrl)
                            setLightboxAlt(`${cafe.name} ảnh nền`)
                          }}
                          disabled={!cafe.heroImageUrl}
                        >
                          {cafe.heroImageUrl ? (
                            <>
                              <img
                                src={cafe.heroImageUrl}
                                alt={`${cafe.name} ảnh nền`}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                              <div className="pointer-events-none absolute inset-0 bg-black/0 opacity-0 transition-opacity group-hover:bg-black/35 group-hover:opacity-100" />
                            </>
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-[rgb(var(--fe-muted))]">—</div>
                          )}
                        </button>
                        <FilePicker
                          disabled={isSubmitting}
                          buttonText="Tải ảnh nền"
                          hideMeta
                          onPick={async (file) => {
                            setIsSubmitting(true)
                            try {
                              await uploadCafeHero(cafe.id, file)
                              toast.success('Upload ảnh nền thành công.')
                              await refresh()
                            } catch (err) {
                              toast.error(err instanceof Error ? err.message : 'Upload ảnh nền thất bại')
                            } finally {
                              setIsSubmitting(false)
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={cafe.isActive}
                      disabled={isSubmitting}
                      onClick={async () => {
                        setIsSubmitting(true)
                        try {
                          const [viList, enList] = await Promise.all([getCafesByLang('vi'), getCafesByLang('en')])
                          const vi = viList.find((x) => x.id === cafe.id)
                          const en = enList.find((x) => x.id === cafe.id)
                          await updateCafe(cafe.id, {
                            code: cafe.code,
                            translations: { vi: { name: vi?.name ?? cafe.name }, en: { name: en?.name ?? cafe.name } },
                            isActive: !cafe.isActive,
                          })
                          toast.success('Cập nhật trạng thái quán thành công.')
                          await refresh()
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : 'Cập nhật trạng thái quán thất bại')
                        } finally {
                          setIsSubmitting(false)
                        }
                      }}
                      className={[
                        'relative inline-flex h-7 w-12 items-center rounded-full border transition-colors',
                        cafe.isActive
                          ? 'border-[rgb(var(--fe-success))] bg-[rgb(var(--fe-success))]'
                          : 'border-[rgb(var(--fe-line))] bg-[rgb(var(--fe-surface))]',
                        isSubmitting ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
                      ].join(' ')}
                      aria-label="Trạng thái"
                    >
                      <span
                        aria-hidden="true"
                        className={[
                          'inline-block h-5 w-5 transform rounded-full bg-white transition-transform',
                          cafe.isActive ? 'translate-x-6' : 'translate-x-1',
                        ].join(' ')}
                      />
                    </button>

                    <Button
                      type="button"
                      variant="secondary"
                      disabled={isSubmitting}
                      onClick={async () => {
                        setIsSubmitting(true)
                        try {
                          const [viList, enList] = await Promise.all([getCafesByLang('vi'), getCafesByLang('en')])
                          const vi = viList.find((x) => x.id === cafe.id)
                          const en = enList.find((x) => x.id === cafe.id)
                          setEdit(toEditState(vi, en))
                          setIsModalOpen(true)
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : 'Tải dữ liệu song ngữ thất bại')
                        } finally {
                          setIsSubmitting(false)
                        }
                      }}
                    >
                      Chỉnh sửa
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="hidden md:block">
          <Table
            header={
              <tr>
                <Th className="w-40 whitespace-nowrap">Code</Th>
                <Th className="w-96">Tên</Th>
                <Th className="w-44 whitespace-nowrap">Logo</Th>
                <Th className="w-52 whitespace-nowrap">Ảnh nền</Th>
                <Th className="w-36 whitespace-nowrap">Trạng thái</Th>
                <Th className="text-right">Hành động</Th>
              </tr>
            }
          >
            {cafes.length === 0 && !isLoading ? (
              <tr>
                <Td colSpan={7}>Chưa có quán nào.</Td>
              </tr>
            ) : null}

            {cafes.map((cafe) => (
              <tr key={cafe.id} className="hover:bg-[rgb(var(--fe-surface))]">
                <Td className="align-middle whitespace-nowrap">{cafe.code}</Td>
                <Td className="align-middle">{cafe.name}</Td>
                <Td className="align-middle">
                  {cafe.logoUrl ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="group relative h-14 w-14 shrink-0 overflow-hidden rounded-(--fe-radius) border border-[rgb(var(--fe-line))] bg-[rgb(var(--fe-surface))]"
                        onClick={() => {
                          setLightboxSrc(cafe.logoUrl!)
                          setLightboxAlt(`${cafe.name} logo`)
                        }}
                      >
                        <img
                          src={cafe.logoUrl}
                          alt={`${cafe.name} logo`}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:bg-black/35 group-hover:opacity-100">
                          Xem
                        </div>
                      </button>
                      <div className="shrink-0">
                        <FilePicker
                          disabled={isSubmitting}
                          buttonText="Tải logo"
                          hideMeta
                          onPick={async (file) => {
                            setIsSubmitting(true)
                            try {
                              await uploadCafeLogo(cafe.id, file)
                              toast.success('Upload logo thành công.')
                              await refresh()
                            } catch (err) {
                              toast.error(err instanceof Error ? err.message : 'Upload logo thất bại')
                            } finally {
                              setIsSubmitting(false)
                            }
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex min-h-16 items-center justify-center">
                      <FilePicker
                        disabled={isSubmitting}
                        buttonText="Tải logo"
                        hideMeta
                        onPick={async (file) => {
                          setIsSubmitting(true)
                          try {
                            await uploadCafeLogo(cafe.id, file)
                            toast.success('Upload logo thành công.')
                            await refresh()
                          } catch (err) {
                            toast.error(err instanceof Error ? err.message : 'Upload logo thất bại')
                          } finally {
                            setIsSubmitting(false)
                          }
                        }}
                      />
                    </div>
                  )}
                </Td>
                <Td className="align-middle">
                  {cafe.heroImageUrl ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="group relative h-14 w-20 shrink-0 overflow-hidden rounded-(--fe-radius) border border-[rgb(var(--fe-line))] bg-[rgb(var(--fe-surface))]"
                        onClick={() => {
                          setLightboxSrc(cafe.heroImageUrl!)
                          setLightboxAlt(`${cafe.name} ảnh nền`)
                        }}
                      >
                        <img
                          src={cafe.heroImageUrl}
                          alt={`${cafe.name} ảnh nền`}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:bg-black/35 group-hover:opacity-100">
                          Xem
                        </div>
                      </button>
                      <div className="shrink-0">
                        <FilePicker
                          disabled={isSubmitting}
                          buttonText="Tải ảnh nền"
                          hideMeta
                          onPick={async (file) => {
                            setIsSubmitting(true)
                            try {
                              await uploadCafeHero(cafe.id, file)
                              toast.success('Upload ảnh nền thành công.')
                              await refresh()
                            } catch (err) {
                              toast.error(err instanceof Error ? err.message : 'Upload ảnh nền thất bại')
                            } finally {
                              setIsSubmitting(false)
                            }
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex min-h-16 items-center justify-center">
                      <FilePicker
                        disabled={isSubmitting}
                        buttonText="Tải ảnh nền"
                        hideMeta
                        onPick={async (file) => {
                          setIsSubmitting(true)
                          try {
                            await uploadCafeHero(cafe.id, file)
                            toast.success('Upload ảnh nền thành công.')
                            await refresh()
                          } catch (err) {
                            toast.error(err instanceof Error ? err.message : 'Upload ảnh nền thất bại')
                          } finally {
                            setIsSubmitting(false)
                          }
                        }}
                      />
                    </div>
                  )}
                </Td>
                <Td className="align-middle">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={cafe.isActive}
                    disabled={isSubmitting}
                    onClick={async () => {
                      setIsSubmitting(true)
                      try {
                      const [viList, enList] = await Promise.all([getCafesByLang('vi'), getCafesByLang('en')])
                      const vi = viList.find((x) => x.id === cafe.id)
                      const en = enList.find((x) => x.id === cafe.id)
                      await updateCafe(cafe.id, {
                        code: cafe.code,
                        translations: { vi: { name: vi?.name ?? cafe.name }, en: { name: en?.name ?? cafe.name } },
                        isActive: !cafe.isActive,
                      })
                        toast.success('Cập nhật trạng thái quán thành công.')
                        await refresh()
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : 'Cập nhật trạng thái quán thất bại')
                      } finally {
                        setIsSubmitting(false)
                      }
                    }}
                    className={[
                      'relative inline-flex h-7 w-12 items-center rounded-full border transition-colors',
                      cafe.isActive
                        ? 'border-[rgb(var(--fe-success))] bg-[rgb(var(--fe-success))]'
                        : 'border-[rgb(var(--fe-line))] bg-[rgb(var(--fe-surface))]',
                      isSubmitting ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
                    ].join(' ')}
                  >
                    <span
                      aria-hidden="true"
                      className={[
                        'inline-block h-5 w-5 transform rounded-full bg-white transition-transform',
                        cafe.isActive ? 'translate-x-6' : 'translate-x-1',
                      ].join(' ')}
                    />
                  </button>
                </Td>
                <Td className="align-middle">
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={async () => {
                        setIsSubmitting(true)
                        try {
                          const [viList, enList] = await Promise.all([getCafesByLang('vi'), getCafesByLang('en')])
                          const vi = viList.find((x) => x.id === cafe.id)
                          const en = enList.find((x) => x.id === cafe.id)
                          setEdit(toEditState(vi, en))
                          setIsModalOpen(true)
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : 'Tải dữ liệu song ngữ thất bại')
                        } finally {
                          setIsSubmitting(false)
                        }
                      }}
                    >
                      Chỉnh sửa
                    </Button>
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        </div>
      </Card>
    </div>
  )
}

