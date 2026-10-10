import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import type { UploadPurpose, UploadTicket } from '../types';
import { ApiError } from './http';
import { backend } from './api';

/*
 * ═══ RASM YUKLASH (Cloudinary) ═══
 *   1) tizim Photo Picker'dan rasm tanlanadi (ruxsat so'ralmaydi);
 *   2) qurilmada 1600 px gacha kichraytiriladi va JPEG ~82% ga siqiladi (trafik va Cloudinary hajmi tejaladi);
 *   3) server imzolagan chipta bilan to'g'ridan-to'g'ri Cloudinary'ga yuklanadi (progress bilan);
 *   4) public_id server ro'yxatiga qo'shiladi (backend.addPhoto / createDish / ...).
 * Demo rejimda yuklash o'rniga rasm manzili xotirada saqlanadi.
 */
export const MAX_SIDE = 1600;
const JPEG_QUALITY = 0.82;

export interface PickedImage { uri: string; width: number; height: number }

/** Galereyadan rasm(lar) tanlash */
export async function pickImages(limit: number): Promise<PickedImage[]> {
  if (limit <= 0) return [];
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: limit > 1,
    selectionLimit: limit,
    quality: 1, // siqishni o'zimiz qilamiz (bir marta)
  });
  if (res.canceled) return [];
  return res.assets.slice(0, limit).map((a) => ({ uri: a.uri, width: a.width, height: a.height }));
}

/** Uzun tomoni MAX_SIDE dan oshsa kichraytiradi; har doim JPEG ga o'tkazadi (HEIC ham) */
export async function prepareImage(img: PickedImage): Promise<string> {
  const ctx = ImageManipulator.manipulate(img.uri);
  const longest = Math.max(img.width, img.height);
  if (longest > MAX_SIDE) ctx.resize(img.width >= img.height ? { width: MAX_SIDE } : { height: MAX_SIDE });
  const rendered = await ctx.renderAsync();
  const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: JPEG_QUALITY });
  return saved.uri;
}

/** Cloudinary'ga multipart POST (XHR — yuklash progressi uchun). Xato xabarini Cloudinary javobidan oladi. */
export function postToCloudinary(ticket: UploadTicket, file: { uri: string }, onProgress?: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    (async () => {
      const form = new FormData();
      for (const [k, v] of Object.entries(ticket.fields)) form.append(k, v);
      if (Platform.OS === 'web') {
        const blob = await (await fetch(file.uri)).blob();
        form.append('file', blob, 'photo.jpg');
      } else {
        form.append('file', { uri: file.uri, name: 'photo.jpg', type: 'image/jpeg' } as unknown as Blob);
      }
      const xhr = new XMLHttpRequest();
      xhr.open('POST', ticket.uploadUrl);
      xhr.timeout = 60_000;
      xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100)); };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) return resolve();
        let msg = 'Rasm yuklanmadi';
        try { msg = JSON.parse(xhr.responseText)?.error?.message ?? msg; } catch { /* matn emas */ }
        reject(new ApiError(msg, xhr.status, 'upload_failed'));
      };
      xhr.onerror = () => reject(new ApiError("Internet aloqasini tekshiring va qayta urinib ko'ring", 0, 'network'));
      xhr.ontimeout = () => reject(new ApiError('Yuklash juda uzoq davom etdi', 0, 'timeout'));
      xhr.send(form);
    })().catch(reject);
  });
}

export type UploadKind = UploadPurpose | 'application';

/**
 * Bitta rasmni tayyorlaydi va yuklaydi → Cloudinary public_id.
 * Tarmoq xatosida bir marta qayta uriniladi (yangi imzo bilan).
 */
export async function uploadImage(kind: UploadKind, img: PickedImage, onProgress?: (pct: number) => void): Promise<string> {
  const sign = () => (kind === 'application' ? backend.signApplicationUpload() : backend.signUpload(kind));
  let ticket = await sign();
  // Demo rejim: haqiqiy yuklash yo'q, rasm qurilmadagi manzilda qoladi
  if (ticket.uploadUrl.startsWith('demo://')) return `demo:${img.uri}`;
  const file = { uri: await prepareImage(img) };
  try {
    await postToCloudinary(ticket, file, onProgress);
  } catch (e) {
    if (!(e instanceof ApiError) || e.code !== 'network') throw e;
    ticket = await sign();
    await postToCloudinary(ticket, file, onProgress);
  }
  return ticket.publicId;
}
