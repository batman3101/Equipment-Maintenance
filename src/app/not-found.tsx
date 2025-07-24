'use client';

import Link from 'next/link';
import { Suspense } from 'react';

function NotFoundContent() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4 text-center">
      <div className="rounded-lg bg-white p-8 shadow-lg">
        <h1 className="mb-4 text-3xl font-bold text-gray-800">404 - 페이지를 찾을 수 없습니다</h1>
        <p className="mb-6 text-gray-600">
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
        </p>
        <Link
          href="/"
          className="rounded-md bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}

export default function NotFound() {
  return (
    <Suspense fallback={<div className="p-4 text-center">로딩 중...</div>}>
      <NotFoundContent />
    </Suspense>
  );
}