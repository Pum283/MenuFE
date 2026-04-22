import { useEffect, useMemo, useState } from 'react'
import type { CafeDto } from '../types/api'
import { Card } from '../components/ui/Card'
import { Field } from '../components/ui/Field'
import { Button } from '../components/ui/Button'
import { useToast } from '../components/ui/Toast'
import { getCafes, getMenuCategories, getMenuItems } from '../utils/api'
import { useAuthContext } from '../components/auth/AuthProvider'

type CafeStats = {
  categoriesCount: number
  itemsCount: number
}

export function DashboardPage() {
  const auth = useAuthContext()
  const toast = useToast()
  const [cafes, setCafes] = useState<CafeDto[]>([])
  const [selectedCafeId, setSelectedCafeId] = useState<string | null>(null)
  const [stats, setStats] = useState<CafeStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const selectedCafe = useMemo(() => cafes.find((c) => c.id === selectedCafeId) ?? null, [cafes, selectedCafeId])

  async function refresh() {
    setIsLoading(true)
    try {
      const data = await getCafes()
      setCafes(data)
      const nextCafeId = selectedCafeId ?? data[0]?.id ?? null
      setSelectedCafeId(nextCafeId)
      if (nextCafeId) {
        const [cats, items] = await Promise.all([getMenuCategories(nextCafeId), getMenuItems(nextCafeId)])
        setStats({ categoriesCount: cats.length, itemsCount: items.length })
      } else {
        setStats(null)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Tải dữ liệu thất bại')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-6">
      <Card
        title="Tổng quan"
        description="Tóm tắt nhanh theo quán (danh mục/món)."
        right={
          <Button type="button" variant="secondary" disabled={isLoading} onClick={() => void refresh()}>
            Tải lại
          </Button>
        }
      >
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-(--fe-radius) border border-[rgb(var(--fe-line))] bg-[rgb(var(--fe-surface))] p-4">
            <div className="text-sm font-semibold text-[rgb(var(--fe-muted))]">Vai trò</div>
            <div className="mt-2 text-base font-semibold text-[rgb(var(--fe-text))]">{auth.isAdmin ? 'Admin' : 'Brand'}</div>
          </div>

          <div className="rounded-(--fe-radius) border border-[rgb(var(--fe-line))] bg-[rgb(var(--fe-surface))] p-4">
            <div className="text-sm font-semibold text-[rgb(var(--fe-muted))]">Số quán</div>
            <div className="mt-2 text-base font-semibold text-[rgb(var(--fe-text))]">{cafes.length}</div>
          </div>

          <div className="rounded-(--fe-radius) border border-[rgb(var(--fe-line))] bg-[rgb(var(--fe-surface))] p-4">
            <div className="text-sm font-semibold text-[rgb(var(--fe-muted))]">Quán đang xem</div>
            <div className="mt-2 text-base font-semibold text-[rgb(var(--fe-text))]">{selectedCafe?.name ?? '—'}</div>
            <div className="mt-1 text-xs text-[rgb(var(--fe-muted))]">{selectedCafe?.code ?? ''}</div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-(--fe-radius) border border-[rgb(var(--fe-line))] bg-white p-4">
            <div className="text-base font-semibold text-[rgb(var(--fe-text))]">Chọn quán để xem số liệu</div>
            <div className="mt-4">
              <Field label="Quán">
                <select
                  value={selectedCafeId ?? ''}
                  onChange={async (e) => {
                    const cafeId = e.target.value ? String(e.target.value) : null
                    setSelectedCafeId(cafeId)
                    if (!cafeId) {
                      setStats(null)
                      return
                    }
                    setIsLoading(true)
                    try {
                      const [cats, items] = await Promise.all([getMenuCategories(cafeId), getMenuItems(cafeId)])
                      setStats({ categoriesCount: cats.length, itemsCount: items.length })
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : 'Tải số liệu thất bại')
                    } finally {
                      setIsLoading(false)
                    }
                  }}
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
            </div>
          </div>

          <div className="rounded-(--fe-radius) border border-[rgb(var(--fe-line))] bg-white p-4">
            <div className="text-base font-semibold text-[rgb(var(--fe-text))]">Số liệu menu</div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-(--fe-radius) border border-[rgb(var(--fe-line))] bg-[rgb(var(--fe-surface))] p-4">
                <div className="text-sm font-semibold text-[rgb(var(--fe-muted))]">Danh mục</div>
                <div className="mt-2 text-base font-semibold text-[rgb(var(--fe-text))]">{stats?.categoriesCount ?? '—'}</div>
              </div>
              <div className="rounded-(--fe-radius) border border-[rgb(var(--fe-line))] bg-[rgb(var(--fe-surface))] p-4">
                <div className="text-sm font-semibold text-[rgb(var(--fe-muted))]">Món</div>
                <div className="mt-2 text-base font-semibold text-[rgb(var(--fe-text))]">{stats?.itemsCount ?? '—'}</div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

