import { useEffect, useMemo, useState } from 'react'
import { Card } from '../components/ui/Card'
import { Field } from '../components/ui/Field'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Table, Td, Th } from '../components/ui/Table'
import { Modal } from '../components/ui/Modal'
import { useToast } from '../components/ui/Toast'
import type { CafeDto } from '../types/api'
import type { AdminUserDto } from '../utils/api'
import { adminBlockUser, adminCreateUser, adminGetUsers, adminUpsertCafeMember, getCafes } from '../utils/api'

export function UsersPage() {
  const toast = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [q, setQ] = useState<string>('')
  const [rows, setRows] = useState<AdminUserDto[]>([])
  const [cafes, setCafes] = useState<CafeDto[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [blockedByUserId, setBlockedByUserId] = useState<Record<string, boolean>>({})
  const [savedCafeIdsByUserId, setSavedCafeIdsByUserId] = useState<Record<string, string[]>>({})

  const [createEmail, setCreateEmail] = useState('')
  const [createPassword, setCreatePassword] = useState('')
  const [createRole, setCreateRole] = useState<'admin' | 'brand'>('brand')

  const [assignUserId, setAssignUserId] = useState<string | null>(null)
  const [assignCafeIds, setAssignCafeIds] = useState<string[]>([])
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [assignCafeQuery, setAssignCafeQuery] = useState<string>('')

  const createCanSubmit = useMemo(
    () => createEmail.trim() && createPassword.trim() && !isSubmitting,
    [createEmail, createPassword, isSubmitting],
  )

  const filteredCafes = useMemo(() => {
    const keyword = assignCafeQuery.trim().toLowerCase()
    if (!keyword) return cafes
    return cafes.filter((c) => `${c.name} ${c.code}`.toLowerCase().includes(keyword))
  }, [assignCafeQuery, cafes])

  const selectedCafeNamesText = useMemo(() => {
    if (assignCafeIds.length === 0) return 'Chưa chọn quán nào'
    const byId = new Map(cafes.map((c) => [c.id, c] as const))
    const names = assignCafeIds.map((id) => byId.get(id)?.name ?? '').filter(Boolean)
    return names.length ? names.join(', ') : 'Đã chọn quán'
  }, [assignCafeIds, cafes])

  useEffect(() => {
    ;(async () => {
      try {
        const data = await getCafes()
        setCafes(data)
      } catch {
        // ignore: trang này vẫn dùng được cho thao tác block user
      }
    })()
  }, [])

  async function refreshUsers(nextQ?: string) {
    setIsLoading(true)
    try {
      const data = await adminGetUsers(nextQ)
      setRows(data)

      // seed local UI state from server data
      const nextBlocked: Record<string, boolean> = {}
      const nextSavedCafeIds: Record<string, string[]> = {}
      for (const u of data) {
        nextBlocked[u.id] = u.status === 'blocked'
        nextSavedCafeIds[u.id] = u.cafeMemberships.filter((m) => m.status === 'active').map((m) => m.cafeId)
      }
      setBlockedByUserId(nextBlocked)
      setSavedCafeIdsByUserId(nextSavedCafeIds)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Tải danh sách user thất bại')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void refreshUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-6">
      <Card
        title="Quản lý tài khoản (Admin)"
        description="Danh sách user từ DB. Block/Unblock và gán quán quản lý thao tác ngay trên từng hàng."
        right={
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" disabled={isSubmitting || isLoading} onClick={() => void refreshUsers(q)}>
              Tải lại
            </Button>
            <Button
              type="button"
              onClick={() => {
                setIsCreateModalOpen(true)
              }}
              disabled={isSubmitting}
            >
              Tạo
            </Button>
          </div>
        }
      >
        <Modal
          title="Tạo user"
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          footer={
            <>
              <Button type="button" variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
                Huỷ
              </Button>
              <Button
                type="button"
                disabled={!createCanSubmit}
                onClick={async () => {
                  setIsSubmitting(true)
                  try {
                    await adminCreateUser({
                      email: createEmail,
                      password: createPassword,
                      roleCode: createRole,
                    })
                    toast.success('Tạo user thành công.')
                    setCreateEmail('')
                    setCreatePassword('')
                    setCreateRole('brand')
                    setIsCreateModalOpen(false)
                    await refreshUsers(q)
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : 'Tạo user thất bại')
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
            <Field label="Email">
              <Input value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} autoComplete="email" />
            </Field>
            <Field label="Mật khẩu">
              <Input
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                type="password"
                autoComplete="new-password"
              />
            </Field>
            <Field label="Role">
              <select
                value={createRole}
                onChange={(e) => setCreateRole(e.target.value as 'admin' | 'brand')}
                className="w-full rounded-(--fe-radius) border border-[rgb(var(--fe-line))] bg-white px-4 py-3 text-sm font-semibold text-[rgb(var(--fe-text))]"
              >
                <option value="admin">admin</option>
                <option value="brand">brand</option>
              </select>
            </Field>
          </div>
        </Modal>

        <Modal
          title={
            assignUserId
              ? `Gán quán quản lý (${rows.find((x) => x.id === assignUserId)?.email ?? 'user'})`
              : 'Gán quán quản lý'
          }
          isOpen={isAssignModalOpen}
          onClose={() => {
            setIsAssignModalOpen(false)
            setAssignUserId(null)
            setAssignCafeIds([])
            setAssignCafeQuery('')
          }}
          footer={
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsAssignModalOpen(false)
                  setAssignUserId(null)
                  setAssignCafeIds([])
                  setAssignCafeQuery('')
                }}
              >
                Huỷ
              </Button>
              <Button
                type="button"
                disabled={isSubmitting || !assignUserId || cafes.length === 0}
                onClick={async () => {
                  if (!assignUserId) return
                  setIsSubmitting(true)
                  try {
                    const prev = savedCafeIdsByUserId[assignUserId] ?? []
                    const next = assignCafeIds

                    const toUnassign = prev.filter((id) => !next.includes(id))
                    const toAssign = next

                    await Promise.all(
                      [
                        ...toAssign.map(async (cafeId) => {
                          await adminUpsertCafeMember({ cafeId, userId: assignUserId, isBlocked: false, reason: null })
                        }),
                        ...toUnassign.map(async (cafeId) => {
                          await adminUpsertCafeMember({ cafeId, userId: assignUserId, isBlocked: true, reason: null })
                        }),
                      ],
                    )
                    setSavedCafeIdsByUserId((prevState) => ({ ...prevState, [assignUserId]: next }))
                    toast.success('Cập nhật quán quản lý thành công.')
                    setIsAssignModalOpen(false)
                    setAssignUserId(null)
                    setAssignCafeIds([])
                    setAssignCafeQuery('')
                    await refreshUsers(q)
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : 'Cập nhật quán quản lý thất bại')
                  } finally {
                    setIsSubmitting(false)
                  }
                }}
              >
                Lưu thay đổi
              </Button>
            </>
          }
        >
          <div className="grid gap-4">
            <Field
              label="Quán quản lý"
              hint={
                assignUserId && rows.find((x) => x.id === assignUserId)?.cafeMemberships?.length
                  ? `Hiện có: ${
                      rows
                        .find((x) => x.id === assignUserId)!
                        .cafeMemberships.filter((m) => m.status === 'active')
                        .map((m) => m.cafeName)
                        .join(', ') || 'Không có quán'
                    }`
                  : 'Chọn một hoặc nhiều quán để gán quản lý.'
              }
            >
              <div className="space-y-3">
                <Input
                  value={assignCafeQuery}
                  onChange={(e) => setAssignCafeQuery(e.target.value)}
                  placeholder="Tìm quán theo tên/code..."
                  disabled={cafes.length === 0 || isSubmitting}
                />

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-[rgb(var(--fe-muted))]">
                    Đã chọn: {assignCafeIds.length} / {cafes.length}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={cafes.length === 0 || isSubmitting}
                      onClick={() => setAssignCafeIds(filteredCafes.map((c) => c.id))}
                    >
                      Chọn tất cả
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={assignCafeIds.length === 0 || isSubmitting}
                      onClick={() => setAssignCafeIds([])}
                    >
                      Bỏ chọn
                    </Button>
                  </div>
                </div>

                <div className="max-h-72 overflow-auto rounded-(--fe-radius) border border-[rgb(var(--fe-line))] bg-white p-2">
                  {filteredCafes.length === 0 ? (
                    <div className="p-3 text-sm font-semibold text-[rgb(var(--fe-muted))]">Không tìm thấy quán phù hợp.</div>
                  ) : (
                    <div className="grid gap-2">
                      {filteredCafes.map((c) => {
                        const isChecked = assignCafeIds.includes(c.id)
                        return (
                          <label
                            key={c.id}
                            className={[
                              'group flex cursor-pointer items-start justify-between gap-3 rounded-(--fe-radius) border px-3 py-2',
                              isChecked
                                ? 'border-[rgb(var(--fe-success))] bg-[rgb(var(--fe-surface))]'
                                : 'border-[rgb(var(--fe-line))] bg-white hover:bg-[rgb(var(--fe-surface))]',
                              isSubmitting ? 'opacity-60' : '',
                            ].join(' ')}
                          >
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                disabled={isSubmitting}
                                onChange={() => {
                                  setAssignCafeIds((prev) => {
                                    if (prev.includes(c.id)) return prev.filter((x) => x !== c.id)
                                    return [...prev, c.id]
                                  })
                                }}
                                className="sr-only"
                              />
                              <span
                                aria-hidden="true"
                                className={[
                                  'mt-0.5 flex h-5 w-5 items-center justify-center rounded-(--fe-radius) border text-xs font-bold transition-colors',
                                  isChecked
                                    ? 'border-[rgb(var(--fe-success))] bg-[rgb(var(--fe-success))] text-white'
                                    : 'border-[rgb(var(--fe-line))] bg-[rgb(var(--fe-surface))] text-transparent group-hover:border-[rgb(var(--fe-success))]',
                                ].join(' ')}
                              >
                                ✓
                              </span>
                              <div>
                                <div className="text-sm font-semibold text-[rgb(var(--fe-text))]">{c.name}</div>
                                <div className="mt-1 text-xs font-semibold text-[rgb(var(--fe-muted))]">{c.code}</div>
                              </div>
                            </div>
                            <div className="text-xs font-semibold text-[rgb(var(--fe-muted))]">
                              {isChecked ? 'Đã chọn' : ''}
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div className="text-xs font-semibold text-[rgb(var(--fe-muted))] truncate" title={selectedCafeNamesText}>
                  {selectedCafeNamesText}
                </div>
              </div>
            </Field>
          </div>
        </Modal>

        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-semibold text-[rgb(var(--fe-muted))]">Danh sách user</div>
          <div className="flex w-full gap-2 md:w-auto">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo email..."
              className="w-full md:w-72"
            />
            <Button type="button" variant="secondary" disabled={isSubmitting || isLoading} onClick={() => void refreshUsers(q)}>
              Tìm
            </Button>
          </div>
        </div>
        <Table
          header={
            <tr>
              <Th>Email</Th>
              <Th>Roles</Th>
              <Th>Quán quản lý</Th>
              <Th>Trạng thái</Th>
              <Th className="text-right">Hành động</Th>
            </tr>
          }
        >
          {rows.length === 0 ? (
            <tr>
              <Td colSpan={5}>Chưa có user.</Td>
            </tr>
          ) : null}

          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-[rgb(var(--fe-surface))]">
              <Td>{r.email}</Td>
              <Td>{r.roles.join(', ')}</Td>
              <Td>
                {r.cafeMemberships.filter((m) => m.status === 'active').length ? (
                  <div className="text-sm font-semibold text-[rgb(var(--fe-text))]">
                    {r.cafeMemberships
                      .filter((m) => m.status === 'active')
                      .map((m) => m.cafeName)
                      .join(', ')}
                  </div>
                ) : (
                  <div className="text-sm font-semibold text-[rgb(var(--fe-muted))]">Không có quán</div>
                )}
              </Td>
              <Td>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={!Boolean(blockedByUserId[r.id])}
                    disabled={isSubmitting}
                    onClick={async () => {
                      setIsSubmitting(true)
                      try {
                        const nextIsBlocked = !Boolean(blockedByUserId[r.id])
                        await adminBlockUser(r.id, { isBlocked: nextIsBlocked, reason: null })
                        setBlockedByUserId((prev) => ({ ...prev, [r.id]: nextIsBlocked }))
                        toast.success('Cập nhật trạng thái user thành công.')
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : 'Cập nhật trạng thái thất bại')
                      } finally {
                        setIsSubmitting(false)
                      }
                    }}
                    className={[
                      'relative inline-flex h-7 w-12 items-center rounded-full border transition-colors',
                      blockedByUserId[r.id]
                        ? 'border-[rgb(var(--fe-line))] bg-[rgb(var(--fe-surface))]'
                        : 'border-[rgb(var(--fe-success))] bg-[rgb(var(--fe-success))]',
                      isSubmitting ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
                    ].join(' ')}
                  >
                    <span
                      aria-hidden="true"
                      className={[
                        'inline-block h-5 w-5 transform rounded-full bg-white transition-transform',
                        blockedByUserId[r.id] ? 'translate-x-1' : 'translate-x-6',
                      ].join(' ')}
                    />
                  </button>
                </div>
              </Td>
              <Td className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={isSubmitting || cafes.length === 0}
                    onClick={async () => {
                      setAssignUserId(r.id)
                      setAssignCafeIds(savedCafeIdsByUserId[r.id] ?? [])
                      setIsAssignModalOpen(true)
                      setAssignCafeQuery('')
                    }}
                  >
                    Gán thêm quán
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

