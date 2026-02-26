import { useEffect, useState } from 'react';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import type {} from '@tauri-apps/plugin-process';

// Checks for updates on mount and every 4 hours.
// Shows a non-blocking toast when an update is ready.
export function UpdatePrompt() {
  const [updateReady, setUpdateReady] = useState(false);
  const [installing, setInstalling] = useState(false);

  async function checkForUpdate() {
    try {
      const update = await check();
      if (update?.available) {
        await update.downloadAndInstall();
        setUpdateReady(true);
      }
    } catch {
      // Silently ignore update errors in dev
    }
  }

  useEffect(() => {
    checkForUpdate();
    const id = setInterval(checkForUpdate, 4 * 60 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  if (!updateReady) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 flex items-center gap-3 text-sm">
      <span>A new version is ready.</span>
      <button
        onClick={async () => {
          setInstalling(true);
          await relaunch();
        }}
        disabled={installing}
        className="font-semibold text-brand hover:underline disabled:opacity-40"
      >
        {installing ? 'Restarting…' : 'Restart now'}
      </button>
    </div>
  );
}
