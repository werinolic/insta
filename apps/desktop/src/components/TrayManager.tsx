import { useEffect } from 'react';
import { TrayIcon } from '@tauri-apps/api/tray';
import { useUIStore } from '@/lib/store';

// Keeps the tray icon tooltip in sync with the in-app unread count.
export function TrayManager() {
  const count = useUIStore((s) => s.notificationCount);

  useEffect(() => {
    TrayIcon.getById('main').then((tray) => {
      if (!tray) return;
      // Show unread count in the tray tooltip
      const tooltip = count > 0 ? `Insta (${count} unread)` : 'Insta';
      tray.setTooltip(tooltip).catch(() => {});
    });
  }, [count]);

  return null;
}
