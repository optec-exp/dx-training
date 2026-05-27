'use client';

import { useRef, ChangeEvent } from 'react';
import {
  validateReceiptFile,
  isImageUrl,
  getFileNameFromUrl,
  ALLOWED_TYPES_LABEL,
} from '@/lib/storage';

type Props = {
  newFile: File | null;
  onNewFileChange: (file: File | null, validationError: string | null) => void;
  existingUrl?: string | null;
  onRemoveExisting?: () => void;
  disabled?: boolean;
  validationError?: string | null;
};

export function ReceiptUploader({
  newFile,
  onNewFileChange,
  existingUrl,
  onRemoveExisting,
  disabled,
  validationError,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (ev: ChangeEvent<HTMLInputElement>) => {
    const f = ev.target.files?.[0] ?? null;
    if (!f) {
      onNewFileChange(null, null);
      return;
    }
    const err = validateReceiptFile(f);
    onNewFileChange(err ? null : f, err);
    if (err && inputRef.current) inputRef.current.value = '';
  };

  const clearNewFile = () => {
    if (inputRef.current) inputRef.current.value = '';
    onNewFileChange(null, null);
  };

  return (
    <div>
      <label className="block text-sm font-semibold mb-1">
        凭证（可选）
      </label>

      {/* 已有凭证（编辑模式） */}
      {existingUrl && !newFile && (
        <div className="mb-2 p-3 border border-gray-300 rounded bg-gray-50 flex items-center gap-3">
          {isImageUrl(existingUrl) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={existingUrl}
              alt="当前凭证"
              className="w-16 h-16 object-cover rounded border border-gray-300"
            />
          ) : (
            <div className="w-16 h-16 flex items-center justify-center bg-white border border-gray-300 rounded text-xs text-gray-500">
              📎 文件
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-gray-700">当前凭证</div>
            <div className="text-xs text-gray-500 truncate">{getFileNameFromUrl(existingUrl)}</div>
            <a
              href={existingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline"
            >
              查看
            </a>
          </div>
          {onRemoveExisting && (
            <button
              type="button"
              onClick={onRemoveExisting}
              disabled={disabled}
              className="text-red-600 hover:bg-red-50 px-2 py-1 rounded text-sm border border-red-300"
            >
              删除
            </button>
          )}
        </div>
      )}

      {/* 已选新文件 */}
      {newFile && (
        <div className="mb-2 p-3 border border-blue-300 rounded bg-blue-50 flex items-center gap-3">
          <div className="w-16 h-16 flex items-center justify-center bg-white border border-blue-300 rounded text-xs text-gray-500">
            {newFile.type.startsWith('image/') ? '🖼️' : '📎'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-blue-700">
              {existingUrl ? '将替换为：' : '已选择：'}
            </div>
            <div className="text-xs text-gray-700 truncate">{newFile.name}</div>
            <div className="text-xs text-gray-500">
              {(newFile.size / 1024).toFixed(1)} KB · {newFile.type}
            </div>
          </div>
          <button
            type="button"
            onClick={clearNewFile}
            disabled={disabled}
            className="text-gray-600 hover:bg-gray-100 px-2 py-1 rounded text-sm border border-gray-300"
          >
            取消
          </button>
        </div>
      )}

      {/* 文件选择按钮 */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        onChange={handleFileSelect}
        disabled={disabled}
        className="block w-full text-sm text-gray-600
          file:mr-3 file:py-2 file:px-4
          file:rounded file:border file:border-gray-300
          file:text-sm file:font-semibold
          file:bg-white file:text-gray-700
          file:hover:bg-gray-100
          file:cursor-pointer
          disabled:opacity-50"
      />

      <p className="text-xs text-gray-500 mt-1">
        支持 {ALLOWED_TYPES_LABEL}，最大 5 MB
      </p>

      {validationError && (
        <p className="text-red-600 text-sm mt-1">{validationError}</p>
      )}
    </div>
  );
}
