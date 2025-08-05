'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button, Input, Card, ThemeToggle } from '@/components/ui'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await signIn(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      {/* 테마 토글 버튼 - 우상단 고정 */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            CNC 설비 관리 시스템
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            계정에 로그인하세요
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
                폐쇄형 시스템
              </h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                <p>관리자가 생성한 계정으로만 로그인 가능합니다.</p>
                <p className="text-xs mt-1 text-blue-600 dark:text-blue-400">
                  계정이 없으시면 관리자에게 문의하세요.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <Card>
          <Card.Content>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              
              <Input
                label="이메일"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일을 입력하세요"
                required
              />
              
              <Input
                label="비밀번호"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                required
              />
              
              <Button
                type="submit"
                loading={loading}
                className="w-full"
              >
                {loading ? '로그인 중...' : '로그인'}
              </Button>
            </form>
          </Card.Content>
        </Card>
        
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            베트남 CNC 설비 관리 시스템 v1.0
          </p>
        </div>
      </div>
    </div>
  )
}