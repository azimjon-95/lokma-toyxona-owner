# Lokma To'yxonalar — Owner App

To'yxona egasi va xodimlari uchun mobil boshqaruv ilovasi: bronlar, kalendar, mijozlar, menyu, moliya, xodimlar va yangi to'yxona arizasi.

**Platformalar:** Android (Google Play) · iOS (App Store)
**Stack:** Expo SDK 57 · React Native 0.86 (New Architecture) · React 19 · TypeScript (strict) · Expo Router (typed routes)

## Ishga tushirish

```bash
npm install
npx expo start          # Expo Go yoki development build
npm run check           # TypeScript + ESLint
npx expo-doctor         # bog'liqliklar mosligi
```

### Demo rejim
`EXPO_PUBLIC_API_URL` berilmasa ilova demo rejimda ishlaydi:
- istalgan telefon raqam (9 raqam) va kamida 4 belgili parol;
- keyin rol tanlanadi (To'yxona egasi / Xodim);
- demo ma'lumotlar bugungi sanaga nisbatan yaratiladi.

## Ekranlar (dizayn bo'yicha)

| # | Ekran | Fayl |
|---|-------|------|
| 1 | Login | `app/(auth)/login.tsx` |
| 2 | Parolni tiklash (SMS kod + yangi parol) | `app/(auth)/forgot-password.tsx` |
| 3 | Rol tanlash | `app/(auth)/role.tsx` |
| 4 | Bosh sahifa | `app/(tabs)/index.tsx` |
| 5 | Kalendar (oy, statuslar, kun tadbirlari) | `app/(tabs)/calendar.tsx` |
| 6 | Bronlar (filtrlar) | `app/(tabs)/bookings.tsx` |
| 7 | Bron tafsiloti (Ma'lumot / Menyu / To'lovlar / Xodimlar) | `app/booking/[id].tsx` |
| — | Yangi bron / tahrirlash, To'lov qabul qilish | `app/booking/new.tsx`, `app/booking/payment.tsx` |
| 8 | Mijozlar (qidiruv) | `app/(tabs)/clients.tsx` |
| 9 | Moliya (faqat ega) | `app/finance.tsx` |
| 10 | Menyu paketlari / Taomlar | `app/(tabs)/menu.tsx`, `app/menu/*` |
| 11 | Xodimlar | `app/staff.tsx` |
| 12 | Yangi to'yxona arizasi (3 qadam + tasdiq) | `app/venue-apply/*` |

## Arxitektura

```
app/                     Expo Router ekranlari (Stack.Protected bilan himoyalangan)
src/
  components/ui/         Button, Input/PhoneInput, Card, Tabs, Badge, Logo, DateTimeField ...
  components/            BookingCard, HallBanner, FoodThumb, ApplyCard
  context/               AuthContext (SecureStore sessiya), DataContext, VenueApplyContext
  services/api.ts        API qatlami (demo ↔ real backend bitta joyda)
  services/storage.ts    Keychain / Keystore
  theme/                 Dizayn tokenlari (ranglar, radius, soyalar)
  utils/                 Formatlash (so'm, telefon, sana), tel:/Telegram havolalari
```

- **Auth guard:** `Stack.Protected` — tizimga kirmagan foydalanuvchi ichki sahifalarga deep-link orqali ham kira olmaydi; Moliya va Menyu qo'shish faqat `owner` uchun.
- **Sessiya:** token Keychain/Keystore'da (`AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`) saqlanadi, ilova qayta ochilganda tiklanadi.
- **Backend ulash:** `EXPO_PUBLIC_API_URL` ni o'rnating va `src/services/api.ts` dagi endpointlarni serverga moslang. Bronlar/to'lovlar hozircha `DataContext` da (xotirada) — keyingi bosqichda shu context API chaqiruvlariga (masalan, TanStack Query) o'tkaziladi.

## Store tayyorgarligi

**Umumiy**
- Brend ikonkalar: `assets/images/` (iOS 1024×1024 shaffofsiz, Android adaptive + monochrome, splash).
- `userInterfaceStyle: light`, faqat portret.

**Android (Google Play)**
- `package`: `uz.lokma.toyxona.owner`, **targetSdk 36 / compileSdk 36** (Play'ning 2026 talabi), minSdk 24, AAB.
- Edge-to-edge (Android 15+ majburiy) — barcha ekranlar `react-native-safe-area-context` bilan.
- Ruxsatlar minimal: galereya uchun tizim **Photo Picker** ishlatiladi, shuning uchun `READ_MEDIA_IMAGES`, `CAMERA`, `RECORD_AUDIO` va eski storage ruxsatlari `blockedPermissions` orqali olib tashlangan (Play "Photo and Video Permissions" siyosati).
- Play Console: Data safety formasi, Privacy Policy URL (`src/config.ts`), kontent reytingi.

**iOS (App Store)**
- `bundleIdentifier`: `uz.lokma.toyxona.owner`, iPhone only.
- `ITSAppUsesNonExemptEncryption: false` (eksport hujjatlari so'ralmaydi).
- `NSPhotoLibraryUsageDescription` mavjud; kamera ishlatilmaydi.
- **Hisobni o'chirish** ilova ichida (Boshqa → Hisobni o'chirish) — Guideline 5.1.1(v).
- Maxfiylik siyosati, Foydalanish shartlari va Yordam havolalari ilova ichida.
- Review uchun demo login ma'lumotlarini App Review Notes'ga yozing.

## Build va yuklash (EAS)

```bash
npm install -g eas-cli
eas login
eas init                       # extra.eas.projectId ni avtomatik qo'shadi
npm run build:android          # production .aab
npm run build:ios              # production .ipa
npm run submit:android         # google-service-account.json kerak (git'ga qo'shilmaydi)
npm run submit:ios             # eas.json -> submit.production.ios.ascAppId ni to'ldiring
```

Versiyalar `appVersionSource: remote` + `autoIncrement` orqali EAS'da boshqariladi (versionCode / buildNumber qo'lda o'zgartirilmaydi).

### Releasedan oldin to'ldirish kerak
- `src/config.ts` — haqiqiy Privacy Policy / Terms URL, support telefon va Telegram.
- `eas.json` — `ascAppId`.
- Backend tayyor bo'lsa — `EXPO_PUBLIC_API_URL` (EAS env).
- Zal/taom rasmlari backend'dan kelganda `HallBanner` / `FoodThumb` o'rniga `expo-image`.
