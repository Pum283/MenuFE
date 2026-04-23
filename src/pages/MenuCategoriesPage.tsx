import { useEffect, useMemo, useState } from 'react'
import type { CafeDto, MenuCategoryDto } from '../types/api'
import { Card } from '../components/ui/Card'
import { Field } from '../components/ui/Field'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Table, Td, Th } from '../components/ui/Table'
import { Modal } from '../components/ui/Modal'
import { useToast } from '../components/ui/Toast'
import { CafeSelect } from '../components/ui/CafeSelect'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { useAuthContext } from '../components/auth/AuthProvider'
import { getBrandCafesFromAccessToken } from '../utils/brandCafes'
import { getAdminLang } from '../constants/lang'
import { STORAGE_KEYS } from '../constants/storageKeys'
import {
  createMenuCategory,
  deleteMenuCategory,
  getBrandCafes,
  getCafes,
  getMenuCategoriesByLang,
  updateMenuCategory,
} from '../utils/api'

type CategoryForm = {
  id: string | null
  slug: string
  nameVi: string
  nameEn: string
  descriptionVi: string
  descriptionEn: string
  displayOrder: string
  isActive: boolean
}

function categoryToForm(cVi?: MenuCategoryDto, cEn?: MenuCategoryDto): CategoryForm {
  return {
    id: cVi?.id ?? cEn?.id ?? null,
    slug: cVi?.slug ?? cEn?.slug ?? '',
    nameVi: cVi?.name ?? '',
    nameEn: cEn?.name ?? '',
    descriptionVi: cVi?.description ?? '',
    descriptionEn: cEn?.description ?? '',
    displayOrder: cVi ? String(cVi.displayOrder) : cEn ? String(cEn.displayOrder) : '0',
    isActive: cVi?.isActive ?? cEn?.isActive ?? true,
  }
}

export function MenuCategoriesPage() {
  const toast = useToast()
  const auth = useAuthContext()

  const [cafes, setCafes] = useState<CafeDto[]>([])
  const [selectedCafeId, setSelectedCafeId] = useState<string>('')
  const [categories, setCategories] = useState<MenuCategoryDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmDeleteCategoryId, setConfirmDeleteCategoryId] = useState<string | null>(null)

  const [categoryForm, setCategoryForm] = useState<CategoryForm>(() => categoryToForm())
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)

  const canSubmitCategory = useMemo(
    () =>
      categoryForm.slug.trim() &&
      categoryForm.nameVi.trim() &&
      categoryForm.nameEn.trim() &&
      !isSubmitting &&
      selectedCafeId.trim(),
    [categoryForm, isSubmitting, selectedCafeId],
  )

  async function refreshCafes() {
    const data = auth.isAdmin
      ? await getCafes()
      : await getBrandCafes().catch(() => getBrandCafesFromAccessToken(localStorage.getItem('MENUFE_ACCESS_TOKEN')))
    setCafes(data)
  }

  async function refreshCategories(cafeId: string) {
    const data = await getMenuCategoriesByLang(cafeId, getAdminLang())
    setCategories(data)
  }

  async function toggleCategoryStatus(categoryId: string, nextIsActive: boolean) {
    if (!selectedCafeId.trim()) return
    setIsSubmitting(true)
    try {
      const [viList, enList] = await Promise.all([getMenuCategoriesByLang(selectedCafeId, 'vi'), getMenuCategoriesByLang(selectedCafeId, 'en')])
      const vi = viList.find((x) => x.id === categoryId)
      const en = enList.find((x) => x.id === categoryId)
      if (!vi || !en) {
        toast.error('Không tìm thấy dữ liệu danh mục (VI/EN).')
        return
      }

      await updateMenuCategory(selectedCafeId, categoryId, {
        slug: vi.slug,
        translations: {
          vi: { name: vi.name, description: vi.description ?? null },
          en: { name: en.name, description: en.description ?? null },
        },
        displayOrder: vi.displayOrder,
        isActive: nextIsActive,
      })
      toast.success('Cập nhật trạng thái danh mục thành công.')
      await refreshCategories(selectedCafeId)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Cập nhật trạng thái thất bại')
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    setIsLoading(true)
    ;(async () => {
      try {
        await refreshCafes()
        const lastCafeId = localStorage.getItem(STORAGE_KEYS.menuCategoriesSelectedCafeId) ?? ''
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
    localStorage.setItem(STORAGE_KEYS.menuCategoriesSelectedCafeId, selectedCafeId)
    setIsLoading(true)
    ;(async () => {
      try {
        await refreshCategories(selectedCafeId)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Tải danh mục thất bại')
      } finally {
        setIsLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCafeId])

  return (
    <div className="space-y-6">
      <Card
        title="Danh mục"
        description="Bắt buộc chọn quán để xem và quản lý danh mục."
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
                  await refreshCategories(selectedCafeId)
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'Tải danh mục thất bại')
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
        <ConfirmDialog
          title="Xác nhận xoá"
          description="Thao tác này sẽ xoá danh mục và không thể hoàn tác."
          isOpen={Boolean(confirmDeleteCategoryId)}
          isConfirming={isSubmitting}
          onCancel={() => setConfirmDeleteCategoryId(null)}
          onConfirm={async () => {
            if (!confirmDeleteCategoryId || !selectedCafeId) return
            setIsSubmitting(true)
            try {
              await deleteMenuCategory(selectedCafeId, confirmDeleteCategoryId)
              toast.success('Xoá danh mục thành công.')
              setConfirmDeleteCategoryId(null)
              await refreshCategories(selectedCafeId)
            } catch (err) {
              toast.error(err instanceof Error ? err.message : 'Xoá danh mục thất bại')
            } finally {
              setIsSubmitting(false)
            }
          }}
        />
        <div className="rounded-(--fe-radius) border border-[rgb(var(--fe-line))] bg-[rgb(var(--fe-surface))] p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Chọn quán">
              <CafeSelect
                label="Chọn quán"
                showLabel={false}
                cafes={cafes}
                value={selectedCafeId.trim() ? selectedCafeId : null}
                disabled={isLoading}
                placeholder="Chọn quán"
                emptyText="Chưa có quán"
                onChange={(nextCafeId) => setSelectedCafeId(nextCafeId ?? '')}
              />
            </Field>

            <div className="flex items-end justify-end">
              <Button
                type="button"
                disabled={!selectedCafeId.trim() || isSubmitting}
                onClick={() => {
                  setCategoryForm(categoryToForm())
                  setIsCategoryModalOpen(true)
                }}
              >
                Tạo
              </Button>
            </div>
          </div>
        </div>

        <Modal
          title={categoryForm.id ? `Chỉnh sửa danh mục (${categoryForm.slug})` : 'Tạo danh mục'}
          isOpen={isCategoryModalOpen}
          onClose={() => {
            setIsCategoryModalOpen(false)
            setCategoryForm(categoryToForm())
          }}
          footer={
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsCategoryModalOpen(false)
                  setCategoryForm(categoryToForm())
                }}
              >
                Huỷ
              </Button>
              <Button
                type="button"
                disabled={!canSubmitCategory}
                onClick={async () => {
                  if (!selectedCafeId) return
                  setIsSubmitting(true)
                  try {
                    const payload = {
                      slug: categoryForm.slug,
                      translations: {
                        vi: {
                          name: categoryForm.nameVi,
                          description: categoryForm.descriptionVi.trim() ? categoryForm.descriptionVi : null,
                        },
                        en: {
                          name: categoryForm.nameEn,
                          description: categoryForm.descriptionEn.trim() ? categoryForm.descriptionEn : null,
                        },
                      },
                      displayOrder: Number(categoryForm.displayOrder) || 0,
                      isActive: categoryForm.isActive,
                    }
                    if (categoryForm.id) await updateMenuCategory(selectedCafeId, categoryForm.id, payload)
                    else await createMenuCategory(selectedCafeId, payload)
                    toast.success('Lưu danh mục thành công.')
                    setIsCategoryModalOpen(false)
                    setCategoryForm(categoryToForm())
                    await refreshCategories(selectedCafeId)
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : 'Lưu danh mục thất bại')
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
            <Field label="Slug">
              <Input value={categoryForm.slug} onChange={(e) => setCategoryForm((s) => ({ ...s, slug: e.target.value }))} />
            </Field>
            <Field label="Tên (VI)">
              <Input value={categoryForm.nameVi} onChange={(e) => setCategoryForm((s) => ({ ...s, nameVi: e.target.value }))} />
            </Field>
            <Field label="Tên (EN)">
              <Input value={categoryForm.nameEn} onChange={(e) => setCategoryForm((s) => ({ ...s, nameEn: e.target.value }))} />
            </Field>
            <Field label="Mô tả (VI)">
              <Input
                value={categoryForm.descriptionVi}
                onChange={(e) => setCategoryForm((s) => ({ ...s, descriptionVi: e.target.value }))}
              />
            </Field>
            <Field label="Mô tả (EN)">
              <Input
                value={categoryForm.descriptionEn}
                onChange={(e) => setCategoryForm((s) => ({ ...s, descriptionEn: e.target.value }))}
              />
            </Field>
            <Field label="DisplayOrder">
              <Input
                value={categoryForm.displayOrder}
                onChange={(e) => setCategoryForm((s) => ({ ...s, displayOrder: e.target.value }))}
                inputMode="numeric"
              />
            </Field>
            <Field label="Trạng thái">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={categoryForm.isActive}
                  disabled={isSubmitting}
                  onClick={() => setCategoryForm((s) => ({ ...s, isActive: !s.isActive }))}
                  className={[
                    'relative inline-flex h-7 w-12 items-center rounded-full border transition-colors',
                    categoryForm.isActive
                      ? 'border-[rgb(var(--fe-success))] bg-[rgb(var(--fe-success))]'
                      : 'border-[rgb(var(--fe-line))] bg-[rgb(var(--fe-surface))]',
                    isSubmitting ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
                  ].join(' ')}
                >
                  <span
                    aria-hidden="true"
                    className={[
                      'inline-block h-5 w-5 transform rounded-full bg-white transition-transform',
                      categoryForm.isActive ? 'translate-x-6' : 'translate-x-1',
                    ].join(' ')}
                  />
                </button>
              </div>
            </Field>
          </div>
        </Modal>

        {!selectedCafeId.trim() ? (
          <div className="mt-4 text-sm font-semibold text-[rgb(var(--fe-muted))]">Vui lòng chọn quán để xem danh mục.</div>
        ) : (
          <div className="mt-4">
            <div className="md:hidden">
              {categories.length === 0 ? (
                <div className="rounded-(--fe-radius) border border-[rgb(var(--fe-line))] bg-white p-4 text-sm font-semibold text-[rgb(var(--fe-muted))]">
                  Chưa có danh mục.
                </div>
              ) : (
                <div className="grid gap-3">
                  {categories.map((c) => (
                    <div key={c.id} className="rounded-(--fe-radius) border border-[rgb(var(--fe-line))] bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-[rgb(var(--fe-text))]">{c.name}</div>
                          <div className="mt-1 truncate text-xs font-semibold text-[rgb(var(--fe-muted))]">{c.slug}</div>
                        </div>
                        <div
                          className={[
                            'shrink-0 rounded-[calc(var(--fe-radius)+999px)] border px-3 py-1 text-xs font-semibold',
                            c.isActive
                              ? 'border-[rgb(var(--fe-success))] bg-[rgba(var(--fe-success),0.10)] text-[rgb(var(--fe-success))]'
                              : 'border-[rgb(var(--fe-line))] bg-[rgb(var(--fe-surface))] text-[rgb(var(--fe-muted))]',
                          ].join(' ')}
                        >
                          {c.isActive ? 'Active' : 'Inactive'}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="text-xs font-semibold text-[rgb(var(--fe-muted))]">Order</div>
                        <div className="text-xs font-semibold text-[rgb(var(--fe-text))]">{c.displayOrder}</div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={c.isActive}
                          disabled={isSubmitting}
                          onClick={() => void toggleCategoryStatus(c.id, !c.isActive)}
                          className={[
                            'relative inline-flex h-7 w-12 items-center rounded-full border transition-colors',
                            c.isActive
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
                              c.isActive ? 'translate-x-6' : 'translate-x-1',
                            ].join(' ')}
                          />
                        </button>
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={isSubmitting}
                          onClick={async () => {
                            if (!selectedCafeId.trim()) return
                            setIsSubmitting(true)
                            try {
                              const [viList, enList] = await Promise.all([
                                getMenuCategoriesByLang(selectedCafeId, 'vi'),
                                getMenuCategoriesByLang(selectedCafeId, 'en'),
                              ])
                              const vi = viList.find((x) => x.id === c.id)
                              const en = enList.find((x) => x.id === c.id)
                              setCategoryForm(categoryToForm(vi, en))
                              setIsCategoryModalOpen(true)
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
                          onClick={() => setConfirmDeleteCategoryId(c.id)}
                        >
                          Xoá
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
                    <Th>Slug</Th>
                    <Th>Tên</Th>
                    <Th>Order</Th>
                    <Th className="w-32 whitespace-nowrap">Trạng thái</Th>
                    <Th className="text-right">Hành động</Th>
                  </tr>
                }
              >
                {categories.length === 0 ? (
                  <tr>
                    <Td colSpan={5}>Chưa có danh mục.</Td>
                  </tr>
                ) : null}

                {categories.map((c) => (
                  <tr key={c.id} className="hover:bg-[rgb(var(--fe-surface))]">
                    <Td>{c.slug}</Td>
                    <Td>{c.name}</Td>
                    <Td>{c.displayOrder}</Td>
                    <Td>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={c.isActive}
                        disabled={isSubmitting}
                        onClick={() => void toggleCategoryStatus(c.id, !c.isActive)}
                        className={[
                          'relative inline-flex h-7 w-12 items-center rounded-full border transition-colors',
                          c.isActive
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
                            c.isActive ? 'translate-x-6' : 'translate-x-1',
                          ].join(' ')}
                        />
                      </button>
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
                                getMenuCategoriesByLang(selectedCafeId, 'vi'),
                                getMenuCategoriesByLang(selectedCafeId, 'en'),
                              ])
                              const vi = viList.find((x) => x.id === c.id)
                              const en = enList.find((x) => x.id === c.id)
                              setCategoryForm(categoryToForm(vi, en))
                              setIsCategoryModalOpen(true)
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
                          onClick={() => setConfirmDeleteCategoryId(c.id)}
                        >
                          Xoá
                        </Button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </Table>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

