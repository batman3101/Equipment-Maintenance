'use client';

import React, { useState } from 'react';
import {
  Button,
  Input,
  Select,
  Textarea,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  FormField,
  FormLabel,
  LoadingSpinner,
  Skeleton,
  Modal,
  Badge,
  StatusBadge,
  ToastContainer,
  toast
} from '@/shared/components/ui';

/**
 * UI 컴포넌트 테스트 페이지
 * - 모든 공통 UI 컴포넌트들의 동작 확인
 * - 모바일 최적화 및 접근성 테스트
 */
export default function UITestPage() {
  const [inputValue, setInputValue] = useState('');
  const [selectValue, setSelectValue] = useState('');
  const [textareaValue, setTextareaValue] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const selectOptions = [
    { value: 'option1', label: '옵션 1' },
    { value: 'option2', label: '옵션 2' },
    { value: 'option3', label: '옵션 3' },
  ];

  const handleSubmit = async () => {
    setIsLoading(true);
    
    // 2초 후 완료 시뮬레이션
    setTimeout(() => {
      setIsLoading(false);
      toast.success('성공!', '폼이 성공적으로 제출되었습니다.');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            UI 컴포넌트 테스트
          </h1>
          <p className="text-gray-600">
            공통 UI 컴포넌트 라이브러리 동작 확인
          </p>
        </div>

        {/* 버튼 테스트 */}
        <Card>
          <CardHeader>
            <CardTitle>버튼 컴포넌트</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="ghost">Ghost</Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button loading>Loading</Button>
                <Button disabled>Disabled</Button>
                <Button fullWidth>Full Width</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 입력 필드 테스트 */}
        <Card>
          <CardHeader>
            <CardTitle>입력 필드 컴포넌트</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                label="기본 입력"
                placeholder="텍스트를 입력하세요"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              
              <Input
                label="에러 상태"
                error="이 필드는 필수입니다."
                placeholder="에러 상태 입력"
              />
              
              <Input
                label="도움말 텍스트"
                helperText="이것은 도움말 텍스트입니다."
                placeholder="도움말이 있는 입력"
              />
              
              <Select
                label="선택 필드"
                placeholder="옵션을 선택하세요"
                options={selectOptions}
                value={selectValue}
                onChange={setSelectValue}
              />
              
              <Textarea
                label="텍스트 영역"
                placeholder="여러 줄 텍스트를 입력하세요"
                value={textareaValue}
                onChange={(e) => setTextareaValue(e.target.value)}
                maxLength={200}
              />
            </div>
          </CardContent>
        </Card>

        {/* 배지 테스트 */}
        <Card>
          <CardHeader>
            <CardTitle>배지 컴포넌트</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="default">기본</Badge>
                <Badge variant="success">성공</Badge>
                <Badge variant="warning">경고</Badge>
                <Badge variant="danger">위험</Badge>
                <Badge variant="info">정보</Badge>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <StatusBadge status="in_progress" />
                <StatusBadge status="under_repair" />
                <StatusBadge status="completed" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 로딩 및 스켈레톤 테스트 */}
        <Card>
          <CardHeader>
            <CardTitle>로딩 컴포넌트</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <LoadingSpinner size="sm" />
                <LoadingSpinner size="md" />
                <LoadingSpinner size="lg" />
              </div>
              
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 모달 및 토스트 테스트 */}
        <Card>
          <CardHeader>
            <CardTitle>모달 및 알림</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setIsModalOpen(true)}>
                  모달 열기
                </Button>
                <Button onClick={() => toast.success('성공!', '성공 메시지입니다.')}>
                  성공 토스트
                </Button>
                <Button onClick={() => toast.error('오류!', '오류 메시지입니다.')}>
                  오류 토스트
                </Button>
                <Button onClick={() => toast.warning('경고!', '경고 메시지입니다.')}>
                  경고 토스트
                </Button>
                <Button onClick={() => toast.info('정보!', '정보 메시지입니다.')}>
                  정보 토스트
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 폼 테스트 */}
        <Card>
          <CardHeader>
            <CardTitle>폼 예제</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <FormField>
                <FormLabel required>설비 종류</FormLabel>
                <Select
                  placeholder="설비 종류를 선택하세요"
                  options={[
                    { value: 'cnc', label: 'CNC 머신' },
                    { value: 'lathe', label: '선반' },
                    { value: 'mill', label: '밀링머신' },
                  ]}
                />
              </FormField>
              
              <FormField>
                <FormLabel required>설비 번호</FormLabel>
                <Input placeholder="예: CNC-001" />
              </FormField>
              
              <FormField>
                <FormLabel required>고장 증상</FormLabel>
                <Textarea 
                  placeholder="고장 증상을 자세히 입력해주세요"
                  maxLength={500}
                />
              </FormField>
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex gap-2 w-full">
              <Button variant="ghost" fullWidth>
                취소
              </Button>
              <Button 
                variant="primary" 
                fullWidth 
                loading={isLoading}
                onClick={handleSubmit}
              >
                제출
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* 모달 */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="테스트 모달"
      >
        <div className="space-y-4">
          <p>이것은 테스트 모달입니다.</p>
          <p>모바일에서도 잘 작동하는지 확인해보세요.</p>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              onClick={() => setIsModalOpen(false)}
            >
              취소
            </Button>
            <Button 
              variant="primary"
              onClick={() => {
                setIsModalOpen(false);
                toast.success('확인!', '모달에서 확인을 클릭했습니다.');
              }}
            >
              확인
            </Button>
          </div>
        </div>
      </Modal>

      {/* 토스트 컨테이너 */}
      <ToastContainer position="top-right" />
    </div>
  );
}