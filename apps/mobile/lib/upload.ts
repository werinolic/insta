import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
// expo-file-system v19 moved uploadAsync to the legacy submodule
import { uploadAsync, FileSystemUploadType } from 'expo-file-system/legacy';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface UploadResult {
  key: string;
  url: string;
  thumbnailUrl: string;
  mediumUrl: string;
  width: number | null;
  height: number | null;
}

export async function pickImages(): Promise<ImagePicker.ImagePickerAsset[] | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: true,
    selectionLimit: 10,
    quality: 1,
  });

  if (result.canceled) return null;
  return result.assets;
}

export async function uploadAsset(asset: ImagePicker.ImagePickerAsset): Promise<UploadResult> {
  const token = await SecureStore.getItemAsync('accessToken');
  const filename = asset.uri.split('/').pop() ?? 'photo.jpg';
  const mimeType = asset.mimeType ?? 'image/jpeg';

  const response = await uploadAsync(
    `${API_URL}/upload?purpose=post&filename=${encodeURIComponent(filename)}`,
    asset.uri,
    {
      httpMethod: 'POST',
      uploadType: FileSystemUploadType.BINARY_CONTENT,
      headers: {
        'Content-Type': mimeType,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    },
  );

  if (response.status !== 200) {
    throw new Error(`Upload failed: ${response.status}`);
  }

  return JSON.parse(response.body) as UploadResult;
}

export async function uploadAvatar(uri: string, mimeType: string): Promise<UploadResult> {
  const token = await SecureStore.getItemAsync('accessToken');
  const filename = uri.split('/').pop() ?? 'avatar.jpg';

  const response = await uploadAsync(
    `${API_URL}/upload?purpose=avatar&filename=${encodeURIComponent(filename)}`,
    uri,
    {
      httpMethod: 'POST',
      uploadType: FileSystemUploadType.BINARY_CONTENT,
      headers: {
        'Content-Type': mimeType,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    },
  );

  if (response.status !== 200) {
    throw new Error(`Upload failed: ${response.status}`);
  }

  return JSON.parse(response.body) as UploadResult;
}
