'use client'

import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { Button, Input, Card } from '@/components/ui'
import { supabase } from '@/lib/supabase'

interface CreateUserData {
  email: string
  password: string
  role: 'manager' | 'user'
  full_name: string
  department: string
  phone: string
  create_auth_user: boolean
}

interface CreateUserFormProps {
  onUserCreated?: () => void
}

export function CreateUserForm({ onUserCreated }: CreateUserFormProps) {
  const { t } = useTranslation(['admin', 'common'])
  const { profile } = useAuth()
  const [formData, setFormData] = useState<CreateUserData>({
    email: '',
    password: '',
    role: 'user',
    full_name: '',
    department: '',
    phone: '',
    create_auth_user: true
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // 권한 체크
  if (!profile || !['system_admin', 'manager'].includes(profile.role)) {
    return (
      <Card>
        <Card.Content className="text-center py-8">
          <div className="text-red-500 text-lg mb-2">❌</div>
          <p className="text-gray-700 dark:text-gray-300">{t('messages.noPermission')}</p>
        </Card.Content>
      </Card>
    )
  }

  const generatePassword = () => {
    const length = 12
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let password = ''
    
    // 각 타입에서 최소 1개씩 포함
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)] // 소문자
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)] // 대문자
    password += '0123456789'[Math.floor(Math.random() * 10)] // 숫자
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)] // 특수문자
    
    // 나머지 자리수 채우기
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)]
    }
    
    // 문자 순서 섞기
    return password.split('').sort(() => Math.random() - 0.5).join('')
  }

  const handleGeneratePassword = () => {
    const newPassword = generatePassword()
    setFormData(prev => ({ ...prev, password: newPassword }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // 현재 사용자의 토큰 가져오기
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error(t('createUser.messages.authTokenNotFound'))
      }

      const response = await fetch('/api/admin/create-user-flexible', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || t('createUser.messages.error.message'))
      }

      const passwordInfo = result.credentials.password 
        ? t('createUser.messages.passwordInfo.withPassword', { password: result.credentials.password })
        : t('createUser.messages.passwordInfo.withoutPassword')
      
      const roleLabel = result.user.role === 'manager' 
        ? t('createUser.messages.roleLabels.manager')
        : t('createUser.messages.roleLabels.user')
      
      const authStatus = result.auth_status.auth_user_created 
        ? t('createUser.messages.authStatus.completed')
        : t('createUser.messages.authStatus.incomplete')
      
      const loginStatus = result.auth_status.can_login 
        ? t('createUser.messages.authStatus.canLogin')
        : t('createUser.messages.authStatus.waitingAuth')

      setSuccess(t('createUser.messages.success.details', {
        email: result.user.email,
        passwordInfo,
        role: roleLabel,
        authStatus,
        loginStatus
      }))

      // 폼 초기화
      setFormData({
        email: '',
        password: '',
        role: 'user',
        full_name: '',
        department: '',
        phone: '',
        create_auth_user: true
      })

      // 콜백 호출
      onUserCreated?.()

    } catch (err) {
      console.error('Create user error:', err)
      setError(err instanceof Error ? err.message : t('createUser.messages.error.message'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <Card.Header>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">👥 {t('createUser.title')}</h2>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {t('createUser.subtitle')}
        </p>
      </Card.Header>

      <Card.Content>
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-red-800 text-sm whitespace-pre-line">{error}</div>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-green-800 text-sm whitespace-pre-line">{success}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={`${t('createUser.form.email')} *`}
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder={t('createUser.form.emailPlaceholder')}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
                {t('createUser.form.role')} *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'manager' | 'user' }))}
                className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              >
                <option value="user">{t('createUser.form.roleOptions.user')}</option>
                {profile?.role === 'system_admin' && (
                  <option value="manager">{t('createUser.form.roleOptions.manager')}</option>
                )}
              </select>
            </div>
          </div>

          <Input
            label={`${t('createUser.form.fullName')} *`}
            type="text"
            value={formData.full_name}
            onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
            placeholder={t('createUser.form.fullNamePlaceholder')}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('createUser.form.department')}
              type="text"
              value={formData.department}
              onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
              placeholder={t('createUser.form.departmentPlaceholder')}
            />

            <Input
              label={t('createUser.form.phone')}
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder={t('createUser.form.phonePlaceholder')}
            />
          </div>

          <div className="space-y-4">
            {/* 로그인 권한 설정 */}
            <div>
                <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                {t('createUser.form.loginSettings', '로그인 권한 설정')}
              </label>
              <div className="space-y-2">
                <label className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="auth_option"
                    checked={formData.create_auth_user === true}
                    onChange={() => setFormData(prev => ({ ...prev, create_auth_user: true }))}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{t('createUser.form.immediateLogin', '즉시 로그인 가능')}</div>
                    <div className="text-xs text-gray-700 dark:text-gray-300">{t('createUser.form.immediateLoginDesc', '비밀번호를 설정하고 바로 로그인할 수 있는 계정을 생성합니다')}</div>
                  </div>
                </label>
                
                <label className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="auth_option"
                    checked={formData.create_auth_user === false}
                    onChange={() => setFormData(prev => ({ ...prev, create_auth_user: false }))}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{t('createUser.form.profileOnly', '프로필만 생성 (권한 부여 대기)')}</div>
                    <div className="text-xs text-gray-700 dark:text-gray-300">{t('createUser.form.profileOnlyDesc', '시스템에 사용자 정보만 등록하고, 로그인 권한은 나중에 부여합니다')}</div>
                  </div>
                </label>
              </div>
            </div>

            {/* 비밀번호 설정 (로그인 권한 부여시에만) */}
            {formData.create_auth_user && (
              <div>
                <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
                  {t('createUser.form.password')} *
                </label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder={t('createUser.form.passwordPlaceholder')}
                    required={formData.create_auth_user}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleGeneratePassword}
                    className="shrink-0"
                  >
                    🎲 {t('common:actions.generate', '생성')}
                  </Button>
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">
                  {t('createUser.form.passwordHint', '8자 이상, 대소문자, 숫자, 특수문자 포함 필요')}
                </p>
              </div>
            )}
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start">
              <span className="text-blue-400 text-lg mr-2">💡</span>
              <div className="text-sm text-blue-800 dark:text-blue-300">
                <p className="font-medium mb-1">{t('createUser.form.guidelinesTitle', '생성 후 안내사항:')}:</p>
                <ul className="text-xs space-y-1 text-blue-700 dark:text-blue-400">
                  <li>• {t('createUser.form.guideline1', '생성된 계정 정보를 해당 사용자에게 전달하세요')}</li>
                  <li>• {t('createUser.form.guideline2', '첫 로그인 후 반드시 비밀번호를 변경하도록 안내하세요')}</li>
                  <li>• {t('createUser.form.guideline3', '이메일 주소는 실제 사용 가능한 주소를 입력하세요')}</li>
                </ul>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            loading={loading}
            className="w-full"
            disabled={!formData.email || !formData.full_name || (formData.create_auth_user && !formData.password)}
          >
            {loading ? t('createUser.buttons.creating') : `👤 ${t('createUser.buttons.create')}`}
          </Button>
        </form>
      </Card.Content>
    </Card>
  )
}