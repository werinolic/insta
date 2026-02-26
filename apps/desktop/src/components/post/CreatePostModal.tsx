import { useState, useCallback } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuthStore } from '@/lib/store';
import { FilePickerButton, type PickedFile } from '../FilePickerButton';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

interface MediaItem extends PickedFile {
  status: 'pending' | 'uploading' | 'done' | 'error';
  key?: string;
  url?: string;
  thumbnailUrl?: string;
  mediumUrl?: string;
  width?: number | null;
  height?: number | null;
}

export function CreatePostModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<'pick' | 'edit'>('pick');
  const [items, setItems] = useState<MediaItem[]>([]);
  const [previewIdx, setPreviewIdx] = useState(0);
  const [caption, setCaption] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState('');
  const token = useAuthStore((s) => s.accessToken);
  const utils = trpc.useUtils();

  const createPost = trpc.posts.create.useMutation();

  const addFiles = useCallback(
    (files: PickedFile[]) => {
      const valid = files.slice(0, 10 - items.length);
      if (!valid.length) return;
      setItems((prev) => [
        ...prev,
        ...valid.map((f) => ({ ...f, status: 'pending' as const })),
      ]);
      setStep('edit');
    },
    [items.length],
  );

  const removeItem = (idx: number) => {
    URL.revokeObjectURL(items[idx].preview);
    const next = items.filter((_, i) => i !== idx);
    setItems(next);
    setPreviewIdx((p) => Math.min(p, Math.max(0, next.length - 1)));
    if (next.length === 0) setStep('pick');
  };

  const moveItem = (idx: number, dir: -1 | 1) => {
    const next = idx + dir;
    if (next < 0 || next >= items.length) return;
    setItems((prev) => {
      const arr = [...prev];
      [arr[idx], arr[next]] = [arr[next], arr[idx]];
      return arr;
    });
    setPreviewIdx(next);
  };

  const handlePost = async () => {
    if (!items.length || isPosting) return;
    setIsPosting(true);
    setError('');

    try {
      const uploaded = await Promise.all(
        items.map(async (item, idx) => {
          setItems((prev) =>
            prev.map((it, i) => (i === idx ? { ...it, status: 'uploading' } : it)),
          );

          const res = await fetch(
            `${API_URL}/upload?purpose=post&filename=${encodeURIComponent(item.name)}`,
            {
              method: 'POST',
              body: item.blob,
              headers: {
                'Content-Type': item.mimeType,
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
            },
          );

          if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Upload failed' }));
            throw new Error((err as { error?: string }).error ?? `Upload failed (${res.status})`);
          }

          const processed = (await res.json()) as {
            key: string;
            url: string;
            thumbnailUrl: string;
            mediumUrl: string;
            width: number | null;
            height: number | null;
          };

          setItems((prev) =>
            prev.map((it, i) => (i === idx ? { ...it, status: 'done', ...processed } : it)),
          );

          return { order: idx, ...processed };
        }),
      );

      await createPost.mutateAsync({
        caption: caption.trim() || undefined,
        media: uploaded.map((m) => ({
          key: m.key,
          url: m.url,
          thumbnailUrl: m.thumbnailUrl,
          mediumUrl: m.mediumUrl,
          order: m.order,
          width: m.width ?? null,
          height: m.height ?? null,
        })),
      });

      items.forEach((it) => URL.revokeObjectURL(it.preview));
      utils.posts.feed.invalidate();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setIsPosting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-lg overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <h2 className="font-semibold text-sm">Create new post</h2>
          {step === 'edit' ? (
            <button
              onClick={handlePost}
              disabled={isPosting || !items.length}
              className="text-sm font-semibold text-brand hover:text-blue-700 disabled:opacity-40 transition-colors"
            >
              {isPosting ? 'Posting…' : 'Share'}
            </button>
          ) : (
            <span className="w-12" />
          )}
        </div>

        {step === 'pick' ? (
          /* File picker */
          <div className="flex flex-col items-center justify-center py-16 px-8 gap-4">
            <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-lg font-medium text-gray-700">Select photos</p>
            <p className="text-sm text-gray-400 text-center">
              JPEG, PNG, WebP or GIF · max 30 MB each · up to 10 photos
            </p>
            <FilePickerButton
              multiple
              onFiles={addFiles}
              className="px-5 py-2 bg-brand text-white text-sm font-semibold rounded-lg hover:bg-blue-600 transition-colors"
            >
              Select from computer
            </FilePickerButton>
          </div>
        ) : (
          /* Edit / preview */
          <>
            <div className="relative bg-black aspect-square">
              <img
                src={items[previewIdx]?.preview}
                alt=""
                className="w-full h-full object-contain"
              />
              {items[previewIdx]?.status === 'uploading' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {items.length > 1 && (
              <div className="flex gap-1.5 p-2 bg-gray-50 overflow-x-auto border-b border-gray-100">
                {items.map((item, idx) => (
                  <div key={idx} className="relative flex-shrink-0 group">
                    <button onClick={() => setPreviewIdx(idx)}>
                      <img
                        src={item.preview}
                        alt=""
                        className={`w-14 h-14 object-cover rounded transition-opacity ${
                          idx === previewIdx
                            ? 'ring-2 ring-brand opacity-100'
                            : 'opacity-60 hover:opacity-80'
                        }`}
                      />
                    </button>
                    {item.status === 'uploading' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded pointer-events-none">
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                    {item.status === 'done' && (
                      <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center pointer-events-none">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute inset-0 hidden group-hover:flex items-end justify-between p-0.5 rounded">
                      <button
                        onClick={() => moveItem(idx, -1)}
                        disabled={idx === 0}
                        className="text-white text-xs bg-black/60 rounded px-1 leading-4 disabled:opacity-30"
                      >
                        ‹
                      </button>
                      <button
                        onClick={() => removeItem(idx)}
                        className="text-white text-xs bg-black/60 rounded px-1 leading-4"
                      >
                        ✕
                      </button>
                      <button
                        onClick={() => moveItem(idx, 1)}
                        disabled={idx === items.length - 1}
                        className="text-white text-xs bg-black/60 rounded px-1 leading-4 disabled:opacity-30"
                      >
                        ›
                      </button>
                    </div>
                  </div>
                ))}

                {items.length < 10 && (
                  <FilePickerButton
                    multiple
                    onFiles={addFiles}
                    className="w-14 h-14 flex-shrink-0 bg-gray-200 rounded flex items-center justify-center text-gray-500 hover:bg-gray-300 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </FilePickerButton>
                )}
              </div>
            )}

            <div className="p-4">
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a caption… use @username to mention"
                maxLength={2200}
                rows={3}
                className="w-full text-sm resize-none outline-none placeholder-gray-400"
              />
              <div className="flex items-center justify-between mt-1 border-t border-gray-100 pt-2">
                <span className="text-xs text-gray-400">{caption.length} / 2200</span>
                {items.length < 10 && (
                  <FilePickerButton
                    multiple
                    onFiles={addFiles}
                    className="text-xs text-brand hover:underline"
                  >
                    + Add more photos
                  </FilePickerButton>
                )}
              </div>
              {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
