'use client'

import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { Button, Card } from '@/components/ui'
import { CreateUserForm } from './CreateUserForm'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/contexts/ToastContext'

interface User {
  id: string
  email: string
  role: string
  full_name: string | null
  department: string | null
  phone: string | null
  is_active: boolean
  created_at: string
}

export function UserManagement() {
  const { t } = useTranslation(['admin', 'common'])
  const { profile } = useAuth()
  const { showSuccess, showError } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [error, setError] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserDetail, setShowUserDetail] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError('')

      // Supabase에서 사용자 목록 조회
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      setUsers(data || [])
    } catch (err) {
      console.error('Fetch users error:', err)
      setError(err instanceof Error ? err.message : t('messages.fetchError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (profile && ['system_admin', 'manager'].includes(profile.role)) {
      fetchUsers()
    }
  }, [profile])

  const handleUserCreated = () => {
    // 새 사용자가 생성되면 목록 새로고침
    fetchUsers()
    setShowCreateForm(false)
  }

  // 권한 체크
  if (!profile || !['system_admin', 'manager'].includes(profile.role)) {
    return (
      <Card>
        <Card.Content className="text-center py-8">
          <div className="text-red-500 text-lg mb-2">❌</div>
          <p className="text-gray-600 dark:text-gray-400">{t('messages.noPermission')}</p>
        </Card.Content>
      </Card>
    )
  }

  // 사용자 상세보기 모달
  const UserDetailModal = () => {
    if (!showUserDetail || !selectedUser) return null

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800 dark:border-gray-700">
          <div className="mt-3">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">사용자 상세 정보</h3>
              <button
                onClick={() => setShowUserDetail(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">이름</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{selectedUser.full_name || '이름 없음'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">이메일</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{selectedUser.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('modals.userDetail.phone')}</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{selectedUser.phone || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">역할</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{getRoleName(selectedUser.role)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">부서</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{selectedUser.department || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">상태</label>
                <div className="mt-1">{getStatusBadge(selectedUser.is_active)}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">가입일</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {new Date(selectedUser.created_at).toLocaleDateString('ko-KR')}
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowUserDetail(false)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 사용자 편집 모달
  const UserEditModal = () => {
    const [formData, setFormData] = useState({
      full_name: editingUser?.full_name || '',
      phone: editingUser?.phone || '',
      department: editingUser?.department || '',
      role: editingUser?.role || 'user',
      is_active: editingUser?.is_active ?? true
    })
    const [saving, setSaving] = useState(false)

    if (!editingUser) return null

    const handleSave = async () => {
      setSaving(true)
      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: formData.full_name,
            phone: formData.phone,
            department: formData.department,
            role: formData.role,
            is_active: formData.is_active
          })
          .eq('id', editingUser.id)

        if (error) throw error

        // 목록 새로고침
        await fetchUsers()
        setEditingUser(null)
        showSuccess(
          t('messages.updateSuccess.title'),
          t('messages.updateSuccess.message')
        )
      } catch (err) {
        console.error('Update user error:', err)
        showError(
          t('messages.updateError.title'),
          t('messages.updateError.message')
        )
      } finally {
        setSaving(false)
      }
    }

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800 dark:border-gray-700">
          <div className="mt-3">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">사용자 정보 편집</h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">이름</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('modals.editUser.phone')}</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">부서</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">역할</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'system_admin' | 'manager' | 'user' })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="user">일반 사용자</option>
                  <option value="manager">관리자</option>
                  {profile?.role === 'system_admin' && (
                    <option value="system_admin">시스템 관리자</option>
                  )}
                </select>
              </div>
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">활성 상태</span>
                </label>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500"
                disabled={saving}
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50"
              >
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const getRoleName = (role: string) => {
    switch (role) {
      case 'system_admin': return `🔧 ${t('roles.systemAdmin')}`
      case 'manager': return `👨‍💼 ${t('roles.manager')}`
      case 'user': return `👷‍♂️ ${t('roles.user')}`
      default: return role
    }
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
        ✅ {t('status.active')}
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
        ❌ {t('status.inactive')}
      </span>
    )
  }

  const handleViewUser = (user: User) => {
    setSelectedUser(user)
    setShowUserDetail(true)
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
  }

  const handleDeleteUser = async (user: User) => {
    if (window.confirm(t('modals.deleteConfirm', { name: user.full_name || user.email }))) {
      try {
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', user.id)

        if (error) throw error

        // 목록 새로고침
        fetchUsers()
        showSuccess(
          t('messages.deleteSuccess.title'),
          t('messages.deleteSuccess.message')
        )
      } catch (err) {
        console.error('Delete user error:', err)
        showError(
          t('messages.deleteError.title'),
          t('messages.deleteError.message')
        )
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">👥 {t('title')}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {t('subtitle', { count: users.length })}
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="w-full sm:w-auto"
          >
            {showCreateForm ? `📋 ${t('buttons.userList')}` : `➕ ${t('buttons.newUser')}`}
          </Button>
        </div>
      </div>

      {/* 사용자 생성 폼 또는 사용자 목록 */}
      {showCreateForm ? (
        <CreateUserForm onUserCreated={handleUserCreated} />
      ) : (
        <Card>
          <Card.Header>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('userList.title')}</h2>
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchUsers}
                disabled={loading}
              >
                🔄 {t('buttons.refresh')}
              </Button>
            </div>
          </Card.Header>

          <Card.Content>
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-red-800 text-sm">{error}</div>
              </div>
            )}

            {loading ? (
              <div className="text-center py-8">
                <div className="text-gray-500">{t('userList.loading')}</div>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-500 mb-4">{t('userList.noUsers')}</div>
                <Button onClick={() => setShowCreateForm(true)}>
                  {t('userList.createFirst')}
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('table.name')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('table.userInfo')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('table.role')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('table.department')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('table.status')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('table.joinDate')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('table.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {user.full_name || t('table.noName')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                            {user.phone && (
                              <div className="text-xs text-gray-400 dark:text-gray-500">{user.phone}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-gray-100">
                            {getRoleName(user.role)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-gray-100">
                            {user.department || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(user.is_active)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(user.created_at).toLocaleDateString('ko-KR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewUser(user)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 px-2 py-1 rounded border border-blue-300 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                              title="상세보기"
                            >
                              👁️ {t('actions.view')}
                            </button>
                            <button
                              onClick={() => handleEditUser(user)}
                              className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 px-2 py-1 rounded border border-green-300 dark:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/30"
                              title="편집"
                            >
                              ✏️ {t('actions.edit')}
                            </button>
                            {profile?.role === 'system_admin' && user.id !== profile.id && (
                              <button
                                onClick={() => handleDeleteUser(user)}
                                className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 px-2 py-1 rounded border border-red-300 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                                title="삭제"
                              >
                                🗑️ {t('actions.delete')}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card.Content>
        </Card>
      )}

      {/* 통계 카드 */}
      {!showCreateForm && users.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <Card.Content className="text-center py-4">
              <div className="text-2xl font-bold text-blue-600">
                {users.filter(u => u.role === 'system_admin').length}
              </div>
              <div className="text-sm text-gray-800 dark:text-gray-300">{t('statistics.systemAdmins')}</div>
            </Card.Content>
          </Card>

          <Card>
            <Card.Content className="text-center py-4">
              <div className="text-2xl font-bold text-green-600">
                {users.filter(u => u.role === 'manager').length}
              </div>
              <div className="text-sm text-gray-800 dark:text-gray-300">{t('statistics.managers')}</div>
            </Card.Content>
          </Card>

          <Card>
            <Card.Content className="text-center py-4">
              <div className="text-2xl font-bold text-purple-600">
                {users.filter(u => u.role === 'user').length}
              </div>
              <div className="text-sm text-gray-800 dark:text-gray-300">{t('statistics.normalUsers')}</div>
            </Card.Content>
          </Card>

          <Card>
            <Card.Content className="text-center py-4">
              <div className="text-2xl font-bold text-orange-600">
                {users.filter(u => u.is_active).length}
              </div>
              <div className="text-sm text-gray-800 dark:text-gray-300">{t('statistics.activeUsers')}</div>
            </Card.Content>
          </Card>
        </div>
      )}

      {/* 모달들 */}
      <UserDetailModal />
      <UserEditModal />
    </div>
  )
}