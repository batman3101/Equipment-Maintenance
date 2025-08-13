'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useSystemSettings } from '@/contexts/SystemSettingsContext'
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
  const { settings, loading: settingsLoading } = useSystemSettings()
  const { t } = useTranslation(['auth', 'common'])

  // 브랜딩 이미지 로드 효과
  useEffect(() => {
    const loadBrandingImages = () => {
      // 심볼 이미지 로드
      if (settings.branding?.symbolUrl) {
        const symbolImg = document.getElementById('login-symbol') as HTMLImageElement
        const symbolPlaceholder = document.getElementById('symbol-placeholder')
        
        if (symbolImg && symbolPlaceholder) {
          symbolImg.src = settings.branding.symbolUrl
          symbolImg.classList.remove('hidden')
          symbolPlaceholder.classList.add('hidden')
        }
      }

      // 로고 이미지 로드
      if (settings.branding?.logoUrl) {
        const logoImg = document.getElementById('login-logo') as HTMLImageElement
        const logoPlaceholder = document.getElementById('logo-placeholder')
        
        if (logoImg && logoPlaceholder) {
          logoImg.src = settings.branding.logoUrl
          logoImg.classList.remove('hidden')
          logoPlaceholder.classList.add('hidden')
        }
      }
    }

    // 설정이 로드되면 이미지를 설정
    if (settings && !settingsLoading) {
      loadBrandingImages()
    }
  }, [settings, settingsLoading])

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
        {/* 심볼과 로고 컨테이너 */}
        <div className="text-center space-y-6">
          {/* 심볼 컨테이너 */}
          <div className="flex justify-center">
            <div 
              id="login-symbol-container" 
              className="w-20 h-20 flex items-center justify-center overflow-hidden"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                id="login-symbol" 
                className="max-w-full max-h-full object-contain hidden" 
                alt="Company Symbol"
                onError={() => {
                  const img = document.getElementById('login-symbol') as HTMLImageElement;
                  const placeholder = document.getElementById('symbol-placeholder');
                  if (img && placeholder) {
                    img.classList.add('hidden');
                    placeholder.classList.remove('hidden');
                  }
                }}
              />
              <div 
                id="symbol-placeholder" 
                className="w-20 h-20 bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500 text-xs"
              >
                심볼
              </div>
            </div>
          </div>
          
          {/* 로고 컨테이너 */}
          <div className="flex justify-center">
            <div 
              id="login-logo-container" 
              className="max-w-xs h-16 flex items-center justify-center overflow-hidden px-4"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                id="login-logo" 
                className="max-w-full max-h-full object-contain hidden" 
                alt="Company Logo"
                onError={() => {
                  const img = document.getElementById('login-logo') as HTMLImageElement;
                  const placeholder = document.getElementById('logo-placeholder');
                  if (img && placeholder) {
                    img.classList.add('hidden');
                    placeholder.classList.remove('hidden');
                  }
                }}
              />
              <div 
                id="logo-placeholder" 
                className="max-w-xs h-16 bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500 text-xs"
              >
                회사 로고
              </div>
            </div>
          </div>
          
          {/* 시스템 설명 */}
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            {t('auth:login.subtitle')}
          </p>
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