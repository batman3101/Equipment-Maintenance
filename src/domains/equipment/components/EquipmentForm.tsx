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
import { 
  CreateEquipmentRequest, 
  UpdateEquipmentRequest,
  EquipmentStatus
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
      equipment_type: initialData?.equipment_type || '',
      plant_id: initialData?.plant_id || '550e8400-e29b-41d4-a716-446655440001', // 기본 공장 ID
      status: initialData?.status || EquipmentStatus.ACTIVE
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit?.(formData);
    };

    const equipmentTypeOptions = [
      { value: 'cnc_machine', label: 'CNC 머신' },
      { value: 'lathe', label: '선반' },
      { value: 'milling_machine', label: '밀링머신' },
      { value: 'drill_press', label: '드릴프레스' },
      { value: 'grinder', label: '그라인더' },
      { value: 'press', label: '프레스' },
      { value: 'conveyor', label: '컨베이어' },
      { value: 'robot', label: '로봇' },
      { value: 'other', label: '기타' }
    ];

    const statusOptions = [
      { value: EquipmentStatus.ACTIVE, label: '정상' },
      { value: EquipmentStatus.INACTIVE, label: '비활성' },
      { value: EquipmentStatus.MAINTENANCE, label: '정비중' },
      { value: EquipmentStatus.BROKEN, label: '고장' }
    ];

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
            <FormLabel required>설비 종류</FormLabel>
            <Select
              value={formData.equipment_type}
              onChange={(value) => setFormData(prev => ({ ...prev, equipment_type: value }))}
              options={equipmentTypeOptions}
              required
            />
          </FormField>

          <FormField>
            <FormLabel>상태</FormLabel>
            <Select
              value={formData.status}
              onChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              options={statusOptions}
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