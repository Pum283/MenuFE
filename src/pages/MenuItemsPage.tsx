import { useEffect, useMemo, useRef, useState } from 'react'
import type { CafeDto, MenuCategoryDto, MenuItemDto } from '../types/api'
import { Card } from '../components/ui/Card'
import { Field } from '../components/ui/Field'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Table, Td, Th } from '../components/ui/Table'
import { Modal } from '../components/ui/Modal'
import { ImageLightbox } from '../components/ui/ImageLightbox'
import { useToast } from '../components/ui/Toast'
import { STORAGE_KEYS } from '../constants/storageKeys'
import {
  createMenuItem,
  deleteMenuItem,
  getCafes,
  getMenuCategoriesByLang,
  getMenuItemsByLang,
  updateMenuItem,
  uploadMenuItemImage,
} from '../utils/api'

type ItemForm = {
  id: string | null
  categoryId: string
  slug: string
  nameVi: string
  nameEn: string
  descriptionVi: string
  descriptionEn: string
  basePrice: string
  currency: string
  displayOrder: string
  isActive: boolean
}

function itemToForm(iVi?: MenuItemDto, iEn?: MenuItemDto): ItemForm {
  return {
    id: iVi?.id ?? iEn?.id ?? null,
    categoryId: iVi ? String(iVi.categoryId) : iEn ? String(iEn.categoryId) : '',
    slug: iVi?.slug ?? iEn?.slug ?? '',
    nameVi: iVi?.name ?? '',
    nameEn: iEn?.name ?? '',
    descriptionVi: iVi?.description ?? '',
    descriptionEn: iEn?.description ?? '',
    basePrice: iVi?.basePrice != null ? String(iVi.basePrice) : iEn?.basePrice != null ? String(iEn.basePrice) : '',
    currency: iVi?.currency ?? iEn?.currency ?? 'VND',
    displayOrder: iVi ? String(iVi.displayOrder) : iEn ? String(iEn.displayOrder) : '0',
    isActive: iVi?.isActive ?? iEn?.isActive ?? true,
  }
}

export function MenuItemsPage() {
  const toast = useToast()

  const [cafes, setCafes] = useState<CafeDto[]>([])
  const [selectedCafeId, setSelectedCafeId] = useState<string>('')
  const [categories, setCategories] = useState<MenuCategoryDto[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('') // optional
  const [items, setItems] = useState<MenuItemDto[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const [lightboxAlt, setLightboxAlt] = useState<string>('')

  const [itemForm, setItemForm] = useState<ItemForm>(() => itemToForm())
  const [isItemModalOpen, setIsItemModalOpen] = useState(false)
  const imageInputRef = useRef<HTMLInputElement | null>(null)
  const [itemImageFile, setItemImageFile] = useState<File | null>(null)
  const [itemImagePreviewUrl, setItemImagePreviewUrl] = useState<string | null>(null)

  const canSubmitItem = useMemo(
    () =>
      itemForm.categoryId.trim() &&
      itemForm.slug.trim() &&
      itemForm.nameVi.trim() &&
      itemForm.nameEn.trim() &&
      itemForm.currency.trim() &&
      !isSubmitting &&
      selectedCafeId.trim(),
    [itemForm, isSubmitting, selectedCafeId],
  )

  async function refreshCafes() {
    const data = await getCafes()
    setCafes(data)
  }

  async function refreshMenu(cafeId: string) {
    const [cat, it] = await Promise.all([
      getMenuCategoriesByLang(cafeId, 'vi'),
      getMenuItemsByLang(cafeId, 'vi', selectedCategoryId.trim() ? selectedCategoryId : undefined),
    ])
    setCategories(cat)
    setItems(it)
  }

  useEffect(() => {
    setIsLoading(true)
    ;(async () => {
      try {
        await refreshCafes()
        const lastCafeId = localStorage.getItem(STORAGE_KEYS.menuItemsSelectedCafeId) ?? ''
        setSelectedCafeId(lastCafeId)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Tải danh sách quán thất bại')
      } finally {
        setIsLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!selectedCafeId.trim()) return
    localStorage.setItem(STORAGE_KEYS.menuItemsSelectedCafeId, selectedCafeId)
    setIsLoading(true)
    ;(async () => {
      try {
        await refreshMenu(selectedCafeId)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Tải món thất bại')
      } finally {
        setIsLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCafeId, selectedCategoryId])

  const selectedCafe = useMemo(() => cafes.find((c) => c.id === selectedCafeId) ?? null, [cafes, selectedCafeId])
  const editingItem = useMemo(() => items.find((x) => x.id === itemForm.id) ?? null, [items, itemForm.id])
  const effectiveItemImageUrl = itemImagePreviewUrl ?? editingItem?.imageUrl ?? null

  useEffect(() => {
    return () => {
      if (itemImagePreviewUrl) URL.revokeObjectURL(itemImagePreviewUrl)
    }
  }, [itemImagePreviewUrl])

  return (
    <div className="space-y-6">
      <Card
        title="Món"
        description="Bắt buộc chọn quán để xem và quản lý món. Có thể chọn danh mục hoặc để Tất cả."
        right={
          selectedCafeId ? (
            <Button
              type="button"
              variant="secondary"
              disabled={isSubmitting || isLoading}
              onClick={async () => {
                if (!selectedCafeId) return
                setIsLoading(true)
                try {
                  await refreshMenu(selectedCafeId)
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'Tải món thất bại')
                } finally {
                  setIsLoading(false)
                }
              }}
            >
              Tải lại
            </Button>
          ) : null
        }
      >
        <ImageLightbox src={lightboxSrc} alt={lightboxAlt} isOpen={Boolean(lightboxSrc)} onClose={() => setLightboxSrc(null)} />

        <div className="rounded-(--fe-radius) border border-[rgb(var(--fe-line))] bg-[rgb(var(--fe-surface))] p-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Chọn quán">
              <select
                value={selectedCafeId}
                onChange={(e) => setSelectedCafeId(e.target.value ? String(e.target.value) : '')}
                className="w-full rounded-(--fe-radius) border border-[rgb(var(--fe-line))] bg-white px-4 py-3 text-sm font-semibold text-[rgb(var(--fe-text))]"
              >
                <option value="" disabled>
                  -- Chọn quán --
                </option>
                {cafes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Danh mục (tuỳ chọn)">
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value ? String(e.target.value) : '')}
                className="w-full rounded-(--fe-radius) border border-[rgb(var(--fe-line))] bg-white px-4 py-3 text-sm font-semibold text-[rgb(var(--fe-text))]"
                disabled={!selectedCafeId.trim()}
              >
                <option value="">Tất cả</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>

            <div className="flex items-end justify-end">
              <Button
                type="button"
                disabled={!selectedCafeId.trim() || categories.length === 0 || isSubmitting}
                onClick={() => {
                  setItemForm(itemToForm())
                  setIsItemModalOpen(true)
                }}
              >
                Tạo
              </Button>
            </div>
          </div>
          {selectedCafe ? (
            <div className="mt-2 text-xs font-semibold text-[rgb(var(--fe-muted))]">
              Đang xem: {selectedCafe.name} ({selectedCafe.code})
            </div>
          ) : null}
        </div>

        <Modal
          title={itemForm.id ? `Chỉnh sửa món (${itemForm.slug})` : 'Tạo món'}
          isOpen={isItemModalOpen}
          onClose={() => {
            setIsItemModalOpen(false)
            setItemForm(itemToForm())
            setItemImageFile(null)
            if (itemImagePreviewUrl) URL.revokeObjectURL(itemImagePreviewUrl)
            setItemImagePreviewUrl(null)
          }}
          footer={
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsItemModalOpen(false)
                  setItemForm(itemToForm())
                  setItemImageFile(null)
                  if (itemImagePreviewUrl) URL.revokeObjectURL(itemImagePreviewUrl)
                  setItemImagePreviewUrl(null)
                }}
              >
                Huỷ
              </Button>
              <Button
                type="button"
                disabled={!canSubmitItem}
                onClick={async () => {
                  if (!selectedCafeId) return
                  setIsSubmitting(true)
                  try {
                    const payload = {
                      categoryId: itemForm.categoryId,
                      slug: itemForm.slug,
                      translations: {
                        vi: {
                          name: itemForm.nameVi,
                          description: itemForm.descriptionVi.trim() ? itemForm.descriptionVi : null,
                        },
                        en: {
                          name: itemForm.nameEn,
                          description: itemForm.descriptionEn.trim() ? itemForm.descriptionEn : null,
                        },
                      },
                      basePrice: itemForm.basePrice.trim() ? Number(itemForm.basePrice) : null,
                      currency: itemForm.currency,
                      displayOrder: Number(itemForm.displayOrder) || 0,
                      isActive: itemForm.isActive,
                    }
                    const saved = itemForm.id
                      ? await updateMenuItem(selectedCafeId, itemForm.id, payload)
                      : await createMenuItem(selectedCafeId, payload)

                    if (itemImageFile) {
                      await uploadMenuItemImage(saved.id, itemImageFile)
                      toast.success('Upload ảnh món thành công.')
                    }
                    toast.success('Lưu món thành công.')
                    setIsItemModalOpen(false)
                    setItemForm(itemToForm())
                    setItemImageFile(null)
                    if (itemImagePreviewUrl) URL.revokeObjectURL(itemImagePreviewUrl)
                    setItemImagePreviewUrl(null)
                    await refreshMenu(selectedCafeId)
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : 'Lưu món thất bại')
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
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null
                if (!f) return
                setItemImageFile(f)
                if (itemImagePreviewUrl) URL.revokeObjectURL(itemImagePreviewUrl)
                setItemImagePreviewUrl(URL.createObjectURL(f))
                e.target.value = ''
              }}
            />
            <Field label="Danh mục">
              <select
                value={itemForm.categoryId}
                onChange={(e) => setItemForm((s) => ({ ...s, categoryId: e.target.value }))}
                className="w-full rounded-(--fe-radius) border border-[rgb(var(--fe-line))] bg-white px-4 py-3 text-sm font-semibold text-[rgb(var(--fe-text))]"
                disabled={!selectedCafeId.trim()}
              >
                <option value="" disabled>
                  -- Chọn danh mục --
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Slug">
              <Input value={itemForm.slug} onChange={(e) => setItemForm((s) => ({ ...s, slug: e.target.value }))} />
            </Field>
            <Field label="Tên (VI)">
              <Input value={itemForm.nameVi} onChange={(e) => setItemForm((s) => ({ ...s, nameVi: e.target.value }))} />
            </Field>
            <Field label="Tên (EN)">
              <Input value={itemForm.nameEn} onChange={(e) => setItemForm((s) => ({ ...s, nameEn: e.target.value }))} />
            </Field>
            <Field label="Mô tả (VI)">
              <Input
                value={itemForm.descriptionVi}
                onChange={(e) => setItemForm((s) => ({ ...s, descriptionVi: e.target.value }))}
              />
            </Field>
            <Field label="Mô tả (EN)">
              <Input
                value={itemForm.descriptionEn}
                onChange={(e) => setItemForm((s) => ({ ...s, descriptionEn: e.target.value }))}
              />
            </Field>
            <Field label="Giá (BasePrice)">
              <Input
                value={itemForm.basePrice}
                onChange={(e) => setItemForm((s) => ({ ...s, basePrice: e.target.value }))}
                inputMode="decimal"
              />
            </Field>
            <Field label="Currency">
              <Input value={itemForm.currency} onChange={(e) => setItemForm((s) => ({ ...s, currency: e.target.value }))} />
            </Field>
            <Field label="DisplayOrder">
              <Input
                value={itemForm.displayOrder}
                onChange={(e) => setItemForm((s) => ({ ...s, displayOrder: e.target.value }))}
                inputMode="numeric"
              />
            </Field>
            <Field label="Trạng thái">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={itemForm.isActive}
                  disabled={isSubmitting}
                  onClick={() => setItemForm((s) => ({ ...s, isActive: !s.isActive }))}
                  className={[
                    'relative inline-flex h-7 w-12 items-center rounded-full border transition-colors',
                    itemForm.isActive
                      ? 'border-[rgb(var(--fe-success))] bg-[rgb(var(--fe-success))]'
                      : 'border-[rgb(var(--fe-line))] bg-[rgb(var(--fe-surface))]',
                    isSubmitting ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
                  ].join(' ')}
                >
                  <span
                    aria-hidden="true"
                    className={[
                      'inline-block h-5 w-5 transform rounded-full bg-white transition-transform',
                      itemForm.isActive ? 'translate-x-6' : 'translate-x-1',
                    ].join(' ')}
                  />
                </button>
              </div>
            </Field>

            <Field label="Ảnh món">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="group relative h-14 w-14 shrink-0 overflow-hidden rounded-(--fe-radius) border border-[rgb(var(--fe-line))] bg-[rgb(var(--fe-surface))]"
                  onClick={() => {
                    if (!effectiveItemImageUrl) return
                    setLightboxSrc(effectiveItemImageUrl)
                    setLightboxAlt(itemForm.nameVi || itemForm.nameEn || 'Ảnh món')
                  }}
                  disabled={!effectiveItemImageUrl}
                >
                  {effectiveItemImageUrl ? (
                    <>
                      <img
                        src={effectiveItemImageUrl}
                        alt={itemForm.nameVi || itemForm.nameEn || 'Ảnh món'}
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

                <Button
                  type="button"
                  variant="secondary"
                  disabled={isSubmitting}
                  onClick={() => imageInputRef.current?.click()}
                >
                  Chọn ảnh
                </Button>

                {itemImageFile ? (
                  <div className="min-w-0 flex-1 truncate text-xs font-semibold text-[rgb(var(--fe-muted))]">
                    {itemImageFile.name}
                  </div>
                ) : null}
              </div>
              <div className="mt-2 text-xs font-semibold text-[rgb(var(--fe-muted))]">Ảnh sẽ được upload khi bấm Lưu.</div>
            </Field>
          </div>
        </Modal>

        {!selectedCafeId.trim() ? (
          <div className="mt-4 text-sm font-semibold text-[rgb(var(--fe-muted))]">Vui lòng chọn quán để xem món.</div>
        ) : (
          <div className="mt-4">
            <Table
              header={
                <tr>
                  <Th>Danh mục</Th>
                  <Th>Tên</Th>
                  <Th>Giá</Th>
                  <Th className="w-32 whitespace-nowrap">Trạng thái</Th>
                  <Th className="w-40 whitespace-nowrap">Ảnh</Th>
                  <Th className="text-right">Hành động</Th>
                </tr>
              }
            >
              {items.length === 0 ? (
                <tr>
                  <Td colSpan={6}>Chưa có món.</Td>
                </tr>
              ) : null}

              {items.map((i) => (
                <tr key={i.id} className="hover:bg-[rgb(var(--fe-surface))]">
                  <Td>{categories.find((c) => c.id === i.categoryId)?.name ?? '—'}</Td>
                  <Td>
                    <div className="font-semibold">{i.name}</div>
                    <div className="mt-1 text-xs text-[rgb(var(--fe-muted))]">{i.slug}</div>
                  </Td>
                  <Td>{i.basePrice != null ? `${i.basePrice} ${i.currency}` : '—'}</Td>
                  <Td>{i.isActive ? 'Active' : 'Inactive'}</Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="group relative h-14 w-14 shrink-0 overflow-hidden rounded-(--fe-radius) border border-[rgb(var(--fe-line))] bg-[rgb(var(--fe-surface))]"
                        onClick={() => {
                          if (!i.imageUrl) return
                          setLightboxSrc(i.imageUrl)
                          setLightboxAlt(i.name)
                        }}
                        disabled={!i.imageUrl}
                      >
                        {i.imageUrl ? (
                          <>
                            <img src={i.imageUrl} alt={i.name} className="h-full w-full object-cover" loading="lazy" />
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
                    </div>
                  </Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={async () => {
                          if (!selectedCafeId.trim()) return
                          setIsSubmitting(true)
                          try {
                            const [viList, enList] = await Promise.all([
                              getMenuItemsByLang(selectedCafeId, 'vi', selectedCategoryId.trim() ? selectedCategoryId : undefined),
                              getMenuItemsByLang(selectedCafeId, 'en', selectedCategoryId.trim() ? selectedCategoryId : undefined),
                            ])
                            const vi = viList.find((x) => x.id === i.id)
                            const en = enList.find((x) => x.id === i.id)
                            setItemForm(itemToForm(vi, en))
                            setItemImageFile(null)
                            if (itemImagePreviewUrl) URL.revokeObjectURL(itemImagePreviewUrl)
                            setItemImagePreviewUrl(null)
                            setIsItemModalOpen(true)
                          } catch (err) {
                            toast.error(err instanceof Error ? err.message : 'Tải dữ liệu song ngữ thất bại')
                          } finally {
                            setIsSubmitting(false)
                          }
                        }}
                      >
                        Chỉnh sửa
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        disabled={isSubmitting || !selectedCafeId}
                        onClick={async () => {
                          if (!selectedCafeId) return
                          setIsSubmitting(true)
                          try {
                            await deleteMenuItem(selectedCafeId, i.id)
                            toast.success('Xoá món thành công.')
                            await refreshMenu(selectedCafeId)
                          } catch (err) {
                            toast.error(err instanceof Error ? err.message : 'Xoá món thất bại')
                          } finally {
                            setIsSubmitting(false)
                          }
                        }}
                      >
                        Xoá
                      </Button>
                    </div>
                  </Td>
                </tr>
              ))}
            </Table>
          </div>
        )}
      </Card>
    </div>
  )
}

