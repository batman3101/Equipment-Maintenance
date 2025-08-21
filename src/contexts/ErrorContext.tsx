'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { ApiError, ApiErrorHandler } from '@/components/error/ApiErrorHandler'

/**
 * 에러 컨텍스트 타입 정의
 */
interface ErrorContextType {
  // 현재 에러 상태
  errors: Array<ApiError & { id: string }>
  
  // 에러 추가/제거 함수
  addError: (error: ApiError | string) => void
  removeError: (id: string) => void
  clearErrors: () => void
  
  // 특정 컴포넌트의 에러 상태 관리
  setComponentError: (componentId: string, error: ApiError | string | null) => void
  getComponentError: (componentId: string) => (ApiError & { id: string }) | null
  
  // 글로벌 에러 알림 설정
  showGlobalErrors: boolean
  setShowGlobalErrors: (show: boolean) => void
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined)

interface ErrorProviderProps {
  children: ReactNode
  maxErrors?: number
  autoRemoveDelay?: number
}

/**
 * [SRP] Rule: 전역 에러 상태 관리만을 담당하는 Provider
 * 애플리케이션 전체에서 일관된 에러 처리 제공
 */
export function ErrorProvider({ 
  children, 
  maxErrors = 5,
  autoRemoveDelay = 5000 
}: ErrorProviderProps) {
  const [errors, setErrors] = useState<Array<ApiError & { id: string }>>([])
  const [componentErrors, setComponentErrors] = useState<Map<string, ApiError & { id: string }>>(new Map())
  const [showGlobalErrors, setShowGlobalErrors] = useState(true)

  /**
   * [SRP] Rule: 에러 ID 생성만 담당
   */
  const generateErrorId = useCallback(() => {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }, [])

  /**
   * [SRP] Rule: 전역 에러 추가만 담당
   */
  const addError = useCallback((error: ApiError | string) => {
    const normalizedError: ApiError = typeof error === 'string' 
      ? { message: error, retryable: false }
      : error

    const errorWithId = {
      ...normalizedError,
      id: generateErrorId(),
      timestamp: new Date().toISOString()
    }

    setErrors(prev => {
      // 최대 에러 개수 제한
      const newErrors = [errorWithId, ...prev].slice(0, maxErrors)
      return newErrors
    })

    // 자동 제거 타이머 설정
    const delay = normalizedError.status && normalizedError.status >= 500 
      ? autoRemoveDelay * 2  // 서버 에러는 더 오래 표시
      : autoRemoveDelay

    setTimeout(() => {
      removeError(errorWithId.id)
    }, delay)

    // 프로덕션에서는 에러 로깅 서비스로 전송
    if (process.env.NODE_ENV === 'production') {
      logErrorToService(normalizedError)
    }
  }, [generateErrorId, maxErrors, autoRemoveDelay])

  /**
   * [SRP] Rule: 에러 제거만 담당
   */
  const removeError = useCallback((id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id))
  }, [])

  /**
   * [SRP] Rule: 모든 에러 클리어만 담당
   */
  const clearErrors = useCallback(() => {
    setErrors([])
    setComponentErrors(new Map())
  }, [])

  /**
   * [SRP] Rule: 특정 컴포넌트의 에러 설정만 담당
   */
  const setComponentError = useCallback((componentId: string, error: ApiError | string | null) => {
    setComponentErrors(prev => {
      const newMap = new Map(prev)
      
      if (error === null) {
        newMap.delete(componentId)
      } else {
        const normalizedError: ApiError = typeof error === 'string' 
          ? { message: error, retryable: true }
          : error

        const errorWithId = {
          ...normalizedError,
          id: generateErrorId(),
          timestamp: new Date().toISOString()
        }

        newMap.set(componentId, errorWithId)
      }
      
      return newMap
    })
  }, [generateErrorId])

  /**
   * [SRP] Rule: 특정 컴포넌트의 에러 조회만 담당
   */
  const getComponentError = useCallback((componentId: string) => {
    return componentErrors.get(componentId) || null
  }, [componentErrors])

  /**
   * [SRP] Rule: 에러 로깅 서비스로 전송만 담당
   */
  const logErrorToService = useCallback((error: ApiError) => {
    try {
      // 실제 프로덕션에서는 외부 로깅 서비스 사용
      const logData = {
        ...error,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        userId: 'anonymous', // 실제로는 인증된 사용자 ID
        sessionId: sessionStorage.getItem('sessionId') || 'unknown'
      }

      // 예시: 로깅 API로 전송
      fetch('/api/error-logging', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(logData)
      }).catch(err => {
        console.error('[ErrorProvider] 에러 로깅 실패:', err)
      })
    } catch (logError) {
      console.error('[ErrorProvider] 에러 로깅 중 오류:', logError)
    }
  }, [])

  const value: ErrorContextType = {
    errors,
    addError,
    removeError,
    clearErrors,
    setComponentError,
    getComponentError,
    showGlobalErrors,
    setShowGlobalErrors
  }

  return (
    <ErrorContext.Provider value={value}>
      {children}
      {/* 전역 에러 토스트 표시 */}
      {showGlobalErrors && (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
          {errors.slice(0, 3).map(error => (
            <ApiErrorHandler
              key={error.id}
              error={error}
              onDismiss={() => removeError(error.id)}
              className="animate-slide-in-from-right shadow-lg"
              showDetails={process.env.NODE_ENV === 'development'}
            />
          ))}
          {errors.length > 3 && (
            <div className="text-center">
              <button 
                onClick={clearErrors}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                +{errors.length - 3}개 더 있음 (모두 지우기)
              </button>
            </div>
          )}
        </div>
      )}
    </ErrorContext.Provider>
  )
}

/**
 * [SRP] Rule: 에러 컨텍스트 사용 Hook
 * 컴포넌트에서 에러 상태를 쉽게 관리할 수 있도록 지원
 */
export function useError() {
  const context = useContext(ErrorContext)
  if (context === undefined) {
    throw new Error('useError는 ErrorProvider 내에서 사용되어야 합니다')
  }
  return context
}

/**
 * [SRP] Rule: 특정 컴포넌트의 에러 상태 관리 Hook
 * 컴포넌트별로 독립적인 에러 상태 관리 제공
 */
export function useComponentError(componentId: string) {
  const { setComponentError, getComponentError } = useError()
  
  const setError = useCallback((error: ApiError | string | null) => {
    setComponentError(componentId, error)
  }, [componentId, setComponentError])

  const error = getComponentError(componentId)

  const clearError = useCallback(() => {
    setComponentError(componentId, null)
  }, [componentId, setComponentError])

  return {
    error,
    setError,
    clearError,
    hasError: error !== null
  }
}

/**
 * [OCP] Rule: API 호출 래퍼 - 기존 API 함수를 수정하지 않고 에러 처리 추가
 */
export function withErrorHandling<T extends any[], R>(
  apiFunction: (...args: T) => Promise<R>,
  componentId?: string
) {
  return async (...args: T): Promise<R> => {
    const { addError, setComponentError } = useError()
    
    try {
      const result = await apiFunction(...args)
      
      // 성공 시 컴포넌트 에러 클리어
      if (componentId) {
        setComponentError(componentId, null)
      }
      
      return result
    } catch (error) {
      const apiError: ApiError = {
        message: error instanceof Error ? error.message : '알 수 없는 에러',
        timestamp: new Date().toISOString(),
        retryable: true
      }

      // 컴포넌트별 에러 설정
      if (componentId) {
        setComponentError(componentId, apiError)
      } else {
        // 전역 에러로 추가
        addError(apiError)
      }

      throw error
    }
  }
}