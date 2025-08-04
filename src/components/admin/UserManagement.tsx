'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button, Card } from '@/components/ui'
import { CreateUserForm } from './CreateUserForm'
import { supabase } from '@/lib/supabase'

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
  const { profile } = useAuth()
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
      setError(err instanceof Error ? err.message : '사용자 목록을 불러오는데 실패했습니다')
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
          <p className="text-gray-600 dark:text-gray-400">사용자 관리 권한이 없습니다.</p>
        </Card.Content>
      </Card>
    )
  }

  // 사용자 상세보기 모달
  const UserDetailModal = () => {
    if (!showUserDetail || !selectedUser) return null

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">사용자 상세 정보</h3>
              <button
                onClick={() => setShowUserDetail(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">이름</label>
                <p className="mt-1 text-sm text-gray-900">{selectedUser.full_name || '이름 없음'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">이메일</label>
                <p className="mt-1 text-sm text-gray-900">{selectedUser.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">전화번호</label>
                <p className="mt-1 text-sm text-gray-900">{selectedUser.phone || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">역할</label>
                <p className="mt-1 text-sm text-gray-900">{getRoleName(selectedUser.role)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">부서</label>
                <p className="mt-1 text-sm text-gray-900">{selectedUser.department || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">상태</label>
                <div className="mt-1">{getStatusBadge(selectedUser.is_active)}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">가입일</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(selectedUser.created_at).toLocaleDateString('ko-KR')}
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowUserDetail(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
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
        alert('사용자 정보가 성공적으로 업데이트되었습니다.')
      } catch (err) {
        console.error('Update user error:', err)
        alert('사용자 정보 업데이트에 실패했습니다.')
      } finally {
        setSaving(false)
      }
    }

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">사용자 정보 편집</h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">이름</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">전화번호</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">부서</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">역할</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'system_admin' | 'manager' | 'user' })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                  <span className="text-sm font-medium text-gray-700">활성 상태</span>
                </label>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                disabled={saving}
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
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
      case 'system_admin': return '🔧 시스템 관리자'
      case 'manager': return '👨‍💼 관리자'
      case 'user': return '👷‍♂️ 일반 사용자'
      default: return role
    }
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
        ✅ 활성
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
        ❌ 비활성
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
    if (window.confirm(`정말로 ${user.full_name || user.email} 사용자를 삭제하시겠습니까?`)) {
      try {
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', user.id)

        if (error) throw error

        // 목록 새로고침
        fetchUsers()
        alert('사용자가 성공적으로 삭제되었습니다.')
      } catch (err) {
        console.error('Delete user error:', err)
        alert('사용자 삭제에 실패했습니다.')
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">👥 사용자 관리</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            전체 {users.length}명의 사용자가 등록되어 있습니다
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="w-full sm:w-auto"
          >
            {showCreateForm ? '📋 사용자 목록' : '➕ 새 사용자 생성'}
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
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">등록된 사용자 목록</h2>
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchUsers}
                disabled={loading}
              >
                🔄 새로고침
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
                <div className="text-gray-500">사용자 목록을 불러오는 중...</div>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-500 mb-4">등록된 사용자가 없습니다</div>
                <Button onClick={() => setShowCreateForm(true)}>
                  첫 번째 사용자 생성하기
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        이름
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        사용자 정보
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        역할
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        부서
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        상태
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        가입일
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        작업
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {user.full_name || '이름 없음'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            {user.phone && (
                              <div className="text-xs text-gray-400">{user.phone}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {getRoleName(user.role)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {user.department || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(user.is_active)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString('ko-KR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewUser(user)}
                              className="text-blue-600 hover:text-blue-900 px-2 py-1 rounded border border-blue-300 hover:bg-blue-50"
                              title="상세보기"
                            >
                              👁️ 보기
                            </button>
                            <button
                              onClick={() => handleEditUser(user)}
                              className="text-green-600 hover:text-green-900 px-2 py-1 rounded border border-green-300 hover:bg-green-50"
                              title="편집"
                            >
                              ✏️ 편집
                            </button>
                            {profile?.role === 'system_admin' && user.id !== profile.id && (
                              <button
                                onClick={() => handleDeleteUser(user)}
                                className="text-red-600 hover:text-red-900 px-2 py-1 rounded border border-red-300 hover:bg-red-50"
                                title="삭제"
                              >
                                🗑️ 삭제
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
              <div className="text-sm text-gray-600">시스템 관리자</div>
            </Card.Content>
          </Card>

          <Card>
            <Card.Content className="text-center py-4">
              <div className="text-2xl font-bold text-green-600">
                {users.filter(u => u.role === 'manager').length}
              </div>
              <div className="text-sm text-gray-600">관리자</div>
            </Card.Content>
          </Card>

          <Card>
            <Card.Content className="text-center py-4">
              <div className="text-2xl font-bold text-purple-600">
                {users.filter(u => u.role === 'user').length}
              </div>
              <div className="text-sm text-gray-600">일반 사용자</div>
            </Card.Content>
          </Card>

          <Card>
            <Card.Content className="text-center py-4">
              <div className="text-2xl font-bold text-orange-600">
                {users.filter(u => u.is_active).length}
              </div>
              <div className="text-sm text-gray-600">활성 사용자</div>
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