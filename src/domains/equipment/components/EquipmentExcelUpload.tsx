'use client';

import React, { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Modal } from '@/shared/components/ui/Modal';
import { downloadEquipmentTemplate, parseEquipmentExcel, type ExcelParseResult, type ParsedEquipmentData } from '../utils/excel-template';

export interface EquipmentExcelUploadProps {
  onDataParsed?: (data: ParsedEquipmentData[]) => void;
  onUploadComplete?: () => void;
  loading?: boolean;
  className?: string;
}

/**
 * 설비 Excel 일괄 업로드 컴포넌트
 */
export const EquipmentExcelUpload: React.FC<EquipmentExcelUploadProps> = ({
  onDataParsed,
  onUploadComplete,
  loading = false,
  className
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ExcelParseResult | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 템플릿 다운로드
  const handleDownloadTemplate = () => {
    try {
      downloadEquipmentTemplate();
    } catch (error) {
      console.error('템플릿 다운로드 오류:', error);
      alert('템플릿 다운로드 중 오류가 발생했습니다.');
    }
  };

  // 파일 선택
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setParseResult(null);
      parseFile(file);
    }
  };

  // 파일 파싱
  const parseFile = async (file: File) => {
    setIsParsing(true);
    try {
      const result = await parseEquipmentExcel(file);
      setParseResult(result);
      
      if (result.data.length > 0 && result.errors.length === 0) {
        onDataParsed?.(result.data);
      }
    } catch (error) {
      console.error('파일 파싱 오류:', error);
      setParseResult({
        data: [],
        errors: ['파일 파싱 중 오류가 발생했습니다.'],
        warnings: []
      });
    } finally {
      setIsParsing(false);
    }
  };

  // 모달 열기
  const openModal = () => {
    setIsModalOpen(true);
    setSelectedFile(null);
    setParseResult(null);
  };

  // 모달 닫기
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedFile(null);
    setParseResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 업로드 확인
  const handleConfirmUpload = () => {
    if (parseResult?.data && parseResult.data.length > 0) {
      onUploadComplete?.();
      closeModal();
    }
  };

  // 파일 제거
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setParseResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      {/* 업로드 버튼 */}
      <Button
        onClick={openModal}
        variant="secondary"
        className={className}
        disabled={loading}
      >
        <Upload className="h-4 w-4 mr-2" />
        Excel 일괄 등록
      </Button>

      {/* 업로드 모달 */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={closeModal}
        title="설비 Excel 일괄 등록"
        size="lg"
      >
        <div className="space-y-6">
          {/* 템플릿 다운로드 섹션 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <FileSpreadsheet className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-blue-900 mb-1">
                  1단계: Excel 템플릿 다운로드
                </h3>
                <p className="text-sm text-blue-700 mb-3">
                  설비 등록용 Excel 템플릿을 다운로드하여 데이터를 입력하세요.
                </p>
                <Button
                  onClick={handleDownloadTemplate}
                  variant="primary"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  템플릿 다운로드
                </Button>
              </div>
            </div>
          </div>

          {/* 파일 업로드 섹션 */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">
              2단계: Excel 파일 업로드
            </h3>

            {/* 파일 선택 영역 */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {!selectedFile ? (
                <div>
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">
                    Excel 파일을 선택하거나 드래그하여 업로드하세요
                  </p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="secondary"
                    size="sm"
                  >
                    파일 선택
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-center space-x-2">
                    <FileSpreadsheet className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-900">
                      {selectedFile.name}
                    </span>
                    <button
                      onClick={handleRemoveFile}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              )}
            </div>

            {/* 파싱 중 표시 */}
            {isParsing && (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                <span className="text-sm text-gray-600">파일을 분석하고 있습니다...</span>
              </div>
            )}

            {/* 파싱 결과 표시 */}
            {parseResult && !isParsing && (
              <div className="space-y-4">
                {/* 성공 메시지 */}
                {parseResult.data.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-green-900">
                          파싱 완료
                        </h4>
                        <p className="text-sm text-green-700">
                          {parseResult.data.length}개의 설비 데이터를 성공적으로 읽어왔습니다.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 경고 메시지 */}
                {parseResult.warnings.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-yellow-900 mb-1">
                          경고
                        </h4>
                        <ul className="text-sm text-yellow-700 space-y-1">
                          {parseResult.warnings.map((warning, index) => (
                            <li key={index}>• {warning}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* 오류 메시지 */}
                {parseResult.errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-red-900 mb-1">
                          오류
                        </h4>
                        <ul className="text-sm text-red-700 space-y-1">
                          {parseResult.errors.map((error, index) => (
                            <li key={index}>• {error}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* 데이터 미리보기 */}
                {parseResult.data.length > 0 && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                      <h4 className="text-sm font-medium text-gray-900">
                        데이터 미리보기 (최대 5개)
                      </h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              설비 번호
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              설비 종류
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              상태
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {parseResult.data.slice(0, 5).map((item, index) => (
                            <tr key={index}>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {item.equipment_number}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {item.equipment_type}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {item.status || 'active'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {parseResult.data.length > 5 && (
                      <div className="bg-gray-50 px-4 py-2 text-center">
                        <span className="text-xs text-gray-500">
                          ...그 외 {parseResult.data.length - 5}개 더
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 버튼 영역 */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              onClick={closeModal}
              variant="secondary"
              disabled={loading}
            >
              취소
            </Button>
            <Button
              onClick={handleConfirmUpload}
              variant="primary"
              disabled={
                !parseResult?.data ||
                parseResult.data.length === 0 ||
                parseResult.errors.length > 0 ||
                loading
              }
              loading={loading}
            >
              {loading ? '등록 중...' : `${parseResult?.data?.length || 0}개 설비 등록`}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};