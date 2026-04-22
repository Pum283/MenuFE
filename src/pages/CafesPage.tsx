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
        description="Admin: tạo/sửa quán, bật/tắt hoạt động, upload logo và ảnh nền (hero)."
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
          }}
          footer={
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsModalOpen(false)
                  setEdit(toEditState())
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
                    if (isEditing && edit.id != null) await updateCafe(edit.id, payload)
                    else await createCafe(payload)
                    toast.success('Lưu quán thành công.')
                    setIsModalOpen(false)
                    setEdit(toEditState())
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

          {isEditing && edit.id ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Field label="Logo">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="group relative h-14 w-14 shrink-0 overflow-hidden rounded-(--fe-radius) border border-[rgb(var(--fe-line))] bg-[rgb(var(--fe-surface))]"
                    onClick={() => {
                      if (!editingCafe?.logoUrl) return
                      setLightboxSrc(editingCafe.logoUrl)
                    setLightboxAlt(`${editingCafe.name} logo`)
                    }}
                    disabled={!editingCafe?.logoUrl}
                  >
                    {editingCafe?.logoUrl ? (
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
                      <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-[rgb(var(--fe-muted))]">
                        —
                      </div>
                    )}
                  </button>

                  <FilePicker
                    disabled={isSubmitting}
                    buttonText="Tải logo"
                    hideMeta
                    onPick={async (file) => {
                      setIsSubmitting(true)
                      try {
                        await uploadCafeLogo(edit.id!, file)
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
              </Field>

              <Field label="Hero">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="group relative h-14 w-20 shrink-0 overflow-hidden rounded-(--fe-radius) border border-[rgb(var(--fe-line))] bg-[rgb(var(--fe-surface))]"
                    onClick={() => {
                      if (!editingCafe?.heroImageUrl) return
                      setLightboxSrc(editingCafe.heroImageUrl)
                    setLightboxAlt(`${editingCafe.name} hero`)
                    }}
                    disabled={!editingCafe?.heroImageUrl}
                  >
                    {editingCafe?.heroImageUrl ? (
                      <>
                        <img
                          src={editingCafe.heroImageUrl}
                          alt={`${editingCafe.name} hero`}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:bg-black/35 group-hover:opacity-100">
                          Xem
                        </div>
                      </>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-[rgb(var(--fe-muted))]">
                        —
                      </div>
                    )}
                  </button>

                  <FilePicker
                    disabled={isSubmitting}
                    buttonText="Tải hero"
                    hideMeta
                    onPick={async (file) => {
                      setIsSubmitting(true)
                      try {
                        await uploadCafeHero(edit.id!, file)
                        toast.success('Upload hero thành công.')
                        await refresh()
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : 'Upload hero thất bại')
                      } finally {
                        setIsSubmitting(false)
                      }
                    }}
                  />
                </div>
              </Field>
            </div>
          ) : null}
        </Modal>

        <div className="mb-3 text-sm font-semibold text-[rgb(var(--fe-muted))]">Danh sách quán</div>

        <Table
          header={
            <tr>
              <Th className="w-40 whitespace-nowrap">Code</Th>
              <Th className="w-96">Tên</Th>
              <Th className="w-44 whitespace-nowrap">Logo</Th>
              <Th className="w-52 whitespace-nowrap">Hero</Th>
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
                        setLightboxAlt(`${cafe.name} hero`)
                      }}
                    >
                      <img
                        src={cafe.heroImageUrl}
                        alt={`${cafe.name} hero`}
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
                        buttonText="Tải hero"
                        hideMeta
                        onPick={async (file) => {
                          setIsSubmitting(true)
                          try {
                            await uploadCafeHero(cafe.id, file)
                            toast.success('Upload hero thành công.')
                            await refresh()
                          } catch (err) {
                            toast.error(err instanceof Error ? err.message : 'Upload hero thất bại')
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
                      buttonText="Tải hero"
                      hideMeta
                      onPick={async (file) => {
                        setIsSubmitting(true)
                        try {
                          await uploadCafeHero(cafe.id, file)
                          toast.success('Upload hero thành công.')
                          await refresh()
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : 'Upload hero thất bại')
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
      </Card>
    </div>
  )
}

