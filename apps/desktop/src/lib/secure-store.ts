import { Store } from '@tauri-apps/plugin-store';

let _store: Store | null = null;

async function getStore(): Promise<Store> {
  if (!_store) {
    _store = await Store.load('auth.bin', { defaults: {}, autoSave: true });
  }
  return _store;
}

export async function secureGet(key: string): Promise<string | null> {
  const store = await getStore();
  const val = await store.get<string>(key);
  return val !== undefined ? val : null;
}

export async function secureSet(key: string, value: string): Promise<void> {
  const store = await getStore();
  await store.set(key, value);
}

export async function secureDelete(key: string): Promise<void> {
  const store = await getStore();
  await store.delete(key);
}

export async function secureClear(): Promise<void> {
  const store = await getStore();
  await store.clear();
}
