'use client'

import React, { useState, useCallback } from 'react'
import { Card, Button } from '@/components/ui'

/**
 * API 에러 타입 정의
 */
export interface ApiError {
  message: string
  status?: number
  code?: string
  timestamp?: string
  requestId?: string
  retryable?: boolean
}

interface ApiErrorHandlerProps {
  error: ApiError | string | null
  onRetry?: () => void | Promise<void>
  onDismiss?: () => void
  className?: string
  showDetails?: boolean
  retryable?: boolean
}

/**
 * [SRP] Rule: API 에러 표시 및 재시도 기능만 담당하는 컴포넌트
 * 프로덕션 환경에서 사용자 친화적인 에러 메시지 제공
 */
export function ApiErrorHandler({
  error,
  onRetry,
  onDismiss,
  className = '',
  showDetails = false,
  retryable = true
}: ApiErrorHandlerProps) {
  const [isRetrying, setIsRetrying] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  // 에러가 없으면 렌더링하지 않음
  if (!error) return null

  // 에러 객체 정규화
  const normalizedError: ApiError = typeof error === 'string' 
    ? { message: error, retryable: true }
    : { retryable: true, ...error }

  /**
   * [SRP] Rule: 재시도 로직만 담당
   */
  const handleRetry = useCallback(async () => {
    if (!onRetry || isRetrying) return

    setIsRetrying(true)
    setRetryCount(prev => prev + 1)

    try {
      await onRetry()
      // 성공하면 에러를 자동으로 해제
      if (onDismiss) {
        onDismiss()
      }
    } catch (retryError) {
      console.error('[ApiErrorHandler] 재시도 실패:', retryError)
    } finally {
      setIsRetrying(false)
    }
  }, [onRetry, onDismiss, isRetrying])

  /**
   * [SRP] Rule: 에러 상태에 따른 UI 색상 결정만 담당
   */
  const getErrorSeverity = (error: ApiError): 'error' | 'warning' | 'info' => {
    if (error.status && error.status >= 500) return 'error'
    if (error.status && error.status >= 400) return 'warning'
    return 'info'
  }

  /**
   * [SRP] Rule: 사용자 친화적인 에러 메시지 생성만 담당
   */
  const getUserFriendlyMessage = (error: ApiError): string => {
    if (error.status) {
      switch (error.status) {
        case 401:
          return '로그인이 필요합니다. 다시 로그인해주세요.'
        case 403:
          return '접근 권한이 없습니다. 관리자에게 문의하세요.'
        case 404:
          return '요청한 데이터를 찾을 수 없습니다.'
        case 408:
        case 504:
          return '요청 시간이 초과되었습니다. 네트워크 연결을 확인해주세요.'
        case 429:
          return '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.'
        case 500:
        case 502:
        case 503:
          return '서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.'
        default:
          break
      }
    }

    // 에러 코드별 메시지
    if (error.code) {
      switch (error.code) {
        case 'NETWORK_ERROR':
          return '네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요.'
        case 'TIMEOUT_ERROR':
          return '요청 시간이 초과되었습니다. 다시 시도해주세요.'
        case 'PARSE_ERROR':
          return '서버 응답을 처리하는 중 오류가 발생했습니다.'
        default:
          break
      }
    }

    // 기본 메시지 또는 서버에서 온 메시지
    return error.message || '알 수 없는 오류가 발생했습니다.'
  }

  const severity = getErrorSeverity(normalizedError)
  const userMessage = getUserFriendlyMessage(normalizedError)
  const canRetry = retryable && (normalizedError.retryable !== false) && retryCount < 3

  const severityStyles = {
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
    warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
  }

  const iconMap = {
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  }

  return (
    <div className={`rounded-lg border p-4 ${severityStyles[severity]} ${className}`}>
      <div className="flex items-start space-x-3">
        <div className="text-xl">{iconMap[severity]}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">
              {severity === 'error' ? '오류 발생' : 
               severity === 'warning' ? '주의' : '알림'}
            </h3>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                aria-label="닫기"
              >
                ✕
              </button>
            )}
          </div>
          <p className="mt-1 text-sm">{userMessage}</p>
          
          {showDetails && process.env.NODE_ENV === 'development' && (
            <details className="mt-3">
              <summary className="text-xs cursor-pointer hover:underline">
                개발자 정보 (개발 모드)
              </summary>
              <div className="mt-2 text-xs font-mono bg-black/5 dark:bg-white/5 rounded p-2">
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(normalizedError, null, 2)}
                </pre>
              </div>
            </details>
          )}

          {canRetry && (
            <div className="mt-3 flex items-center space-x-3">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleRetry}
                disabled={isRetrying}
                className="text-xs"
              >
                {isRetrying ? '재시도 중...' : '다시 시도'}
              </Button>
              {retryCount > 0 && (
                <span className="text-xs opacity-70">
                  재시도: {retryCount}/3
                </span>
              )}
            </div>
          )}

          {retryCount >= 3 && (
            <p className="mt-2 text-xs opacity-70">
              여러 번 시도했지만 실패했습니다. 페이지를 새로고침하거나 관리자에게 문의하세요.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * 전역 API 에러 토스트를 위한 Hook
 */
export function useApiErrorHandler() {
  const [errors, setErrors] = useState<Array<ApiError & { id: string }>>([])

  const addError = useCallback((error: ApiError | string) => {
    const normalizedError = typeof error === 'string' 
      ? { message: error, retryable: false }
      : error

    const errorWithId = {
      ...normalizedError,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    }

    setErrors(prev => [...prev, errorWithId])

    // 5초 후 자동 제거 (에러 타입에 따라 시간 조정)
    const autoRemoveDelay = normalizedError.status && normalizedError.status >= 500 ? 10000 : 5000
    setTimeout(() => {
      removeError(errorWithId.id)
    }, autoRemoveDelay)
  }, [])

  const removeError = useCallback((id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id))
  }, [])

  const clearErrors = useCallback(() => {
    setErrors([])
  }, [])

  return {
    errors,
    addError,
    removeError,
    clearErrors
  }
}