'use client';

import { APP_NAME } from '@/lib/constants';
import { ProtectedRoute } from '@/domains/auth/components/protected-route';
import { UserProfile } from '@/domains/auth/components/user-profile';

export default function Home() {
  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <UserProfile />
        </div>
        
        <div className="flex min-h-screen flex-col items-center justify-center">
          <div className="text-center">
            <h1 className="text-foreground mb-4 text-4xl font-bold">
              {APP_NAME}
            </h1>
            <p className="text-muted-foreground mb-8 text-lg">
              현장 설비 고장을 실시간으로 관리하는 모바일 웹앱
            </p>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="card p-6">
                <h3 className="mb-2 text-xl font-semibold">고장 등록</h3>
                <p className="text-muted-foreground">
                  설비 고장 발생 시 즉시 등록하고 관리
                </p>
              </div>

              <div className="card p-6">
                <h3 className="mb-2 text-xl font-semibold">수리 기록</h3>
                <p className="text-muted-foreground">
                  수리 내역과 사용 부품을 상세히 기록
                </p>
              </div>

              <div className="card p-6">
                <h3 className="mb-2 text-xl font-semibold">실시간 모니터링</h3>
                <p className="text-muted-foreground">
                  현재 설비 상태를 실시간으로 확인
                </p>
              </div>
            </div>

            <div className="mt-8">
              <div className="bg-primary text-primary-foreground inline-flex items-center rounded-lg px-4 py-2">
                <span className="mr-2">✅</span>
                인증 시스템 구현 완료
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
