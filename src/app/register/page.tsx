'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Select } from '@/shared/components/ui/Select';
import { FormField } from '@/shared/components/ui/FormField';
import { Card } from '@/shared/components/ui/Card';
import { createUserRegistrationService } from '@/domains/user-management/services';
import type { RegisterCredentials } from '@/domains/user-management/types';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<RegisterCredentials>({
    email: '',
    name: '',
    phone: '',
    department: '',
    position: '',
    requested_role: '',
    plant_id: ''
  });

  const [errors, setErrors] = useState<Partial<RegisterCredentials>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const registrationService = createUserRegistrationService();

  // 모의 데이터 (실제 구현에서는 API에서 가져옴)
  const plants = [
    { value: '550e8400-e29b-41d4-a716-446655440001', label: '1공장' },
    { value: '550e8400-e29b-41d4-a716-446655440002', label: '2공장' }
  ];

  const roles = [
    { value: 'engineer', label: '현장 엔지니어' },
    { value: 'technician', label: '기술자' },
    { value: 'manager', label: '현장 관리자' },
    { value: 'viewer', label: '조회자' }
  ];

  const departments = [
    { value: '생산팀', label: '생산팀' },
    { value: '정비팀', label: '정비팀' },
    { value: '품질팀', label: '품질팀' },
    { value: '기술팀', label: '기술팀' },
    { value: '관리팀', label: '관리팀' }
  ];

  const validateForm = (): boolean => {
    const newErrors: Partial<RegisterCredentials> = {};

    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요.';
    }

    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식을 입력해주세요.';
    }

    if (!formData.plant_id) {
      newErrors.plant_id = '공장을 선택해주세요.';
    }

    if (!formData.requested_role) {
      newErrors.requested_role = '역할을 선택해주세요.';
    }

    if (formData.phone && !/^[0-9-]+$/.test(formData.phone)) {
      newErrors.phone = '올바른 전화번호 형식을 입력해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const result = await registrationService.register(formData);
      
      if (result.success) {
        setSuccess(true);
      } else {
        setErrors({ email: result.message });
      }
    } catch (error) {
      console.error('등록 실패:', error);
      setErrors({ email: '등록 중 오류가 발생했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof RegisterCredentials) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    
    // 에러 초기화
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            등록 요청 완료
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            등록 요청이 성공적으로 제출되었습니다.<br />
            이메일을 확인하여 인증을 완료해주세요.
          </p>
          
          <div className="space-y-3">
            <Button
              variant="primary"
              onClick={() => router.push('/login')}
              className="w-full"
            >
              로그인 페이지로 이동
            </Button>
            
            <Button
              variant="secondary"
              onClick={() => {
                setSuccess(false);
                setFormData({
                  email: '',
                  name: '',
                  phone: '',
                  department: '',
                  position: '',
                  requested_role: '',
                  plant_id: ''
                });
              }}
              className="w-full"
            >
              새로운 등록 요청
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-2xl w-full p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            회원가입
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            CNC 설비 관리 시스템에 가입하세요
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 기본 정보 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                기본 정보
              </h3>
              
              <FormField
                label="이름"
                required
                error={errors.name}
              >
                <Input
                  type="text"
                  value={formData.name}
                  onChange={handleChange('name')}
                  placeholder="홍길동"
                  error={!!errors.name}
                />
              </FormField>

              <FormField
                label="이메일"
                required
                error={errors.email}
              >
                <Input
                  type="email"
                  value={formData.email}
                  onChange={handleChange('email')}
                  placeholder="user@example.com"
                  error={!!errors.email}
                />
              </FormField>

              <FormField
                label="전화번호"
                error={errors.phone}
              >
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange('phone')}
                  placeholder="010-0000-0000"
                  error={!!errors.phone}
                />
              </FormField>
            </div>

            {/* 조직 정보 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                조직 정보
              </h3>
              
              <FormField
                label="공장"
                required
                error={errors.plant_id}
              >
                <Select
                  value={formData.plant_id}
                  onChange={(value) => setFormData(prev => ({ ...prev, plant_id: value }))}
                  options={[
                    { value: '', label: '공장을 선택해주세요' },
                    ...plants
                  ]}
                  error={!!errors.plant_id}
                />
              </FormField>

              <FormField
                label="부서"
                error={errors.department}
              >
                <Select
                  value={formData.department}
                  onChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
                  options={[
                    { value: '', label: '부서를 선택해주세요' },
                    ...departments
                  ]}
                  error={!!errors.department}
                />
              </FormField>

              <FormField
                label="직책"
                error={errors.position}
              >
                <Input
                  type="text"
                  value={formData.position}
                  onChange={handleChange('position')}
                  placeholder="예: 팀장, 주임, 사원"
                  error={!!errors.position}
                />
              </FormField>

              <FormField
                label="요청 역할"
                required
                error={errors.requested_role}
                helpText="승인 시 할당받을 역할을 선택해주세요"
              >
                <Select
                  value={formData.requested_role}
                  onChange={(value) => setFormData(prev => ({ ...prev, requested_role: value }))}
                  options={[
                    { value: '', label: '역할을 선택해주세요' },
                    ...roles
                  ]}
                  error={!!errors.requested_role}
                />
              </FormField>
            </div>
          </div>

          {/* 버튼 */}
          <div className="pt-6 border-t dark:border-gray-700">
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full"
            >
              등록 요청 제출
            </Button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            이미 계정이 있으신가요?{' '}
            <Link 
              href="/login" 
              className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
            >
              로그인하기
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}