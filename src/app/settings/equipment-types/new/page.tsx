'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Textarea } from '@/shared/components/ui/Textarea';
import { useEquipmentTypes, CreateEquipmentTypeRequest } from '@/domains/settings';
import { Navigation } from '@/components/navigation';
import { ProtectedRoute } from '@/domains/auth/components/protected-route';

export default function NewEquipmentTypePage() {
  const router = useRouter();
  const { createEquipmentType } = useEquipmentTypes();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<CreateEquipmentTypeRequest>({
    name: '',
    description: '',
    display_order: 1,
    is_active: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 기본 유효성 검사
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = '설비 종류 이름을 입력해주세요.';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      setErrors({});
      
      await createEquipmentType(formData);
      router.push('/settings/equipment-types');
    } catch (error) {
      console.error('설비 종류 생성 실패:', error);
      setErrors({ submit: error instanceof Error ? error.message : '생성에 실패했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateEquipmentTypeRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="container mx-auto p-4 max-w-2xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">새 설비 종류 추가</h1>
            <p className="text-gray-600 mt-1">새로운 설비 종류를 생성합니다.</p>
          </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              설비 종류 이름 *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="예: CNC 머시닝센터"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              설명
            </label>
            <Textarea
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="설비 종류에 대한 설명을 입력하세요"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              표시 순서
            </label>
            <Input
              type="number"
              value={formData.display_order || 1}
              onChange={(e) => handleInputChange('display_order', parseInt(e.target.value) || 1)}
              min="1"
              max="9999"
            />
          </div>

          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{errors.submit}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button
              type="button"
              onClick={() => router.back()}
              disabled={loading}
              className="border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? '생성 중...' : '생성'}
            </Button>
          </div>
          </form>
        </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}