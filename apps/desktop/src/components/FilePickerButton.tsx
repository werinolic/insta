import { open } from '@tauri-apps/plugin-dialog';
import { readFile } from '@tauri-apps/plugin-fs';

export interface PickedFile {
  name: string;
  blob: Blob;
  mimeType: string;
  preview: string;
}

const MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  heic: 'image/heic',
};

function mimeFromName(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return MIME_BY_EXT[ext] ?? 'application/octet-stream';
}

interface FilePickerButtonProps {
  multiple?: boolean;
  onFiles: (files: PickedFile[]) => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function FilePickerButton({
  multiple = false,
  onFiles,
  disabled,
  className = '',
  children,
}: FilePickerButtonProps) {
  async function handleClick() {
    const result = await open({
      multiple,
      filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic'] }],
    });
    if (!result) return;

    const paths = Array.isArray(result) ? result : [result];
    const picked: PickedFile[] = await Promise.all(
      paths.map(async (p) => {
        const bytes = await readFile(p);
        const name = p.split('/').pop() ?? p.split('\\').pop() ?? 'file';
        const mimeType = mimeFromName(name);
        const blob = new Blob([bytes], { type: mimeType });
        const preview = URL.createObjectURL(blob);
        return { name, blob, mimeType, preview };
      }),
    );

    onFiles(picked);
  }

  return (
    <button onClick={handleClick} disabled={disabled} className={className}>
      {children}
    </button>
  );
}
