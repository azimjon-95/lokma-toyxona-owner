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

### Server bilan ishlash
Server: **[lokma-toyxonalar-server](https://github.com/azimjon-95/lokma-toyxonalar-server)** (`/api/owner-app`, shartnoma — serverdagi `docs/OWNER_APP_API.md`).

```bash
cp .env.example .env            # EXPO_PUBLIC_API_URL=https://api.lokma.uz
npx expo start --clear          # o'zgaruvchi o'zgargach keshni tozalang (Metro eski qiymatni eslab qoladi)
```
- Kirish: telefon + parol (egasi akkauntini administrator yaratadi: `PUT /api/admin/venues/:id/account`, xodimni egasi ilovadan qo'shadi).
- Egasi va xodim bir telefonda bo'lsa — rol tanlash ekrani; bitta rol bo'lsa to'g'ridan-to'g'ri kiradi.
- **Xodim pulni ko'rmaydi:** server pul maydonlarini javobdan olib tashlaydi; ilova ham Moliya, to'lov va menyu yozishni yashiradi.
- 401 (parol almashgan, hisob o'chirilgan, to'yxona bloklangan) — ilova avtomatik chiqadi.
- **Rasmlar (Cloudinary):** server kalitlari `CLOUDINARY_*` bilan sozlanadi (ilovada kalit yo'q). Rasm qurilmada ≤1600 px ga siqiladi va
  server imzolagan chipta bilan to'g'ridan-to'g'ri Cloudinary'ga yuklanadi; so'ng `public_id` serverga ro'yxatdan o'tadi.
  Joylari: Boshqa → To'yxona rasmlari, taom va menyu rasmi, yangi to'yxona arizasi.
- Vercel (web): `EXPO_PUBLIC_API_URL` ni Environment Variables'ga qo'shing, serverda `CORS_ORIGINS` ga domenni yozing, so'ng Redeploy.

### Demo rejim
`EXPO_PUBLIC_API_URL` berilmasa ilova demo rejimda ishlaydi (server qoidalarini xotirada taqlid qiladi):
- istalgan telefon raqam (9 raqam) va kamida 4 belgili parol;
- keyin rol tanlanadi (To'yxona egasi / Xodim);
- demo ma'lumotlar bugungi sanaga nisbatan yaratiladi, ilova yopilganda yo'qoladi.

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
- **Ma'lumot qatlami:** ekranlar faqat `backend` (`src/services/api.ts`) bilan ishlaydi: `serverBackend` (haqiqiy server) yoki `demoBackend`. Server javoblari `services/mappers.ts` da ilova turlariga o'giriladi; keshlash va yangilash — TanStack Query (`DataContext`).

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
