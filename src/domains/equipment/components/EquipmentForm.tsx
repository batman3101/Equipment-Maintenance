'use client';

import React, { useState } from 'react';
import { 
  Button, 
  Input, 
  Select, 
  Textarea,
  FormField,
  FormLabel 
} from '@/shared/components/ui';
import type { 
  CreateEquipmentRequest, 
  UpdateEquipmentRequest,
  EquipmentType,
  EquipmentPriority 
} from '../types';
import { 
  EQUIPMENT_TYPE_LABELS, 
  EQUIPMENT_PRIORITY_LABELS 
} from '../types';

export interface EquipmentFormProps {
  initialData?: Partial<CreateEquipmentRequest>;
  onSubmit?: (data: CreateEquipmentRequest) => void;
  onCancel?: () => void;
  loading?: boolean;
  className?: string;
}

export const EquipmentForm = React.forwardRef<HTMLFormElement, EquipmentFormProps>(
  ({ 
    initialData,
    onSubmit,
    onCancel,
    loading = false,
    className,
    ...props 
  }, ref) => {
    
    const [formData, setFormData] = useState<CreateEquipmentRequest>({
      equipment_number: initialData?.equipment_number || '',
      name: initialData?.name || '',
      type: initialData?.type || 'cnc_machine',
      location: initialData?.location || '',
      priority: initialData?.priority || 'medium',
      model: initialData?.model || '',
      manufacturer: initialData?.manufacturer || '',
      description: initialData?.description || ''
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit?.(formData);
    };

    const typeOptions = Object.entries(EQUIPMENT_TYPE_LABELS).map(([value, label]) => ({
      value,
      label
    }));

    const priorityOptions = Object.entries(EQUIPMENT_PRIORITY_LABELS).map(([value, label]) => ({
      value,
      label
    }));

    return (
      <form ref={ref} onSubmit={handleSubmit} className={className} {...props}>
        <div className="space-y-4">
          <FormField>
            <FormLabel required>설비 번호</FormLabel>
            <Input
              value={formData.equipment_number}
              onChange={(e) => setFormData(prev => ({ ...prev, equipment_number: e.target.value }))}
              placeholder="예: CNC-001"
              required
            />
          </FormField>

          <FormField>
            <FormLabel required>설비명</FormLabel>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="설비명을 입력하세요"
              required
            />
          </FormField>

          <FormField>
            <FormLabel required>설비 종류</FormLabel>
            <Select
              value={formData.type}
              onChange={(value) => setFormData(prev => ({ ...prev, type: value as EquipmentType }))}
              options={typeOptions}
              required
            />
          </FormField>

          <FormField>
            <FormLabel required>설치 위치</FormLabel>
            <Input
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="예: 1층 생산라인 A"
              required
            />
          </FormField>

          <FormField>
            <FormLabel required>우선순위</FormLabel>
            <Select
              value={formData.priority}
              onChange={(value) => setFormData(prev => ({ ...prev, priority: value as EquipmentPriority }))}
              options={priorityOptions}
              required
            />
          </FormField>

          <FormField>
            <FormLabel>제조사</FormLabel>
            <Input
              value={formData.manufacturer}
              onChange={(e) => setFormData(prev => ({ ...prev, manufacturer: e.target.value }))}
              placeholder="제조사명"
            />
          </FormField>

          <FormField>
            <FormLabel>모델명</FormLabel>
            <Input
              value={formData.model}
              onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
              placeholder="모델명"
            />
          </FormField>

          <FormField>
            <FormLabel>설명</FormLabel>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="설비에 대한 추가 설명"
              rows={3}
            />
          </FormField>
        </div>

        <div className="flex space-x-3 pt-6">
          {onCancel && (
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={loading}
              fullWidth
            >
              취소
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            fullWidth
          >
            저장
          </Button>
        </div>
      </form>
    );
  }
);

EquipmentForm.displayName = 'EquipmentForm';