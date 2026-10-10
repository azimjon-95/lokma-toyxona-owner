import React, { createContext, useContext, useMemo, useState } from 'react';
import type { VenueApplication } from '../types';
import type { PickedImage } from '../services/upload';

const EMPTY: VenueApplication = {
  name: '',
  address: '',
  phone: '',
  halls: 1,
  capacity: 100,
  services: ['Oshpaz', 'Ofitsiant'],
  photos: [],
};

interface Ctx {
  draft: VenueApplication;
  /** Qurilmadan tanlangan rasmlar — ariza yuborilganda Cloudinary'ga yuklanadi (draft.photos — public_id'lar) */
  images: PickedImage[];
  setImages: (f: (prev: PickedImage[]) => PickedImage[]) => void;
  update: (patch: Partial<VenueApplication>) => void;
  reset: () => void;
}

const VenueApplyContext = createContext<Ctx | null>(null);

/** Ariza qadamlar orasida ma'lumot yo'qolmasligi uchun umumiy draft. */
export function VenueApplyProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<VenueApplication>(EMPTY);
  const [images, setImagesState] = useState<PickedImage[]>([]);
  const value = useMemo<Ctx>(
    () => ({
      draft,
      images,
      setImages: (f) => setImagesState(f),
      update: (patch) => setDraft((d) => ({ ...d, ...patch })),
      reset: () => { setDraft(EMPTY); setImagesState([]); },
    }),
    [draft, images]
  );
  return <VenueApplyContext.Provider value={value}>{children}</VenueApplyContext.Provider>;
}

export function useVenueApply() {
  const ctx = useContext(VenueApplyContext);
  if (!ctx) throw new Error('useVenueApply must be used within VenueApplyProvider');
  return ctx;
}
