'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 에러 로깅 (Sentry 제거)
    console.error('페이지 오류 발생:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4 text-center">
      <div className="rounded-lg bg-white p-8 shadow-lg">
        <h1 className="mb-4 text-3xl font-bold text-red-600">오류가 발생했습니다</h1>
        <p className="mb-6 text-gray-600">
          죄송합니다. 페이지를 로드하는 중에 문제가 발생했습니다.
        </p>
        <div className="mb-6 rounded-md bg-gray-100 p-4 text-left">
          <p className="font-mono text-sm text-gray-700">
            {error.message || '알 수 없는 오류'}
          </p>
          {error.digest && (
            <p className="mt-2 font-mono text-xs text-gray-500">
              오류 ID: {error.digest}
            </p>
          )}
        </div>
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
          <button
            onClick={() => reset()}
            className="rounded-md bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
          >
            다시 시도
          </button>
          <Link
            href="/"
            className="rounded-md bg-gray-200 px-4 py-2 text-gray-800 transition hover:bg-gray-300"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}