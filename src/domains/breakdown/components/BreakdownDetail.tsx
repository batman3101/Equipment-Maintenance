'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { 
  Calendar, 
  User, 
  AlertCircle, 
  Wrench, 
  CheckCircle, 
  Edit3, 
  Plus,
  Image as ImageIcon,
  Video,
  Download
} from 'lucide-react';
import { RepairTimeline } from '@/domains/repair/components/RepairTimeline';
import { ActionSheet } from '@/shared/components/ui/ActionSheet';
import type { Breakdown } from '../types';
import type { Repair } from '@/domains/repair/types';

interface BreakdownDetailProps {
  breakdown: Breakdown;
  repairs: Repair[];
  repairsLoading?: boolean;
  canEdit?: boolean;
  onEdit?: () => void;
  onAddRepair?: () => void;
}

/**
 * 고장 상세 정보 컴포넌트
 * 고장의 상세 정보와 첨부 파일, 수리 내역을 표시합니다.
 */
export function BreakdownDetail({ 
  breakdown, 
  repairs, 
  repairsLoading,
  canEdit = false,
  onEdit,
  onAddRepair 
}: BreakdownDetailProps) {
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showActionSheet, setShowActionSheet] = useState(false);

  const getStatusConfig = (status: Breakdown['status']) => {
    switch (status) {
      case 'in_progress':
        return {
          icon: AlertCircle,
          label: '진행 중',
          bgColor: 'bg-red-50',
          textColor: 'text-red-700',
          iconColor: 'text-red-500'
        };
      case 'under_repair':
        return {
          icon: Wrench,
          label: '수리 중',
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-700',
          iconColor: 'text-yellow-500'
        };
      case 'completed':
        return {
          icon: CheckCircle,
          label: '완료',
          bgColor: 'bg-green-50',
          textColor: 'text-green-700',
          iconColor: 'text-green-500'
        };
      default:
        return {
          icon: AlertCircle,
          label: '알 수 없음',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-700',
          iconColor: 'text-gray-500'
        };
    }
  };

  const statusConfig = getStatusConfig(breakdown.status);
  const StatusIcon = statusConfig.icon;

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'yyyy년 M월 d일 HH:mm', { locale: ko });
    } catch {
      return '날짜 정보 없음';
    }
  };

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setShowImageViewer(true);
  };

  const handleFileDownload = async (attachment: any) => {
    try {
      // 파일 다운로드 로직 구현
      const response = await fetch(attachment.file_path);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('파일 다운로드 오류:', error);
    }
  };

  const actionSheetItems = [
    ...(canEdit ? [{
      label: '고장 정보 수정',
      icon: Edit3,
      onClick: () => {
        setShowActionSheet(false);
        onEdit?.();
      }
    }] : []),
    ...(breakdown.status !== 'completed' ? [{
      label: '수리 기록 추가',
      icon: Plus,
      onClick: () => {
        setShowActionSheet(false);
        onAddRepair?.();
      }
    }] : [])
  ];

  return (
    <div className="bg-white">
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              {breakdown.equipment_type} - {breakdown.equipment_number}
            </h1>
            <div className={`
              inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium
              ${statusConfig.bgColor} ${statusConfig.textColor}
            `}>
              <StatusIcon className={`w-4 h-4 ${statusConfig.iconColor}`} />
              {statusConfig.label}
            </div>
          </div>
          
          {actionSheetItems.length > 0 && (
            <button
              onClick={() => setShowActionSheet(true)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <Edit3 className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* 기본 정보 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>발생 시각: {formatDateTime(breakdown.occurred_at)}</span>
          </div>
          
          {breakdown.reporter_id && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span>보고자: 담당자</span>
            </div>
          )}
        </div>
      </div>

      {/* 증상 */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">증상</h2>
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
          {breakdown.symptoms}
        </p>
        
        {breakdown.cause && (
          <div className="mt-4">
            <h3 className="text-md font-medium text-gray-900 mb-2">원인</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {breakdown.cause}
            </p>
          </div>
        )}
      </div>

      {/* 첨부 파일 */}
      {breakdown.attachments && breakdown.attachments.length > 0 && (
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">첨부 파일</h2>
          <div className="grid grid-cols-2 gap-3">
            {breakdown.attachments.map((attachment, index) => (
              <div
                key={attachment.id}
                className="relative bg-gray-50 rounded-lg overflow-hidden cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => {
                  if (attachment.file_type === 'image') {
                    handleImageClick(index);
                  } else {
                    handleFileDownload(attachment);
                  }
                }}
              >
                <div className="aspect-square flex items-center justify-center">
                  {attachment.file_type === 'image' ? (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <Video className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
                  <p className="text-xs truncate">{attachment.file_name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs opacity-75">
                      {(attachment.file_size / 1024 / 1024).toFixed(1)}MB
                    </span>
                    <Download className="w-3 h-3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 수리 내역 */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">수리 내역</h2>
          {breakdown.status !== 'completed' && onAddRepair && (
            <button
              onClick={onAddRepair}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              수리 기록 추가
            </button>
          )}
        </div>
        
        <RepairTimeline repairs={repairs} loading={repairsLoading} />
      </div>

      {/* 액션 시트 */}
      <ActionSheet
        isOpen={showActionSheet}
        onClose={() => setShowActionSheet(false)}
        title="작업 선택"
        items={actionSheetItems}
      />

      {/* 이미지 뷰어 (간단한 구현) */}
      {showImageViewer && breakdown.attachments && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowImageViewer(false)}
        >
          <div className="max-w-full max-h-full">
            <div className="bg-white rounded-lg p-2">
              <p className="text-center text-sm text-gray-600 mb-2">
                {breakdown.attachments[selectedImageIndex]?.file_name}
              </p>
              <div className="bg-gray-100 rounded flex items-center justify-center min-h-[200px]">
                <ImageIcon className="w-16 h-16 text-gray-400" />
                <p className="ml-2 text-gray-500">이미지 미리보기</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}