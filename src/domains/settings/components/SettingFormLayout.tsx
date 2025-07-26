'use client';

import React from 'react';
import { Navigation } from '@/components/navigation';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { ArrowLeft, Save, X } from 'lucide-react';
import Link from 'next/link';

export interface SettingFormLayoutProps {
  title: string;
  description: string;
  backHref: string;
  isEditing?: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel?: () => void;
  loading?: boolean;
  children: React.ReactNode;
  submitButtonText?: string;
  showCancelButton?: boolean;
}

/**
 * 설정 폼 페이지의 공통 레이아웃 컴포넌트
 * 생성/수정 폼을 위한 일관된 UI 패턴을 제공
 */
export function SettingFormLayout({
  title,
  description,
  backHref,
  isEditing = false,
  onSubmit,
  onCancel,
  loading = false,
  children,
  submitButtonText,
  showCancelButton = true
}: SettingFormLayoutProps) {
  const defaultSubmitText = isEditing ? '수정 완료' : '생성 완료';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 네비게이션 */}
      <Navigation />
      
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-3">
            <Link href={backHref}>
              <Button variant="ghost" size="sm" className="p-2">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{description}</p>
            </div>
          </div>
        </div>

        {/* 폼 카드 */}
        <Card>
          <CardHeader>
            <CardTitle>
              {isEditing ? '정보 수정' : '새 항목 생성'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-6">
              {/* 폼 필드들 */}
              {children}

              {/* 액션 버튼 */}
              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                {showCancelButton && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={onCancel || (() => window.history.back())}
                    disabled={loading}
                    fullWidth={true}
                    className="sm:w-auto sm:fullWidth-0"
                  >
                    <X className="h-4 w-4 mr-2" />
                    취소
                  </Button>
                )}
                
                <Button
                  type="submit"
                  variant="primary"
                  loading={loading}
                  fullWidth={true}
                  className="sm:w-auto sm:fullWidth-0"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {submitButtonText || defaultSubmitText}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* 안내 메시지 */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p className="font-medium mb-1">입력 시 참고사항</p>
            <ul className="space-y-1 text-xs">
              <li>• 모든 필수 항목을 입력해주세요</li>
              <li>• 코드는 중복될 수 없으며, 시스템에서 고유하게 사용됩니다</li>
              <li>• 표시 순서는 목록에서의 정렬 순서를 결정합니다</li>
              {isEditing && (
                <li>• 이미 사용 중인 항목의 코드 변경은 신중히 진행해주세요</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}