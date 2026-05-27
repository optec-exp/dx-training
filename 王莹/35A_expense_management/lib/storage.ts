import { supabase, RECEIPT_BUCKET } from './supabase';

export const MAX_RECEIPT_SIZE = 5 * 1024 * 1024;  // 5 MB

export const ALLOWED_RECEIPT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

export const ALLOWED_TYPES_LABEL = 'JPG / PNG / WebP / PDF';

export function validateReceiptFile(file: File): string | null {
  if (!ALLOWED_RECEIPT_TYPES.includes(file.type)) {
    return `不支持的文件类型（${file.type || '未知'}）。仅支持 ${ALLOWED_TYPES_LABEL}`;
  }
  if (file.size > MAX_RECEIPT_SIZE) {
    return `文件过大（${(file.size / 1024 / 1024).toFixed(2)} MB）。最大 5 MB`;
  }
  return null;
}

export function isImageUrl(url: string): boolean {
  return /\.(jpe?g|png|webp|gif)(\?|$)/i.test(url);
}

export function getFileNameFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/');
    const last = parts[parts.length - 1] || '';
    return decodeURIComponent(last);
  } catch {
    return url;
  }
}

// 从 publicUrl 反推出 bucket 内的 path
// URL 格式：https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
export function extractStoragePath(url: string): string | null {
  const marker = `/storage/v1/object/public/${RECEIPT_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}

export async function uploadReceipt(file: File): Promise<{ publicUrl: string; path: string }> {
  // 生成唯一路径：{random-uuid}-{sanitized-name}
  const uuid = crypto.randomUUID();
  // 文件名清洗：保留扩展名，去掉空格/特殊字符
  const safeName = file.name.replace(/[^\w.\-]+/g, '_');
  const path = `${uuid}-${safeName}`;

  const { error } = await supabase.storage
    .from(RECEIPT_BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    throw new Error(`上传失败：${error.message}`);
  }

  const { data } = supabase.storage.from(RECEIPT_BUCKET).getPublicUrl(path);
  return { publicUrl: data.publicUrl, path };
}

export async function deleteReceiptByUrl(url: string): Promise<void> {
  const path = extractStoragePath(url);
  if (!path) {
    // 不是受我们管理的 URL，跳过删除（安全起见不报错）
    return;
  }
  const { error } = await supabase.storage.from(RECEIPT_BUCKET).remove([path]);
  if (error) {
    throw new Error(`删除旧凭证失败：${error.message}`);
  }
}
