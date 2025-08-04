'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface NavigationProps {
  currentPage: string
  onPageChange: (page: string) => void
}

export function Navigation({ currentPage, onPageChange }: NavigationProps) {
  const { profile } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navigationItems = [
    { id: 'dashboard', name: '대시보드', icon: '📊' },
    { id: 'equipment', name: '설비 관리', icon: '⚙️' },
    { id: 'breakdown', name: '고장 보고', icon: '🚨' },
    { id: 'repair', name: '수리 내역', icon: '🔧' },
    { id: 'statistics', name: '통계', icon: '📈' },
  ]

  const adminItems = [
    { id: 'users', name: '사용자 관리', icon: '👥' },
    { id: 'settings', name: '시스템 설정', icon: '⚙️' },
  ]

  // 오프라인 모드에서는 모든 메뉴 표시
  const isOfflineMode = process.env.NEXT_PUBLIC_OFFLINE_MODE === 'true'
  const allItems = (isOfflineMode || profile?.role === 'system_admin' || profile?.role === 'manager')
    ? [...navigationItems, ...adminItems] 
    : navigationItems

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">CNC 관리</h2>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {allItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onPageChange(item.id)}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                    currentPage === item.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="sm:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <span className="sr-only">메뉴 열기</span>
              {isMobileMenuOpen ? (
                <span className="text-xl">✕</span>
              ) : (
                <span className="text-xl">☰</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {allItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onPageChange(item.id)
                  setIsMobileMenuOpen(false)
                }}
                className={`block w-full text-left pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors ${
                  currentPage === item.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}