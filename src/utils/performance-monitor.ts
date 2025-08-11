/**
 * 성능 모니터링 및 메트릭 수집 유틸리티
 * [SRP] Rule: 성능 측정만 담당하는 단일 책임
 */

interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  metadata?: Record<string, any>
}

interface ComponentRenderMetric {
  componentName: string
  renderTime: number
  propsCount: number
  rerenderReason?: string
}

interface APICallMetric {
  endpoint: string
  method: string
  duration: number
  status: number
  cacheHit?: boolean
  dataSize?: number
}

// [OCP] Rule: 메트릭 타입 확장 가능하도록 설계
export class PerformanceMonitor {
  private static metrics: Map<string, PerformanceMetric[]> = new Map()
  private static observers: PerformanceObserver[] = []
  private static isEnabled = process.env.NODE_ENV === 'development'

  // 성능 측정 시작
  static startMeasurement(name: string): string {
    if (!this.isEnabled) return name
    
    const measurementId = `${name}-${Date.now()}-${Math.random()}`
    performance.mark(`${measurementId}-start`)
    return measurementId
  }

  // 성능 측정 종료 및 기록
  static endMeasurement(measurementId: string, metadata?: Record<string, any>): number {
    if (!this.isEnabled) return 0

    const endMark = `${measurementId}-end`
    const measurementName = `measurement-${measurementId}`
    
    performance.mark(endMark)
    performance.measure(measurementName, `${measurementId}-start`, endMark)
    
    const measure = performance.getEntriesByName(measurementName)[0]
    const duration = measure?.duration || 0

    this.addMetric(measurementId.split('-')[0], duration, metadata)
    
    // 메모리 정리
    performance.clearMarks(`${measurementId}-start`)
    performance.clearMarks(endMark)
    performance.clearMeasures(measurementName)

    return duration
  }

  // 메트릭 추가
  private static addMetric(name: string, value: number, metadata?: Record<string, any>) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }

    const metrics = this.metrics.get(name)!
    metrics.push({
      name,
      value,
      timestamp: Date.now(),
      metadata
    })

    // 최대 100개까지만 보관 (메모리 관리)
    if (metrics.length > 100) {
      metrics.shift()
    }
  }

  // React 컴포넌트 렌더 성능 측정
  static measureComponentRender<T extends Record<string, any>>(
    componentName: string,
    renderFn: () => T,
    props?: any
  ): T {
    if (!this.isEnabled) return renderFn()

    const measurementId = this.startMeasurement(`component-${componentName}`)
    const startTime = performance.now()
    
    try {
      const result = renderFn()
      const renderTime = performance.now() - startTime
      
      const metric: ComponentRenderMetric = {
        componentName,
        renderTime,
        propsCount: props ? Object.keys(props).length : 0
      }

      this.endMeasurement(measurementId, { type: 'component-render', ...metric })
      
      return result
    } catch (error) {
      this.endMeasurement(measurementId, { 
        type: 'component-render', 
        componentName, 
        error: error.message 
      })
      throw error
    }
  }

  // API 호출 성능 측정
  static async measureApiCall<T>(
    endpoint: string,
    apiCall: () => Promise<T>,
    method = 'GET'
  ): Promise<T> {
    if (!this.isEnabled) return apiCall()

    const measurementId = this.startMeasurement(`api-${endpoint}`)
    const startTime = performance.now()
    
    try {
      const result = await apiCall()
      const duration = performance.now() - startTime
      
      // 응답 크기 추정
      let dataSize = 0
      try {
        dataSize = JSON.stringify(result).length
      } catch {
        // 직렬화 불가능한 객체는 크기 측정 생략
      }

      const metric: APICallMetric = {
        endpoint,
        method,
        duration,
        status: 200,
        dataSize
      }

      this.endMeasurement(measurementId, { type: 'api-call', ...metric })
      
      return result
    } catch (error) {
      const duration = performance.now() - startTime
      
      this.endMeasurement(measurementId, {
        type: 'api-call',
        endpoint,
        method,
        duration,
        status: error.status || 500,
        error: error.message
      })
      
      throw error
    }
  }

  // 메모리 사용량 측정
  static measureMemoryUsage(): Record<string, number> {
    if (!this.isEnabled || !performance.memory) {
      return {}
    }

    const memory = {
      usedJSHeapSize: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024), // MB
      totalJSHeapSize: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024), // MB
      jsHeapSizeLimit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024) // MB
    }

    this.addMetric('memory-usage', memory.usedJSHeapSize, {
      type: 'memory',
      ...memory
    })

    return memory
  }

  // Core Web Vitals 측정
  static initWebVitalsObserver() {
    if (!this.isEnabled || typeof PerformanceObserver === 'undefined') return

    // Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.addMetric('lcp', entry.startTime, {
          type: 'web-vital',
          metric: 'lcp',
          element: entry.element?.tagName
        })
      }
    })

    // First Input Delay (FID)
    const fidObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.addMetric('fid', entry.processingStart - entry.startTime, {
          type: 'web-vital',
          metric: 'fid',
          eventType: entry.name
        })
      }
    })

    // Cumulative Layout Shift (CLS)
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          this.addMetric('cls', entry.value, {
            type: 'web-vital',
            metric: 'cls'
          })
        }
      }
    })

    try {
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      fidObserver.observe({ entryTypes: ['first-input'] })
      clsObserver.observe({ entryTypes: ['layout-shift'] })
      
      this.observers.push(lcpObserver, fidObserver, clsObserver)
    } catch (error) {
      console.warn('Performance observers not supported:', error)
    }
  }

  // 성능 리포트 생성
  static generateReport(): Record<string, any> {
    if (!this.isEnabled) return {}

    const report: Record<string, any> = {
      timestamp: new Date().toISOString(),
      memory: this.measureMemoryUsage(),
      metrics: {}
    }

    // 메트릭별 통계 생성
    for (const [name, metrics] of this.metrics.entries()) {
      if (metrics.length === 0) continue

      const values = metrics.map(m => m.value)
      const sum = values.reduce((a, b) => a + b, 0)
      const avg = sum / values.length
      const min = Math.min(...values)
      const max = Math.max(...values)
      
      // 95 퍼센타일 계산
      const sorted = values.sort((a, b) => a - b)
      const p95Index = Math.floor(sorted.length * 0.95)
      const p95 = sorted[p95Index]

      report.metrics[name] = {
        count: metrics.length,
        average: Math.round(avg * 100) / 100,
        min: Math.round(min * 100) / 100,
        max: Math.round(max * 100) / 100,
        p95: Math.round(p95 * 100) / 100,
        recent: metrics.slice(-5).map(m => ({
          value: Math.round(m.value * 100) / 100,
          timestamp: new Date(m.timestamp).toLocaleTimeString()
        }))
      }
    }

    return report
  }

  // 성능 경고 체크
  static checkPerformanceWarnings(): string[] {
    const warnings: string[] = []
    const report = this.generateReport()

    // API 호출 시간 체크
    for (const [name, metric] of Object.entries(report.metrics)) {
      if (name.startsWith('api-') && metric.average > 1000) {
        warnings.push(`API ${name}: 평균 응답시간이 ${metric.average}ms로 너무 깁니다`)
      }
    }

    // 컴포넌트 렌더 시간 체크
    for (const [name, metric] of Object.entries(report.metrics)) {
      if (name.startsWith('component-') && metric.average > 16) {
        warnings.push(`컴포넌트 ${name}: 평균 렌더시간이 ${metric.average}ms로 60fps를 초과합니다`)
      }
    }

    // 메모리 사용량 체크
    if (report.memory.usedJSHeapSize > 100) {
      warnings.push(`메모리 사용량이 ${report.memory.usedJSHeapSize}MB로 높습니다`)
    }

    return warnings
  }

  // 콘솔에 성능 리포트 출력
  static logPerformanceReport() {
    if (!this.isEnabled) return

    const report = this.generateReport()
    const warnings = this.checkPerformanceWarnings()

    console.group('🚀 Performance Report')
    console.table(report.metrics)
    
    if (report.memory) {
      console.log('💾 Memory Usage:', report.memory)
    }

    if (warnings.length > 0) {
      console.group('⚠️ Performance Warnings')
      warnings.forEach(warning => console.warn(warning))
      console.groupEnd()
    }
    
    console.groupEnd()
  }

  // 정리
  static cleanup() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
    this.metrics.clear()
  }
}

// [DIP] Rule: 고수준 API 제공
export const performanceDecorator = (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
  const method = descriptor.value

  descriptor.value = function (...args: any[]) {
    return PerformanceMonitor.measureComponentRender(
      `${target.constructor.name}.${propertyName}`,
      () => method.apply(this, args),
      args[0]
    )
  }
}

// Hook 형태로 성능 측정 제공
export function usePerformanceMonitor(componentName: string) {
  const measureRender = (renderFn: () => any, props?: any) => {
    return PerformanceMonitor.measureComponentRender(componentName, renderFn, props)
  }

  const measureAsync = async (name: string, asyncFn: () => Promise<any>) => {
    return PerformanceMonitor.measureApiCall(name, asyncFn)
  }

  return {
    measureRender,
    measureAsync,
    getReport: PerformanceMonitor.generateReport,
    getWarnings: PerformanceMonitor.checkPerformanceWarnings
  }
}

// 자동으로 성능 모니터링 초기화
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  PerformanceMonitor.initWebVitalsObserver()
  
  // 5분마다 성능 리포트 출력
  setInterval(() => {
    PerformanceMonitor.logPerformanceReport()
  }, 5 * 60 * 1000)

  // 페이지 언로드 시 최종 리포트
  window.addEventListener('beforeunload', () => {
    PerformanceMonitor.logPerformanceReport()
    PerformanceMonitor.cleanup()
  })
}