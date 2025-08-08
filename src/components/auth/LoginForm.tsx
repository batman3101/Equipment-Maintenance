'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button, Input, Card, ThemeToggle, LanguageToggle } from '@/components/ui'
import { useTranslation } from 'react-i18next'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  
  const { signIn } = useAuth()
  const { t } = useTranslation(['auth', 'common'])

  // [SRP] Rule: 이메일 검증 로직을 별도 함수로 분리
  const validateEmail = (email: string): string => {
    if (!email.trim()) {
      return t('auth:login.validation.emailRequired')
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return t('auth:login.validation.emailInvalid')
    }
    return ''
  }

  // [SRP] Rule: 비밀번호 검증 로직을 별도 함수로 분리
  const validatePassword = (password: string): string => {
    if (!password) {
      return t('auth:login.validation.passwordRequired')
    }
    if (password.length < 6) {
      return t('auth:login.validation.passwordMinLength')
    }
    return ''
  }

  // [SRP] Rule: 실시간 검증을 위한 함수들
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)
    if (emailError) {
      setEmailError(validateEmail(value))
    }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPassword(value)
    if (passwordError) {
      setPasswordError(validatePassword(value))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // [SRP] Rule: 폼 검증 로직 분리
    const emailValidationError = validateEmail(email)
    const passwordValidationError = validatePassword(password)
    
    setEmailError(emailValidationError)
    setPasswordError(passwordValidationError)
    
    // 검증 실패 시 제출 중단
    if (emailValidationError || passwordValidationError) {
      return
    }

    setLoading(true)
    setError('')

    try {
      await signIn(email, password)
    } catch (err) {
      // [DIP] Rule: 추상화된 번역 키에 의존하여 에러 메시지 처리
      if (err instanceof Error) {
        // 특정 에러 타입에 따른 번역 키 매핑
        const errorMessage = err.message.toLowerCase()
        if (errorMessage.includes('invalid') || errorMessage.includes('credential')) {
          setError(t('auth:login.invalidCredentials'))
        } else if (errorMessage.includes('locked') || errorMessage.includes('disabled')) {
          setError(t('auth:login.accountLocked'))
        } else if (errorMessage.includes('expired') || errorMessage.includes('session')) {
          setError(t('auth:login.sessionExpired'))
        } else {
          setError(t('auth:login.loginError'))
        }
      } else {
        setError(t('auth:login.loginError'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      {/* 토글 버튼들 - 우상단 고정 */}
      <div className="fixed top-4 right-4 z-50 flex items-center space-x-2">
        <LanguageToggle />
        <ThemeToggle />
      </div>
      
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            {t('auth:login.title')} - CNC
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {t('auth:login.subtitle')}
          </p>
        </div>
        
        {/* 시스템 안내 */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-blue-400 text-lg">🏭</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                {t('auth:login.systemInfo.title')}
              </h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                <p>{t('auth:login.systemInfo.description')}</p>
                <p className="text-xs mt-1 text-blue-600 dark:text-blue-400">
                  {t('auth:login.systemInfo.contactAdmin')}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <Card>
          <Card.Content>
            <form 
              onSubmit={handleSubmit} 
              className="space-y-6"
              aria-label={t('auth:login.accessibility.loginForm')}
              noValidate
            >
              {error && (
                <div 
                  id="login-error"
                  className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded"
                  role="alert"
                  aria-live="polite"
                >
                  {error}
                </div>
              )}
              
              <Input
                label={t('auth:login.email')}
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder={t('auth:login.emailPlaceholder')}
                required
                error={emailError}
                aria-label={t('auth:login.accessibility.emailField')}
                aria-describedby={error ? 'login-error' : undefined}
              />
              
              <Input
                label={t('auth:login.password')}
                type="password"
                value={password}
                onChange={handlePasswordChange}
                placeholder={t('auth:login.passwordPlaceholder')}
                required
                error={passwordError}
                aria-label={t('auth:login.accessibility.passwordField')}
                aria-describedby={error ? 'login-error' : undefined}
              />
              
              <Button
                type="submit"
                loading={loading}
                className="w-full"
                aria-label={loading ? t('common:messages.loading') : t('auth:login.loginButton')}
              >
                {loading ? t('common:messages.loading') : t('auth:login.loginButton')}
              </Button>
            </form>
          </Card.Content>
        </Card>
        
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('auth:login.systemVersion')}
          </p>
        </div>
      </div>
    </div>
  )
}