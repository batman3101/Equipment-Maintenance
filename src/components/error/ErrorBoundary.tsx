'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Card, Button } from '@/components/ui'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * [SRP] Rule: 애플리케이션 에러 경계만을 담당하는 컴포넌트
 * 프로덕션 환경에서 JavaScript 에러가 전체 앱을 중단시키는 것을 방지
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): State {
    // 에러가 발생하면 fallback UI를 렌더링하도록 상태를 업데이트
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 에러 정보 저장
    this.setState({
      error,
      errorInfo
    })

    // 에러 로깅 (프로덕션에서는 외부 서비스로 전송)
    console.error('[ErrorBoundary] 치명적인 에러 발생:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    })

    // 사용자 정의 에러 핸들러 호출
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // 프로덕션 환경에서는 에러 추적 서비스로 전송
    if (process.env.NODE_ENV === 'production') {
      this.reportErrorToService(error, errorInfo)
    }
  }

  /**
   * [SRP] Rule: 에러 추적 서비스로 에러 정보 전송만 담당
   */
  private reportErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    try {
      // 실제 프로덕션에서는 Sentry, LogRocket 등의 서비스 사용
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        userId: 'anonymous', // 실제로는 인증된 사용자 ID
        sessionId: Date.now().toString() // 실제로는 세션 ID
      }

      // 예시: 에러 추적 API로 전송
      fetch('/api/error-tracking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorData)
      }).catch(err => {
        console.error('[ErrorBoundary] 에러 리포팅 실패:', err)
      })
    } catch (reportError) {
      console.error('[ErrorBoundary] 에러 리포팅 중 오류:', reportError)
    }
  }

  /**
   * [SRP] Rule: 에러 복구 시도만 담당
   */
  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  /**
   * [SRP] Rule: 페이지 새로고침만 담당
   */
  private handleRefresh = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      // 사용자 정의 fallback UI가 제공된 경우 사용
      if (this.props.fallback) {
        return this.props.fallback
      }

      // 기본 에러 UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <Card className="w-full max-w-md mx-4">
            <Card.Header>
              <div className="flex items-center space-x-3">
                <div className="text-red-500 text-2xl">⚠️</div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    시스템 오류가 발생했습니다
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
                  </p>
                </div>
              </div>
            </Card.Header>
            <Card.Content className="space-y-4">
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                    개발 모드 - 에러 정보:
                  </h3>
                  <pre className="text-xs text-red-700 dark:text-red-300 overflow-auto max-h-32">
                    {this.state.error.message}
                  </pre>
                </div>
              )}
              
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <p>다음 방법을 시도해보세요:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>페이지를 새로고침하세요</li>
                  <li>잠시 후 다시 시도하세요</li>
                  <li>브라우저 캐시를 지워보세요</li>
                </ul>
              </div>
            </Card.Content>
            <Card.Footer className="flex space-x-3">
              <Button 
                onClick={this.handleRetry}
                variant="secondary"
                className="flex-1"
              >
                다시 시도
              </Button>
              <Button 
                onClick={this.handleRefresh}
                variant="primary"
                className="flex-1"
              >
                페이지 새로고침
              </Button>
            </Card.Footer>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * HOC로 컴포넌트를 ErrorBoundary로 감싸는 유틸리티 함수
 * [OCP] Rule: 기존 컴포넌트를 수정하지 않고 에러 처리 기능 추가
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorFallback?: ReactNode
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={errorFallback}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}