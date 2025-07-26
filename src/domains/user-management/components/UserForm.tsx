'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Select } from '@/shared/components/ui/Select';
import { FormField } from '@/shared/components/ui/FormField';
import type { User, UserFormData, Role, UserStatus } from '../types';

interface UserFormProps {
  user?: User | null;
  roles: Role[];
  plants: { id: string; name: string }[];
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: UserFormData) => Promise<void>;
  loading?: boolean;
}

export function UserForm({
  user,
  roles,
  plants,
  isOpen,
  onClose,
  onSubmit,
  loading = false
}: UserFormProps) {
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    plant_id: '',
    status: 'active'
  });

  const [errors, setErrors] = useState<Partial<UserFormData>>({});

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        department: user.department || '',
        position: user.position || '',
        plant_id: user.plant_id,
        status: user.status
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        department: '',
        position: '',
        plant_id: '',
        status: 'active'
      });
    }
    setErrors({});
  }, [user, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Partial<UserFormData> = {};

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('사용자 저장 실패:', error);
    }
  };

  const handleChange = (field: keyof UserFormData) => (
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

  const statusOptions = [
    { value: 'active', label: '활성' },
    { value: 'inactive', label: '비활성' },
    { value: 'pending', label: '대기' },
    { value: 'suspended', label: '정지' }
  ];

  const plantOptions = plants.map(plant => ({
    value: plant.id,
    label: plant.name
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={user ? '사용자 편집' : '새 사용자 추가'}
      maxWidth="lg"
    >
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
                placeholder="사용자 이름"
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
                disabled={!!user} // 편집 시에는 이메일 변경 불가
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
                  { value: '', label: '공장 선택' },
                  ...plantOptions
                ]}
                error={!!errors.plant_id}
              />
            </FormField>

            <FormField
              label="부서"
              error={errors.department}
            >
              <Input
                type="text"
                value={formData.department}
                onChange={handleChange('department')}
                placeholder="예: 생산팀, 정비팀"
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
                placeholder="예: 팀장, 주임"
                error={!!errors.position}
              />
            </FormField>

            <FormField
              label="상태"
              required
              error={errors.status}
            >
              <Select
                value={formData.status}
                onChange={(value) => setFormData(prev => ({ ...prev, status: value as UserStatus }))}
                options={statusOptions}
                error={!!errors.status}
              />
            </FormField>
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex justify-end gap-3 pt-6 border-t dark:border-gray-700">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            취소
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
          >
            {user ? '수정' : '추가'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}