'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { EventListenerManager } from '@/lib/utils/memory-optimization';

/**
 * 메모리 안전 상태 관리 훅
 * 컴포넌트 언마운트 후에도 상태 업데이트를 방지하여 메모리 누수 방지
 */
export function useMemorySafeState<T>(initialState: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(initialState);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const memorySafeSetState = useCallback((value: T | ((prev: T) => T)) => {
    if (isMounted.current) {
      setState(value);
    }
  }, []);

  return [state, memorySafeSetState];
}

/**
 * 메모리 안전 이벤트 리스너 훅
 * 컴포넌트 언마운트 시 자동으로 이벤트 리스너 정리
 */
export function useMemorySafeEventListener() {
  const eventListenerManager = useRef(new EventListenerManager());

  const addEventListener = useCallback(
    (
      target: EventTarget,
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions
    ) => {
      eventListenerManager.current.add(target, type, listener, options);
    },
    []
  );

  useEffect(() => {
    return () => {
      eventListenerManager.current.removeAll();
    };
  }, []);

  return { addEventListener };
}

/**
 * 메모리 안전 인터벌 훅
 * 컴포넌트 언마운트 시 자동으로 인터벌 정리
 */
export function useMemorySafeInterval() {
  const intervals = useRef<number[]>([]);

  const setMemorySafeInterval = useCallback((callback: () => void, delay: number) => {
    const id = window.setInterval(callback, delay);
    intervals.current.push(id);
    return id;
  }, []);

  const clearMemorySafeInterval = useCallback((id: number) => {
    window.clearInterval(id);
    intervals.current = intervals.current.filter((intervalId) => intervalId !== id);
  }, []);

  useEffect(() => {
    return () => {
      intervals.current.forEach((id) => window.clearInterval(id));
      intervals.current = [];
    };
  }, []);

  return { setMemorySafeInterval, clearMemorySafeInterval };
}

/**
 * 메모리 안전 타임아웃 훅
 * 컴포넌트 언마운트 시 자동으로 타임아웃 정리
 */
export function useMemorySafeTimeout() {
  const timeouts = useRef<number[]>([]);

  const setMemorySafeTimeout = useCallback((callback: () => void, delay: number) => {
    const id = window.setTimeout(callback, delay);
    timeouts.current.push(id);
    return id;
  }, []);

  const clearMemorySafeTimeout = useCallback((id: number) => {
    window.clearTimeout(id);
    timeouts.current = timeouts.current.filter((timeoutId) => timeoutId !== id);
  }, []);

  useEffect(() => {
    return () => {
      timeouts.current.forEach((id) => window.clearTimeout(id));
      timeouts.current = [];
    };
  }, []);

  return { setMemorySafeTimeout, clearMemorySafeTimeout };
}