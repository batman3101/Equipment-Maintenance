'use client'

import { useState, useCallback, useRef } from 'react'
import { useError } from '@/contexts/ErrorContext'

/**
 * 비동기 작업 상태 타입
 */
export interface AsyncOperationState<T> {
  data: T | null
  loading: boolean
  error: string | null
  lastUpdated: number | null
  retryCount: number
  canRetry: boolean
}

/**
 * 비동기 작업 옵션
 */
export interface AsyncOperationOptions {
  maxRetries?: number
  retryDelay?: number
  timeout?: number
  enableAutoRetry?: boolean
  retryCondition?: (error: any) => boolean
  onSuccess?: (data: any) => void
  onError?: (error: any) => void
  componentId?: string
}

/**
 * [SRP] Rule: 비동기 작업 상태 관리만을 담당하는 Hook
 * 로딩, 에러, 재시도 메커니즘을 통합 관리
 */
export function useAsyncOperation<T>(
  asyncFunction: () => Promise<T>,
  options: AsyncOperationOptions = {}
) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    timeout = 30000,
    enableAutoRetry = true,
    retryCondition = () => true,
    onSuccess,
    onError,
    componentId
  } = options

  const { addError, setComponentError } = useError()
  const abortController = useRef<AbortController | null>(null)
  const retryTimeout = useRef<NodeJS.Timeout | null>(null)

  // 비동기 작업 상태
  const [state, setState] = useState<AsyncOperationState<T>>({
    data: null,
    loading: false,
    error: null,
    lastUpdated: null,
    retryCount: 0,
    canRetry: true
  })

  /**
   * [SRP] Rule: 작업 중단만 담당
   */
  const cancel = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort()
    }
    if (retryTimeout.current) {
      clearTimeout(retryTimeout.current)
    }
    setState(prev => ({ ...prev, loading: false }))
  }, [])

  /**
   * [SRP] Rule: 재시도 로직만 담당
   */
  const scheduleRetry = useCallback((currentRetryCount: number, lastError: any) => {
    if (currentRetryCount >= maxRetries || !enableAutoRetry || !retryCondition(lastError)) {
      setState(prev => ({
        ...prev,
        canRetry: false,
        loading: false,
        error: lastError.message || '작업이 실패했습니다.'
      }))
      return
    }

    const delay = Math.min(retryDelay * Math.pow(2, currentRetryCount), 30000) // 지수 백오프, 최대 30초
    
    setState(prev => ({
      ...prev,
      loading: false,
      error: `재시도 중... (${currentRetryCount + 1}/${maxRetries})`
    }))

    retryTimeout.current = setTimeout(() => {
      execute()
    }, delay)
  }, [maxRetries, enableAutoRetry, retryCondition, retryDelay])

  /**
   * [SRP] Rule: 비동기 작업 실행만 담당
   */
  const execute = useCallback(async () => {
    // 이미 실행 중인 경우 중단
    if (state.loading) {
      cancel()
    }

    // 새로운 AbortController 생성
    abortController.current = new AbortController()

    setState(prev => ({
      ...prev,
      loading: true,
      error: null
    }))

    try {
      const startTime = Date.now()
      
      // 타임아웃 설정
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('요청 시간이 초과되었습니다'))
        }, timeout)
      })

      // 실제 비동기 작업 실행
      const result = await Promise.race([
        asyncFunction(),
        timeoutPromise
      ])

      const executionTime = Date.now() - startTime

      // 성공 처리
      setState(prev => ({
        ...prev,
        data: result,
        loading: false,
        error: null,
        lastUpdated: Date.now(),
        retryCount: 0,
        canRetry: true
      }))

      // 컴포넌트별 에러 클리어
      if (componentId) {
        setComponentError(componentId, null)
      }

      // 성공 콜백 실행
      if (onSuccess) {
        onSuccess(result)
      }

      console.log(`[AsyncOperation] 작업 성공 (${executionTime}ms):`, { 
        hasData: !!result,
        componentId 
      })

      return result

    } catch (error) {
      console.error('[AsyncOperation] 작업 실패:', error)

      // 중단된 요청인 경우 무시
      if (abortController.current?.signal.aborted) {
        return
      }

      const currentRetryCount = state.retryCount
      const newRetryCount = currentRetryCount + 1
      
      setState(prev => ({
        ...prev,
        retryCount: newRetryCount
      }))

      // 에러 콜백 실행
      if (onError) {
        onError(error)
      }

      // 재시도 가능한 에러인지 확인
      const isRetryable = retryCondition(error) && newRetryCount < maxRetries

      if (isRetryable && enableAutoRetry) {
        // 자동 재시도 스케줄링
        scheduleRetry(newRetryCount, error)
      } else {
        // 최종 실패 처리
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
        
        setState(prev => ({
          ...prev,
          loading: false,
          error: errorMessage,
          canRetry: isRetryable && !enableAutoRetry // 수동 재시도만 가능
        }))

        // 에러 전역 상태 업데이트
        if (componentId) {
          setComponentError(componentId, {
            message: errorMessage,
            retryable: isRetryable
          })
        } else {
          addError({
            message: errorMessage,
            retryable: isRetryable
          })
        }
      }

      throw error
    }
  }, [
    state.loading, 
    state.retryCount, 
    asyncFunction, 
    timeout, 
    onSuccess, 
    onError, 
    componentId, 
    setComponentError, 
    addError, 
    cancel, 
    scheduleRetry, 
    retryCondition, 
    maxRetries, 
    enableAutoRetry
  ])

  /**
   * [SRP] Rule: 수동 재시도만 담당
   */
  const retry = useCallback(async () => {
    if (!state.canRetry || state.loading) return

    setState(prev => ({
      ...prev,
      retryCount: 0, // 수동 재시도 시 카운터 리셋
      canRetry: true
    }))

    return execute()
  }, [state.canRetry, state.loading, execute])

  /**
   * [SRP] Rule: 상태 리셋만 담당
   */
  const reset = useCallback(() => {
    cancel()
    setState({
      data: null,
      loading: false,
      error: null,
      lastUpdated: null,
      retryCount: 0,
      canRetry: true
    })

    if (componentId) {
      setComponentError(componentId, null)
    }
  }, [cancel, componentId, setComponentError])

  return {
    ...state,
    execute,
    retry,
    reset,
    cancel,
    // 편의 메서드들
    isIdle: !state.loading && !state.data && !state.error,
    isSuccess: !state.loading && !!state.data && !state.error,
    isError: !state.loading && !!state.error,
    isRetrying: state.loading && state.retryCount > 0,
  }
}

/**
 * [OCP] Rule: 특정 API 호출을 위한 전용 Hook 팩토리
 */
export function createAsyncOperationHook<T>(
  asyncFunction: () => Promise<T>,
  defaultOptions: AsyncOperationOptions = {}
) {
  return function useCustomAsyncOperation(options: AsyncOperationOptions = {}) {
    return useAsyncOperation(asyncFunction, { ...defaultOptions, ...options })
  }
}

/**
 * 여러 비동기 작업을 병렬로 실행하는 Hook
 */
export function useParallelAsyncOperations<T>(
  operations: Array<() => Promise<T>>,
  options: AsyncOperationOptions = {}
) {
  const parallelOperation = useCallback(async () => {
    console.log(`[ParallelAsyncOperations] ${operations.length}개 작업 병렬 실행 시작`)
    const results = await Promise.all(operations.map(op => op()))
    console.log(`[ParallelAsyncOperations] 모든 작업 완료`)
    return results
  }, [operations])

  return useAsyncOperation(parallelOperation, {
    ...options,
    maxRetries: options.maxRetries || 2, // 병렬 작업은 재시도 횟수 줄임
    enableAutoRetry: options.enableAutoRetry ?? false // 기본적으로 자동 재시도 비활성화
  })
}