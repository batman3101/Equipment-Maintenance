'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * 이미지 URL을 WebP 형식으로 변환하는 함수
 * 브라우저가 WebP를 지원하는 경우에만 사용
 */
function getWebPImageUrl(url: string): string {
  if (typeof window === 'undefined') return url;

  const supportsWebP = localStorage.getItem('supportsWebP');

  if (supportsWebP === 'true' && !url.endsWith('.webp') && !url.includes('data:image')) {
    // 이미 쿼리 파라미터가 있는 경우
    if (url.includes('?')) {
      return `${url}&format=webp`;
    }
    return `${url}?format=webp`;
  }

  return url;
}

interface LazyImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  placeholderSrc?: string;
  blurDataURL?: string;
  quality?: number;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * 지연 로딩 이미지 컴포넌트
 * - Intersection Observer를 사용한 지연 로딩
 * - WebP 형식 자동 변환 (브라우저 지원 시)
 * - 블러 플레이스홀더 지원
 * - 로딩 상태 표시
 */
export function LazyImage({
  src,
  alt,
  width,
  height,
  className,
  placeholderSrc,
  blurDataURL,
  quality = 75,
  objectFit = 'cover',
  priority = false,
  onLoad,
  onError,
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(priority);
  const [imgSrc, setImgSrc] = useState<string>(priority ? src : placeholderSrc || '');
  const imgRef = useRef<HTMLDivElement>(null);

  // WebP 지원 확인 및 URL 변환
  useEffect(() => {
    if (isVisible && !isLoaded) {
      const optimizedSrc = getWebPImageUrl(src);
      setImgSrc(optimizedSrc);
    }
  }, [src, isVisible, isLoaded]);

  // Intersection Observer를 사용한 지연 로딩
  useEffect(() => {
    if (priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '200px', // 뷰포트 200px 전에 로딩 시작
        threshold: 0.01,
      }
    );

    observer.observe(imgRef.current);

    return () => {
      observer.disconnect();
    };
  }, [priority]);

  // 이미지 로드 핸들러
  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  // 이미지 에러 핸들러
  const handleError = () => {
    if (placeholderSrc && imgSrc !== placeholderSrc) {
      setImgSrc(placeholderSrc);
    }
    onError?.();
  };

  return (
    <div
      ref={imgRef}
      className={cn(
        'relative overflow-hidden bg-gray-100',
        className
      )}
      style={{ width, height }}
    >
      {/* 로딩 스켈레톤 */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}

      {/* 이미지 */}
      {(isVisible || priority) && (
        <Image
          src={imgSrc}
          alt={alt}
          width={width}
          height={height}
          quality={quality}
          className={cn(
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            objectFit === 'contain' && 'object-contain',
            objectFit === 'cover' && 'object-cover',
            objectFit === 'fill' && 'object-fill',
            objectFit === 'none' && 'object-none',
            objectFit === 'scale-down' && 'object-scale-down'
          )}
          placeholder={blurDataURL ? 'blur' : 'empty'}
          blurDataURL={blurDataURL}
          priority={priority}
          loading={priority ? 'eager' : 'lazy'}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  );
}