import React, { createContext, useContext, useMemo, useState } from 'react';
import type { VenueApplication } from '../types';

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
  update: (patch: Partial<VenueApplication>) => void;
  reset: () => void;
}

const VenueApplyContext = createContext<Ctx | null>(null);

/** Ariza qadamlar orasida ma'lumot yo'qolmasligi uchun umumiy draft. */
export function VenueApplyProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<VenueApplication>(EMPTY);
  const value = useMemo<Ctx>(
    () => ({
      draft,
      update: (patch) => setDraft((d) => ({ ...d, ...patch })),
      reset: () => setDraft(EMPTY),
    }),
    [draft]
  );
  return <VenueApplyContext.Provider value={value}>{children}</VenueApplyContext.Provider>;
}

export function useVenueApply() {
  const ctx = useContext(VenueApplyContext);
  if (!ctx) throw new Error('useVenueApply must be used within VenueApplyProvider');
  return ctx;
}
