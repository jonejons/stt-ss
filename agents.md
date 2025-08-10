

# **Texnik Topshiriq (TZ): Sector Staff v2.1 (Multi-Organization, NestJS — Modular Monolith)**

Versiya: 2.1 (Tashkilot-Filial-Bo'lim modeli va ilg'or arxitektura tamoyillari)  
Sana: 10.08.2025  
Hujjat Maqomi: Yakuniy, Tasdiqlangan

---

## **1\. Kirish va Arxitektura Tamoyillari**

### **1.1. Tizimning Umumiy Ko'rinishi va Maqsadi**

Ushbu hujjat **Sector Staff v2.1** tizimining yakuniy texnik topshirig'ini (TZ) belgilaydi. U barcha oldingi versiyalarni bekor qiladi va loyihani ishlab chiqish uchun yagona haqiqat manbai (single source of truth) bo'lib xizmat qiladi.

Tizim ko'p tashkilotli (multi-organization) kirishni boshqarish va davomatni hisobga olish uchun mo'ljallangan modulli monolit dastur hisoblanadi. U qat'iy ierarxik ma'lumotlar modeliga amal qiladi: **Tizim \-\> Tashkilot \-\> Filial \-\> Bo'lim**. Tizimning asosiy maqsadi har bir tashkilot uchun ma'lumotlar izolyatsiyasini to'liq ta'minlash, shu bilan birga tashkilot ichidagi murakkab ierarxik tuzilmalarni samarali boshqarish imkonini berishdir. Ushbu hujjat sun'iy intellekt (AI) kod generatori yoki ishlab chiquvchilar jamoasi tomonidan to'liq va avtomatlashtirilgan tarzda tizimni yaratish uchun asos bo'lishi kerak.

### **1.2. Asosiy Arxitektura Ustunlari**

Tizimning barqarorligi, kengaytiriluvchanligi va xavfsizligini ta'minlash uchun quyidagi me'moriy tamoyillarga qat'iy rioya qilinadi:

* **Modulli Monolit (Modular Monolith):** Dastur bitta joylashtiriladigan birlik (single deployable unit) sifatida yaratiladi, ammo ichki jihatdan bir-biriga bog'liqligi past bo'lgan, domen yo'naltirilgan modullarga (masalan, Auth, Organization, Employee) ajratiladi. Ushbu yondashuv ishlab chiqish jarayonining soddaligini va mantiqiy mas'uliyatlarni ajratishni muvozanatlashtiradi, kelajakda zarurat tug'ilganda mikroxizmatlarga o'tish uchun zamin yaratadi.  
* **Ierarxik Ma'lumotlarni Cheklash va Izolyatsiya qilish (Hierarchical Data Scoping and Isolation):** Bu arxitekturaning tamal toshidir. Ma'lumotlarga kirish Organization darajasida qat'iy nazorat qilinadi va izolyatsiya qilinadi. Hech bir foydalanuvchi yoki xizmat o'ziga belgilangan tashkilot chegarasidan tashqaridagi ma'lumotlarga kira olmaydi. Ushbu cheklov autentifikatsiya himoya qatlami (authentication guard layer) darajasida majburiy ravishda amalga oshiriladi.  
* **Hodisalarga Asoslangan va Asinxron Qayta Ishlash (Event-Driven and Asynchronous Processing):** Ko'p vaqt talab qiladigan yoki muhim bo'lmagan vazifalar (masalan, hisobotlarni yaratish, qurilma hodisalarini qayta ishlash, bildirishnomalarni yuborish) fon vazifalari navbatiga (BullMQ) yuklanadi. Bu API endpointlarining javob berish qobiliyatini yuqori darajada saqlashni va tizimning qayta ishlashdagi keskin o'zgarishlarga chidamliligini ta'minlaydi.1  
* **Holatsiz Xizmatlar va JWT asosidagi Autentifikatsiya (Stateless Services and JWT-based Authentication):** API holatsiz (stateless) bo'ladi. So'rovni avtorizatsiya qilish uchun zarur bo'lgan barcha kontekst (userId, organizationId, branchIds, roles) JSON Web Token (JWT) ichida kodlanadi. Bu kengaytirish va yuklamani muvozanatlashni (load balancing) soddalashtiradi, chunki har qanday server nusxasi istalgan so'rovni qayta ishlay oladi.

### **1.3. Maqsad bo'lmagan Vazifalar (Scope Boundaries)**

Quyidagi vazifalar ushbu loyiha doirasiga kirmaydi va AI yoki ishlab chiquvchilar tomonidan amalga oshirilmaydi:

* **Biometrik Moslashtirish Logikasi:** Barmoq izlari yoki yuzlarni solishtirishning asosiy algoritmi loyiha doirasidan tashqarida. Tizim faqat belgilangan IMatchingAdapter interfeysi orqali moslashtirish xizmati bilan o'zaro aloqada bo'ladi.  
* **Qurilmaga Xos API Integratsiyasi:** Uskunalar API'lari bilan to'g'ridan-to'g'ri integratsiya (masalan, Hikvision SDK) loyiha doirasiga kirmaydi. Barcha shunday o'zaro ta'sirlar IDeviceAdapter orqali abstraktlashtiriladi.  
* **Frontend UI/UX:** Ushbu spetsifikatsiya faqat backend tizimi uchun mo'ljallangan.  
* **Uchinchi Tomon Provayderlarini Amalga Oshirish:** SMS, Email va Object Storage provayderlarining real implementatsiyalari loyiha doirasiga kirmaydi. Tizim INotificationAdapter va IStorageAdapter interfeyslariga qarshi quriladi.

## **2\. Tizim Arxitekturasi va Texnologiyalar Steki**

### **2.1. Yuqori Darajali Arxitektura Diagrammasi**

Tizim arxitekturasi quyidagi komponentlar va o'zaro aloqalarni o'z ichiga oladi:

Mijoz (masalan, veb-brauzer yoki mobil ilova) so'rovlarni yuklama muvozanatlagich (Load Balancer) orqali yuboradi. Yuklama muvozanatlagich so'rovlarni NestJS ilovasining mavjud nusxalaridan biriga yo'naltiradi.

1. **NestJS Ilovasi (Modular Monolit):**  
   * **API Gateway/Controllers:** Kiruvchi HTTP so'rovlarini qabul qiladi, autentifikatsiya va avtorizatsiya uchun Guards (himoyachilar) orqali o'tkazadi.  
   * **Services:** Biznes mantiqini o'z ichiga oladi. Ma'lumotlar bazasi bilan PrismaClient orqali, navbatlar bilan BullMQ orqali va boshqa tashqi xizmatlar bilan Adapterlar orqali ishlaydi.  
   * **Event Emitters:** Biznes mantiqi ichida muhim hodisalar yuzaga kelganda (masalan, GUEST\_APPROVED), ularni tizimning ichki hodisalar shinasiga (event bus) chiqaradi.  
   * **Queue Producers:** Asinxron bajarilishi kerak bo'lgan vazifalarni (masalan, RAW\_DEVICE\_EVENTni qayta ishlash) BullMQ navbatiga qo'shadi.  
2. **Ma'lumotlar Saqlash Qatlamlari:**  
   * **PostgreSQL:** Asosiy relyatsion ma'lumotlar bazasi. Barcha asosiy ma'lumotlar (tashkilotlar, foydalanuvchilar, xodimlar va boshqalar) shu yerda saqlanadi. Prisma ORM orqali boshqariladi.  
   * **Redis:** Ikki asosiy vazifani bajaradi:  
     * **BullMQ uchun Broker:** Fon vazifalari uchun navbatlarni boshqaradi.  
     * **Kesh (Cache):** Tez-tez so'raladigan, ammo kam o'zgaradigan ma'lumotlarni (masalan, konfiguratsiyalar) va Idempotency-Key kabi vaqtinchalik holatlarni saqlash uchun ishlatiladi.  
   * **MinIO / S3-ga mos xizmat:** Ob'ektlarni saqlash uchun ishlatiladi. Xom qurilma hodisalari (masalan, yuz skanerlashdan olingan tasvirlar), generatsiya qilingan hisobotlar va boshqa katta hajmli fayllar shu yerda saqlanadi.  
3. **Asinxron Ishlov Beruvchilar (BullMQ Workers):**  
   * Bular NestJS ilovasidan alohida jarayonlar sifatida ishlashi mumkin bo'lgan iste'molchilar (consumers). Ular Redis'dagi navbatlardan vazifalarni olib, ularni fon rejimida bajaradi (masalan, hisobot yaratish, qurilma holatini tekshirish).

Ushbu arxitektura komponentlarning bir-biriga bog'liqligini kamaytiradi, tizimning javob berish qobiliyatini oshiradi va gorizontal kengayish imkonini beradi.

### **2.2. Texnologiyalar Steki Spetsifikatsiyasi**

Loyiha uchun tanlangan texnologiyalar, ularning versiyalari va tanlov sabablari quyidagi jadvalda keltirilgan.

| Texnologiya | Tavsiya etilgan versiya | Tanlov uchun asos |
| :---- | :---- | :---- |
| **Backend Framework** | NestJS (TypeScript) v10.x | Kengaytiriladigan, modulli arxitektura, TypeScript'ni to'liq qo'llab-quvvatlash va mustahkam ekotizim uchun. |
| **ORM** | Prisma v5.x | Kuchli turdagi xavfsizlik, oson migratsiyalar va PostgreSQL bilan yuqori darajadagi integratsiya. |
| **Ma'lumotlar bazasi** | PostgreSQL v15.x | Ishonchliligi, kengaytirilgan SQL imkoniyatlari va murakkab so'rovlarni qo'llab-quvvatlashi uchun. |
| **Navbat (Queue)** | BullMQ (Redis bilan) | Ishonchli, yuqori unumdorlikka ega fon vazifalarini boshqarish, takrorlash strategiyalari va FlowProducer kabi ilg'or xususiyatlar uchun.2 |
| **Kesh (Cache)** | Redis v7.x | Yuqori tezlikdagi kesh, sessiyalarni boshqarish va BullMQ uchun broker sifatida xizmat qilish uchun. |
| **Ob'ektlarni saqlash** | MinIO / S3-ga mos servis | Katta hajmdagi fayllarni saqlash uchun kengaytiriladigan, standartlashtirilgan (S3 API) va iqtisodiy yechim. |
| **Autentifikatsiya** | JWT, Passport.js | Holatsiz (stateless) autentifikatsiya uchun sanoat standarti. Passport.js turli strategiyalarni oson integratsiya qilish imkonini beradi.3 |
| **Testlash** | Jest (unit/integration), Supertest (e2e) | NestJS ekotizimiga chuqur integratsiyalangan, keng qamrovli testlash imkoniyatlari uchun. |
| **CI/CD** | GitHub Actions | Avtomatlashtirilgan testlash, qurish va joylashtirish jarayonlarini soddalashtirish uchun. |
| **Konteynerizatsiya** | Docker, Docker Compose | Ishlab chiqish, testlash va production muhitlari o'rtasida izchillikni ta'minlash uchun. |

### **2.3. Loyiha Tuzilmasi va Modullarni Tashkil etish**

Tizimning manba kodi (src) quyidagi modulli tuzilishga ega bo'ladi. Bu tuzilma mas'uliyatlarni aniq ajratish (separation of concerns) va kod bazasini oson boshqarish imkonini beradi.

src/  
├── app/                     \# Ilovaning asosiy moduli va konfiguratsiyasi  
│   └── app.module.ts  
├── core/                    \# Butun ilova uchun umumiy, asosiy modullar  
│   ├── config/              \# Atrof-muhit o'zgaruvchilari va konfiguratsiya  
│   ├── database/            \# Prisma xizmati va moduli  
│   ├── logger/              \# Strukturaviy loglash xizmati  
│   └── queue/               \# BullMQ modullari va konfiguratsiyasi  
├── shared/                  \# Modullar o'rtasida umumiy bo'lgan resurslar  
│   ├── decorators/          \# Maxsus dekoratorlar (masalan, @User(), @Public())  
│   ├── dto/                 \# Umumiy ma'lumotlar uzatish ob'ektlari (DTO)  
│   ├── enums/               \# Umumiy sanab o'tiladigan turlar (enums)  
│   ├── guards/              \# Umumiy himoyachilar (masalan, RolesGuard, DataScopeGuard)  
│   ├── interfaces/          \# Umumiy interfeyslar  
│   └── utils/               \# Yordamchi funksiyalar  
├── modules/                 \# Domen yo'naltirilgan biznes modullari  
│   ├── auth/                \# Autentifikatsiya va avtorizatsiya  
│   ├── organization/        \# Tashkilotlarni boshqarish  
│   ├── user/                \# Foydalanuvchilarni boshqarish  
│   ├── branch/              \# Filiallarni boshqarish  
│   ├── department/          \# Bo'limlarni boshqarish  
│   ├── employee/            \# Xodimlarni boshqarish  
│   ├── device/              \# Qurilmalarni boshqarish  
│   ├── guest/               \# Mehmonlarni boshqarish  
│   ├── attendance/          \# Davomatni qayd etish va boshqarish  
│   ├── reporting/           \# Hisobotlarni yaratish  
│   ├── audit/               \# Audit jurnallarini yuritish  
│   └── integration/         \# Tashqi tizimlar uchun adapterlar  
│       ├── adapters/        \# Adapter interfeyslari  
│       └── stubs/           \# Adapterlarning soxta (stub) implementatsiyalari  
└── main.ts                  \# Ilovaning kirish nuqtasi

## **3\. Ma'lumotlar Bazasi Sxemasi va Modellari (Prisma)**

### **3.1. To'liq schema.prisma Ta'rifi**

Quyida tizim uchun yakuniy va to'liq Prisma sxemasi keltirilgan. Ushbu sxema ma'lumotlar yaxlitligini, munosabatlarning to'g'riligini va so'rovlar unumdorligini ta'minlash uchun sinchkovlik bilan ishlab chiqilgan.

#### **3.1.1. BRANCH\_MANAGER Rolini To'g'ri Modellashtirish**

Dastlabki texnik topshiriqda BRANCH\_MANAGER roli OrganizationUser modelidagi managedBranchId maydoni orqali bitta filialga bog'langan edi. Bu yondashuv biznes talablariga mos kelmaydi, chunki JWT tokenidagi branchIds massivi menejerning bir nechta filialni boshqarishi mumkinligini nazarda tutadi. Ushbu nomuvofiqlikni bartaraf etish va tizimni kengaytiriladigan qilish uchun "ko'pdan-ko'pga" (many-to-many) munosabatini aniq (explicit) bog'lanish jadvali orqali modellashtirish zarur. Bu yondashuv Prisma hujjatlarida tavsiya etilgan va ma'lumotlar bazasi darajasida mantiqiy to'g'rilikni ta'minlaydi.5

Ushbu muammoni hal qilish uchun OrganizationUser modelidan managedBranchId va managedBranch maydonlari olib tashlanadi va ularning o'rniga OrganizationUser va Branch modellarini bog'laydigan yangi ManagedBranch modeli kiritiladi. Bu o'zgarish ma'lumotlar modelini autentifikatsiya mexanizmi bilan to'liq moslashtiradi.

#### **3.1.2. Yakuniy Sxema**

Code snippet

// This is your Prisma schema file,  
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {  
  provider \= "prisma-client-js"  
}

datasource db {  
  provider \= "postgresql"  
  url      \= env("DATABASE\_URL")  
}

// 1\. Asosiy tashkilot modeli  
model Organization {  
  id          String    @id @default(uuid())  
  name        String    @unique  
  description String?  
  createdAt   DateTime  @default(now())  
  updatedAt   DateTime  @updatedAt

  users       OrganizationUser  
  branches    Branch  
  employees   Employee  
  devices     Device  
  guestVisits GuestVisit  
  auditLogs   AuditLog  
}

// 2\. Foydalanuvchilar va ularning rollari  
model User {  
  id           String             @id @default(uuid())  
  email        String             @unique  
  passwordHash String  
  fullName     String?  
  isActive     Boolean            @default(true)  
  createdAt    DateTime           @default(now())  
  updatedAt    DateTime           @updatedAt

  organizationLinks OrganizationUser  
  auditLogs         AuditLog  
}

model OrganizationUser {  
  id             String       @id @default(uuid())  
  user           User         @relation(fields: \[userId\], references: \[id\], onDelete: Cascade)  
  userId         String  
  organization   Organization @relation(fields: \[organizationId\], references: \[id\], onDelete: Cascade)  
  organizationId String  
  role           Role

  // Bu foydalanuvchi qaysi filial(lar)ni boshqarishini ko'rsatuvchi bog'lanish  
  managedBranches ManagedBranch

  createdAt      DateTime     @default(now())

  @@unique(\[userId, organizationId\])  
  @@index(\[organizationId\])  
  @@index(\[userId\])  
}

enum Role {  
  SUPER\_ADMIN  
  ORG\_ADMIN  
  BRANCH\_MANAGER  
  EMPLOYEE  
}

// 3\. Tashkilot filiallari (joylashuvlar)  
model Branch {  
  id             String    @id @default(uuid())  
  organization   Organization @relation(fields: \[organizationId\], references: \[id\], onDelete: Cascade)  
  organizationId String  
  name           String  
  address        String?  
  createdAt      DateTime  @default(now())  
  updatedAt      DateTime  @updatedAt

  departments    Department  
  employees      Employee  
  devices        Device  
  guestVisits    GuestVisit  
    
  // Bu filialni qaysi menejer(lar) boshqarishini ko'rsatuvchi bog'lanish  
  managers       ManagedBranch

  @@unique(\[organizationId, name\])  
  @@index(\[organizationId\])  
}

// 3.1. Menejer va Filial o'rtasidagi ko'pdan-ko'pga bog'lanish jadvali  
model ManagedBranch {  
  id        String       @id @default(uuid())  
  manager   OrganizationUser @relation(fields: \[managerId\], references: \[id\], onDelete: Cascade)  
  managerId String  
  branch    Branch       @relation(fields: \[branchId\], references: \[id\], onDelete: Cascade)  
  branchId  String  
  assignedAt DateTime    @default(now())

  @@unique(\[managerId, branchId\])  
  @@index(\[managerId\])  
  @@index(\[branchId\])  
}

// 4\. Filial ichidagi bo'limlar  
model Department {  
  id        String   @id @default(uuid())  
  branch    Branch   @relation(fields: \[branchId\], references: \[id\], onDelete: Cascade)  
  branchId  String  
  name      String  
  parentId  String?  // Ichki iyerarxiya uchun (o'ziga-o'zi bog'lanish)  
  parent    Department? @relation("DepartmentHierarchy", fields: \[parentId\], references: \[id\], onDelete: SetNull)  
  children  Department @relation("DepartmentHierarchy")  
    
  createdAt DateTime @default(now())  
  updatedAt DateTime @updatedAt

  employees Employee

  @@unique(\[branchId, name\])  
  @@index(\[branchId\])  
}

// 5\. Xodimlar  
model Employee {  
  id             String     @id @default(uuid())  
  organization   Organization @relation(fields: \[organizationId\], references: \[id\], onDelete: Cascade)  
  organizationId String  
  branch         Branch     @relation(fields: \[branchId\], references: \[id\], onDelete: Cascade)  
  branchId       String  
  department     Department? @relation(fields: \[departmentId\], references: \[id\], onDelete: SetNull)  
  departmentId   String?  
    
  firstName      String  
  lastName       String  
  employeeCode   String     // Tashkilot ichida unikal bo'lishi kerak  
  email          String?    @unique  
  phone          String?  
  isActive       Boolean    @default(true)  
    
  createdAt      DateTime   @default(now())  
  updatedAt      DateTime   @updatedAt  
    
  attendances    Attendance

  @@unique(\[organizationId, employeeCode\])  
  @@index(\[organizationId\])  
  @@index(\[branchId\])  
  @@index(\[departmentId\])  
}

// 6\. Qurilmalar  
model Device {  
  id             String       @id @default(uuid())  
  organization   Organization @relation(fields: \[organizationId\], references: \[id\], onDelete: Cascade)  
  organizationId String  
  branch         Branch       @relation(fields: \[branchId\], references: \[id\], onDelete: Cascade)  
  branchId       String

  name           String  
  type           DeviceType  
  ipAddress      String?  
  macAddress     String?      @unique  
  model          String?  
  status         DeviceStatus @default(ONLINE)  
  lastSeenAt     DateTime?  
    
  createdAt      DateTime     @default(now())  
  updatedAt      DateTime     @updatedAt

  events         DeviceEventLog  
  attendances    Attendance

  @@unique(\[organizationId, name\])  
  @@index(\[branchId, status\])  
}

enum DeviceType { CAMERA, CARD\_READER, FINGERPRINT, ANPR, OTHER }  
enum DeviceStatus { ONLINE, OFFLINE, DEGRADED, ERROR }

// 7\. Mehmonlar tashrifi  
model GuestVisit {  
  id                      String    @id @default(uuid())  
  organization            Organization @relation(fields: \[organizationId\], references: \[id\], onDelete: Cascade)  
  organizationId          String  
  branch                  Branch    @relation(fields: \[branchId\], references: \[id\], onDelete: Cascade)  
  branchId                String  
    
  guestName               String  
  guestContact            String?  
  responsibleEmployeeId   String?   // Employee.id  
    
  scheduledEntryTime      DateTime  
  scheduledExitTime       DateTime  
    
  status                  GuestStatus @default(PENDING\_APPROVAL)  
  accessCredentialType    AccessCredentialType  
  accessCredentialHash    String?      // QR-kod yoki vaqtinchalik karta uchun xeshlangan qiymat  
    
  createdByUserId         String    // User.id  
  createdAt               DateTime  @default(now())  
  updatedAt               DateTime  @updatedAt

  attendances             Attendance

  @@index(\[branchId, status\])  
  @@index(\[accessCredentialHash\])  
}

enum GuestStatus { PENDING\_APPROVAL, APPROVED, ACTIVE, COMPLETED, EXPIRED, REJECTED }  
enum AccessCredentialType { QR\_CODE, TEMP\_CARD }

// 8\. Davomat (Attendance)  
model Attendance {  
  id             String       @id @default(uuid())  
  organizationId String  
  branchId       String  
    
  employee       Employee?    @relation(fields: \[employeeId\], references: \[id\], onDelete: SetNull)  
  employeeId     String?  
  guestVisit     GuestVisit?  @relation(fields: \[guestId\], references: \[id\], onDelete: SetNull)  
  guestId        String?  
  device         Device?      @relation(fields: \[deviceId\], references: \[id\], onDelete: SetNull)  
  deviceId       String?  
    
  eventType      AttendanceEventType  
  timestamp      DateTime     @default(now())  
  meta           Json?        // Qo'shimcha ma'lumotlar (masalan, harorat)  
    
  createdAt      DateTime     @default(now())

  @@index(\[organizationId, employeeId, timestamp\])  
  @@index(\[organizationId, guestId, timestamp\])  
}

enum AttendanceEventType { CHECK\_IN, CHECK\_OUT, GUEST\_CHECK\_IN, GUEST\_CHECK\_OUT, MANUAL\_ENTRY }

// 9\. Hodisalar va Audit jurnallari  
model DeviceEventLog {  
  id             String    @id @default(uuid())  
  organizationId String  
  deviceId       String  
  device         Device    @relation(fields: \[deviceId\], references: \[id\], onDelete: Cascade)  
    
  eventType      String    // Masalan, "face.scan", "card.read"  
  timestamp      DateTime  
  rawPayloadUrl  String?   // S3/MinIO'dagi xom ma'lumotga havola  
  metadata       Json?     // Qayta ishlangan ma'lumotlar  
  isProcessed    Boolean   @default(false)  
    
  createdAt      DateTime  @default(now())

  @@index(\[organizationId, deviceId, timestamp\])  
}

model AuditLog {  
  id             String       @id @default(uuid())  
  organizationId String?  
  organization   Organization? @relation(fields: \[organizationId\], references: \[id\], onDelete: SetNull)  
    
  userId         String  
  user           User         @relation(fields: \[userId\], references: \[id\], onDelete: Cascade)  
    
  action         String       // Masalan: "CREATE\_EMPLOYEE"  
  entity         String       // "Employee"  
  entityId       String?  
  oldValue       Json?  
  newValue       Json?  
    
  createdAt      DateTime     @default(now())

  @@index(\[organizationId, userId, createdAt\])  
}

#### **3.1.3. Ma'lumotlar Yaxlitligi va Unumdorlik**

* **Aloqalarni O'chirish Siyosati (onDelete):**  
  * onDelete: Cascade qaram bo'lgan ma'lumotlarning mantiqan asosiy ob'ekt bilan birga o'chirilishini ta'minlash uchun ishlatiladi. Masalan, Organization o'chirilganda, unga tegishli barcha Branch, Employee va boshqa yozuvlar avtomatik ravishda o'chiriladi. Bu "yetim" yozuvlarning paydo bo'lishini oldini oladi.  
  * onDelete: SetNull esa qaramlik majburiy bo'lmagan hollarda ishlatiladi. Masalan, Department o'chirilganda, unga bog'langan Employee yozuvlari o'chirilmaydi, faqat ularning departmentId maydoni null ga o'zgartiriladi. Bu xodim ma'lumotlarini saqlab qolish imkonini beradi.  
* **Indekslash (@@index, @unique):**  
  * Sxemada tez-tez filtrlanadigan va qidiriladigan maydonlar uchun indekslar (@@index) qo'shilgan. Ayniqsa, organizationId, branchId, userId kabi maydonlar bo'yicha indekslash ko'p ijarachili (multi-tenant) tizimlarda so'rovlar unumdorligini keskin oshiradi.  
  * Unikallikni ta'minlovchi cheklovlar (@unique, @@unique) ma'lumotlar bazasi darajasida ma'lumotlar to'g'riligini kafolatlaydi (masalan, bir xil organizationId ichida ikkita bir xil employeeCode bo'lishi mumkin emas).

## **4\. Autentifikatsiya, Avtorizatsiya va Xavfsizlik**

### **4.1. JWT Tuzilmasi va Talablari (Access & Refresh Tokens)**

Tizim ikki turdagi JWT tokenlaridan foydalanadi: qisqa muddatli accessToken va uzoq muddatli refreshToken.

* **accessToken Payload:** Har bir autentifikatsiyalangan so'rovda foydalaniladigan ushbu token quyidagi talablarni (claims) o'z ichiga oladi. Bu talablar har bir so'rovni qayta ishlash uchun zarur bo'lgan to'liq kontekstni ta'minlaydi va ma'lumotlar bazasiga qo'shimcha so'rovlar sonini kamaytiradi.  
  JSON  
  {  
    "sub": "user-uuid",  
    "email": "user@example.com",  
    "organizationId": "org-uuid-or-null",  
    "branchIds": \["branch-uuid-1", "branch-uuid-2"\],  
    "roles":,  
    "permissions": \["employee:create", "employee:read:all", "device:read"\],  
    "iat": 1690000000,  
    "exp": 1690000900  
  }

  * sub: Foydalanuvchining unikal identifikatori (User.id).  
  * organizationId: Foydalanuvchi qaysi tashkilot kontekstida ishlayotganini bildiradi. SUPER\_ADMIN uchun bu qiymat null bo'ladi.  
  * branchIds: BRANCH\_MANAGER roli uchun u boshqaradigan filiallar ID'lari massivi. Bu ma'lumot ManagedBranch jadvalidan olinadi. Boshqa rollar uchun bo'sh massiv bo'ladi.  
  * roles: Foydalanuvchiga tayinlangan rollar ro'yxati (masalan, \`\`).  
  * permissions: Rollarga asoslanib berilgan ruxsatlar ro'yxati. Bu RolesGuard tomonidan tezkor tekshirish uchun ishlatiladi.  
  * exp: Tokenning yaroqlilik muddati (masalan, 15 daqiqa).  
* **refreshToken:** accessTokenning yaroqlilik muddati tugaganda yangisini olish uchun ishlatiladi. U faqat foydalanuvchi sub va token versiyasini o'z ichiga oladi va yaroqlilik muddati ancha uzoqroq (masalan, 7 kun) bo'ladi.

### **4.2. Token Hayot Sikli va Boshqaruvi**

1. **Login (/api/v1/auth/login):** Foydalanuvchi email va password bilan tizimga kiradi. Muvaffaqiyatli autentifikatsiyadan so'ng, tizim yangi accessToken va refreshToken juftligini yaratadi va qaytaradi.  
2. **Tokenni Yangilash (/api/v1/auth/refresh):** accessToken muddati tugagach, mijoz refreshTokenni ushbu endpointga yuboradi. Tizim refreshTokenning haqiqiyligini va bekor qilinmaganligini (Redis'dagi denylist'da yo'qligini) tekshiradi. Agar haqiqiy bo'lsa, yangi accessToken va refreshToken juftligini qaytaradi. Bu jarayon "refresh token rotation" deb ataladi va xavfsizlikni oshiradi.  
3. **Logout (/api/v1/auth/logout):** Foydalanuvchi tizimdan chiqqanda, uning joriy refreshTokeni Redis'dagi denylistga qo'shiladi. Bu o'g'irlangan refreshToken orqali yangi accessToken olishning oldini oladi.

### **4.3. Rolga Asoslangan Kirishni Boshqarish (RBAC)**

Rollar va ruxsatlar tizimi tizim funksiyalariga kirishni qat'iy nazorat qilish uchun asos bo'lib xizmat qiladi. Quyidagi matritsa har bir rol uchun mavjud bo'lgan ruxsatlarni aniq belgilaydi. Bu matritsa RolesGuard ni amalga oshirish va testlash uchun asosiy hujjat hisoblanadi.

| Ruxsat (Permission) | SUPER\_ADMIN | ORG\_ADMIN | BRANCH\_MANAGER | EMPLOYEE |
| :---- | :---- | :---- | :---- | :---- |
| organization:create | ✅ | ❌ | ❌ | ❌ |
| organization:read:all | ✅ | ❌ | ❌ | ❌ |
| organization:read:self | ✅ | ✅ | ❌ | ❌ |
| organization:update:self | ✅ | ✅ | ❌ | ❌ |
| user:create:org\_admin | ✅ | ❌ | ❌ | ❌ |
| user:manage:org | ✅ | ✅ | ❌ | ❌ |
| branch:create | ❌ | ✅ | ❌ | ❌ |
| branch:read:all | ❌ | ✅ | ✅ | ❌ |
| branch:update:managed | ❌ | ✅ | ✅ | ❌ |
| department:create | ❌ | ✅ | ✅ | ❌ |
| department:manage:all | ❌ | ✅ | ✅ | ❌ |
| employee:create | ❌ | ✅ | ✅ | ❌ |
| employee:read:all | ❌ | ✅ | ✅ | ❌ |
| employee:read:self | ❌ | ✅ | ✅ | ✅ |
| employee:update:all | ❌ | ✅ | ✅ | ❌ |
| employee:delete | ❌ | ✅ | ✅ | ❌ |
| device:create | ❌ | ✅ | ✅ | ❌ |
| device:manage:all | ❌ | ✅ | ✅ | ❌ |
| guest:create | ❌ | ✅ | ✅ | ❌ |
| guest:approve | ❌ | ✅ | ✅ | ❌ |
| report:generate:org | ❌ | ✅ | ❌ | ❌ |
| report:generate:branch | ❌ | ✅ | ✅ | ❌ |
| audit:read:org | ❌ | ✅ | ❌ | ❌ |
| audit:read:system | ✅ | ❌ | ❌ | ❌ |

### **4.4. Maxsus Himoyachilarni (Guards) Amalga Oshirish**

Tizim xavfsizligini ta'minlash uchun ko'p qatlamli himoya yondashuvi qo'llaniladi. Har bir himoyalangan endpointga so'rovlar quyidagi himoyachilar (Guards) zanjiridan o'tadi:

1. **JwtAuthGuard (AuthGuard('jwt')):** Bu NestJS'ning standart Passport himoyachisi bo'lib, Authorization sarlavhasidan accessTokenni ajratib oladi, uning imzosini va yaroqlilik muddatini tekshiradi. Muvaffaqiyatli tekshiruvdan so'ng, u tokendagi payloadni dekodlaydi va request.user ob'ektiga joylashtiradi. Bu keyingi himoyachilar ishlashi uchun asos yaratadi.3  
2. **DataScopeGuard:** Bu tizimning eng muhim xavfsizlik komponentlaridan biridir. Uning yagona vazifasi ma'lumotlar izolyatsiyasini majburiy ta'minlashdir. Bu himoyachi har bir so'rovda request.user ob'ektidan organizationId va branchIds (agar mavjud bo'lsa) qiymatlarini o'qiydi. So'ngra bu qiymatlarni so'rov ob'ektining maxsus maydoniga (request.scope) joylashtiradi. Servis metodlari bu scope ob'ektini parametr sifatida qabul qilishga majbur bo'ladi. Bu yondashuv har bir ishlab chiquvchining ma'lumotlarni filtrlashni eslab qolishiga bog'liqlikni yo'q qiladi va xavfsizlik siyosatini arxitektura darajasida majburiy qiladi. Agar foydalanuvchi ORG\_ADMIN bo'lsa, u faqat o'z tashkiloti ma'lumotlarini ko'ra oladi; agar BRANCH\_MANAGER bo'lsa, u faqat o'ziga biriktirilgan filiallar ma'lumotlarini ko'ra oladi.  
3. **RolesGuard:** Bu himoyachi endpoint uchun talab qilinadigan ruxsatlarni (@Permissions('employee:create') kabi maxsus dekorator orqali olingan) request.user.permissions massividagi mavjud ruxsatlar bilan solishtiradi. Agar kerakli ruxsat topilmasa, so'rov 403 Forbidden xatoligi bilan rad etiladi. Bu RBAC matritsasini amalda tatbiq etadi.7

Ushbu zanjir tokenning haqiqiyligini, so'rovning ma'lumotlar doirasini va foydalanuvchining ruxsatlarini ketma-ket tekshirib, tizimga kirishni har tomonlama nazorat qiladi.

### **4.5. Parolni Xeshlash va Xavfsizlik Siyosati**

* **Xeshlash Algoritmi:** Foydalanuvchi parollari ma'lumotlar bazasida ochiq matn sifatida saqlanmaydi. Buning o'rniga bcrypt kutubxonasidan foydalanib, kuchli tuz (salt) bilan xeshlangan holda saqlanadi. Tuzlash raundlari soni (salt rounds) kamida 12 qilib belgilanadi, bu brute-force hujumlariga qarshi yetarli darajada himoyani ta'minlaydi.9  
* **Parol Siyosati:** Yangi parol yaratishda yoki o'zgartirishda quyidagi minimal talablar DTO (Data Transfer Object) validatsiyasi darajasida tekshiriladi:  
  * Minimal uzunlik: 8 belgi.  
  * Kamida bitta katta harf.  
  * Kamida bitta kichik harf.  
  * Kamida bitta raqam.  
  * Kamida bitta maxsus belgi (masalan, \!@\#$%^&\*).

## **5\. Modulli API Spetsifikatsiyasi (Endpoints)**

Ushbu bo'limda tizimning har bir moduli uchun API endpointlari, ularning talablari va biznes mantiqi batafsil tavsiflanadi. Namuna sifatida DeviceModule va uning eng muhim endpointi batafsil ko'rib chiqiladi.

### **5.6. DeviceModule (/api/v1/devices)**

#### **5.6.1. Modulning Umumiy Tavsifi**

Ushbu modul tashkilot filiallaridagi jismoniy qurilmalarning (kameralar, kartani o'quvchilar va h.k.) hayot siklini boshqarish uchun mas'uldir. Bu qurilmalarni ro'yxatdan o'tkazish, ularning holatini kuzatish va ulardan keladigan hodisalarni qabul qilishni o'z ichiga oladi.

#### **5.6.2. Endpoint: POST /api/v1/events/raw**

* **Tavsif:** Jismoniy qurilmalardan keladigan barcha xom hodisalarni (masalan, yuzni skanerlash, kartani o'qish) qabul qilish uchun asosiy kirish nuqtasi. Ushbu endpoint yuqori o'tkazuvchanlik (high throughput) va ishonchlilik uchun mo'ljallangan. Uning asosiy vazifasi hodisani tezda qabul qilib, navbatga qo'yish va darhol javob qaytarishdir.  
* **Talab qilinadigan Rol(lar):** Yo'q (foydalanuvchi JWT orqali emas, balki qurilmaga xos API kaliti/maxfiy kaliti orqali autentifikatsiya qilinadi). Buning uchun alohida DeviceAuthGuard amalga oshiriladi.  
* **So'rov Sarlavhalari (Request Headers):** Idempotency-Key: \<UUID\> — Majburiy.  
* **So'rov Tanasi (Request Body):** Umumiy hodisa yuki (payload). Masalan:  
  JSON  
  {  
    "eventType": "card.read",  
    "timestamp": "2025-08-10T10:00:00Z",  
    "payload": {  
      "cardId": "HEX\_CARD\_ID",  
      "temperature": 36.6  
    }  
  }

* **Muvaffaqiyatli Javob (202):** 202 Accepted. Javob darhol, so'rov qabul qilinganligini tasdiqlash uchun qaytarilishi kerak. Qayta ishlash asinxron tarzda amalga oshiriladi.  
* **Xatolik Javoblari (4xx, 5xx):** Quyidagi jadvalda ushbu endpoint uchun mumkin bo'lgan xatolik kodlari va ularning sabablari keltirilgan.

| Kod | Sabab | Tavsif |
| :---- | :---- | :---- |
| 400 | Bad Request | Idempotency-Key sarlavhasi yo'q yoki noto'g'ri formatda. |
| 401 | Unauthorized | Qurilmaning API kaliti yaroqsiz. |
| 429 | Too Many Requests | So'rovlar chegarasi (rate limit) oshib ketdi. |
| 503 | Service Unavailable | Navbat xizmati (Redis) ishlamayapti. |

* Batafsil Biznes Mantiqi va Idempotentlik:  
  Ushbu endpoint holatni o'zgartiruvchi ma'lumotlar uchun muhim kirish nuqtasidir. Tarmoqdagi uzilishlar qurilmalarning bir xil hodisani qayta yuborishiga olib kelishi mumkin, bu esa davomat yozuvlarining dublikat bo'lishiga olib keladi. Shu sababli, idempotentlikni amalga oshirish "qo'shimcha qulaylik" emas, balki ma'lumotlar yaxlitligi uchun asosiy talabdir.  
  Bu muammoni hal qilish uchun Stripe API kabi sanoat standartlariga mos keladigan yondashuv qo'llaniladi.11 Mijoz (qurilma) har bir yangi operatsiya uchun unikal  
  Idempotency-Key yaratadi va uni so'rov sarlavhasida yuboradi. Server ushbu kalitdan foydalanib, operatsiya avval bajarilgan yoki bajarilmaganligini tekshiradi.12  
  Endpointning ishlash mantiqi quyidagicha bo'ladi:  
  1. DeviceAuthGuard orqali qurilmani autentifikatsiya qilish.  
  2. Sarlavhadan Idempotency-Key ni ajratib olish. Agar u mavjud bo'lmasa, 400 Bad Request qaytarish.  
  3. Redis'dan ushbu kalit bo'yicha keshdagi javobni tekshirish (GET idempotency:response:\<key\>).  
  4. **Agar kalit bo'yicha javob topilsa:** Keshdagi javobni (masalan, 202 Accepted) darhol qaytarish va keyingi amallarni bajarmaslik. Bu takroriy so'rovlarni samarali boshqaradi.  
  5. Agar kalit topilmasa:  
     a. Poyga holatlarini (race conditions) oldini olish uchun Redis'da qisqa muddatli blokirovka (lock) o'rnatish (SET idempotency:lock:\<key\> "locked" NX EX 60). Agar blokirovka o'rnatish muvaffaqiyatsiz bo'lsa (ya'ni, boshqa bir parallel so'rov blokirovkani o'rnatgan bo'lsa), so'rovni biroz kutib, qayta urinish yoki 409 Conflict qaytarish.  
     b. Kiruvchi xom ma'lumotni (rawPayload) IStorageAdapter orqali S3/MinIO'ga yuklash.  
     c. PostgreSQL'da yangi DeviceEventLog yozuvini yaratish, unda S3'dagi ob'ektga havola (rawPayloadUrl) saqlanadi.  
     d. RAW\_DEVICE\_EVENT nomli vazifani BullMQ'ning events-queue navbatiga qo'shish. Payload DeviceEventLog yozuvining id sini o'z ichiga oladi.  
     e. Navbatga qo'shish muvaffaqiyatli bo'lgach, 202 Accepted javobini Redis'da Idempotency-Key bilan birga saqlash (SET idempotency:response:\<key\> '{"status": 202}' EX 86400).  
     f. O'rnatilgan blokirovkani olib tashlash (DEL idempotency:lock:\<key\>).  
     g. Mijozga 202 Accepted javobini qaytarish.

## **6\. Asinxron Qayta Ishlash va Fon Vazifalari (BullMQ)**

### **6.1. Navbat Arxitekturasi va Konfiguratsiyasi**

Barcha fon vazifalarini bitta navbatda qayta ishlash "head-of-line blocking" muammosiga olib kelishi mumkin bo'lgan keng tarqalgan anti-patterndir. Masalan, katta hajmli hisobotni generatsiya qilish kabi sekin vazifa, real vaqtda qayta ishlanishi kerak bo'lgan muhim qurilma hodisasini bloklab qo'yishi mumkin.

Ushbu muammoning oldini olish uchun tizim domenlarga asoslangan bir nechta alohida navbatlardan foydalanadi. Bu yondashuv har bir vazifa turiga o'zining ustuvorligi va parallel ishlov berish (concurrency) sozlamalarini belgilash imkonini beradi, bu esa tizimning umumiy barqarorligi va javob berish qobiliyatini oshiradi.2

* **events-queue:** Yuqori ustuvorlikka ega. Qurilmalardan keladigan real vaqt hodisalarini qayta ishlash uchun. Concurrency: yuqori (masalan, 10-20).  
* **notifications-queue:** O'rta ustuvorlikka ega. Email va SMS bildirishnomalarini yuborish uchun. Concurrency: o'rta (masalan, 5).  
* **exports-queue:** Past ustuvorlikka ega. Katta hajmli hisobotlarni generatsiya qilish va eksport qilish uchun. Concurrency: past (masalan, 1-2), chunki bu vazifalar ko'p resurs talab qiladi.  
* **system-health-queue:** O'rta ustuvorlikka ega. Qurilma holatini tekshirish, mehmon tokenlarini eskirgan deb belgilash kabi davriy tizim vazifalari uchun.

### **6.2. Vazifa Ta'riflari**

Quyida asosiy fon vazifalari va ularni qayta ishlovchi "worker"larning mantiqi tavsiflanadi.

#### **Vazifa: ProcessRawDeviceEvent (RAW\_DEVICE\_EVENT uchun iste'molchi)**

* **Navbat Nomi:** events-queue.  
* **Worker Mantiqi:**  
  1. Navbatdan DeviceEventLog ID'sini o'z ichiga olgan vazifani oladi.  
  2. Ma'lumotlar bazasidan to'liq log yozuvini yuklaydi.  
  3. Agar kerak bo'lsa, S3/MinIO'dan xom ma'lumotlarni (rawPayloadUrl orqali) yuklab oladi.  
  4. Hodisa ma'lumotlarini tahlil qilib (parse), foydalanuvchini aniqlaydi (masalan, kartadan olingan employeeCode).  
  5. Biznes mantiqini bajaradi: bu CHECK\_IN yoki CHECK\_OUT ekanligini aniqlaydi (masalan, xodimning oxirgi hodisasi turiga qarab).  
  6. Ma'lumotlar bazasida yangi Attendance yozuvini yaratadi.  
  7. Boshqa tizimlar (masalan, bildirishnomalar moduli) iste'mol qilishi uchun ATTENDANCE\_RECORDED hodisasini chiqaradi.  
* Xatoliklarni Boshqarish va Qayta Urinish Strategiyasi:  
  Agar worker vazifani bajarayotganda xatolikka uchrasa (masalan, ma'lumotlar bazasi vaqtincha ishdan chiqqan bo'lsa), vazifani ishonchli tarzda qayta bajarish mexanizmi zarur. Oddiy qayta urinishlar darhol amalga oshiriladi va agar muammo hal bo'lmagan bo'lsa, yana muvaffaqiyatsizlikka uchraydi, bu esa tizimga keraksiz yuklama tug'diradi.  
  Buning o'rniga, BullMQ'ning ilg'or qayta urinish strategiyalaridan foydalaniladi.14 Har bir muhim vazifa uchun quyidagi sozlamalar belgilanadi:  
  * attempts: 5: Vazifani muvaffaqiyatsiz bo'lganidan keyin 5 marta qayta bajarishga urinish.  
  * backoff: Qayta urinishlar orasidagi kechikishni boshqarish strategiyasi.  
    * type: 'exponential': Eksponensial kechikish. Har bir keyingi urinish oldingisidan ikki baravar ko'proq vaqtdan keyin amalga oshiriladi.  
    * delay: 1000: Boshlang'ich kechikish 1000 ms (1 soniya).  
      Bu sozlamalar bilan qayta urinishlar taxminan 1, 2, 4, 8, 16 soniyalik intervallar bilan amalga oshiriladi. Bu quyi tizimga (masalan, ma'lumotlar bazasiga) tiklanish uchun yetarli vaqt beradi. Agar barcha 5 ta urinish muvaffaqiyatsiz tugasa, vazifa failed (muvaffaqiyatsiz) navbatiga o'tkaziladi va administrator tomonidan qo'lda tekshirilishi uchun belgilanadi.

## **7\. Integratsiya va Adapter Qatlami**

### **7.1. Adapter Dizayn Namunasi (Adapter Design Pattern)**

Tizimning asosiy biznes mantiqini tashqi infratuzilma tafsilotlaridan (ma'lumotlar bazalari, xabar yuborish xizmatlari, fayl saqlash joylari) ajratib turish uchun Adapter (yoki Port) dizayn namunasidan foydalaniladi. Bu yondashuv quyidagi afzalliklarni beradi:

* **Testlanuvchanlik:** Biznes mantiqini tashqi xizmatlarning real implementatsiyalarisiz, soxta (mock) adapterlar yordamida izolyatsiyalangan holda testlash imkonini beradi.  
* **Moslashuvchanlik:** Provayderlarni almashtirishni osonlashtiradi. Masalan, fayl saqlash tizimini MinIO'dan AWS S3'ga o'tkazish uchun faqat StorageAdapterning implementatsiyasini o'zgartirish kifoya, biznes mantiqi esa o'zgarishsiz qoladi.

### **7.2. Interfeys Ta'riflari (TypeScript)**

Quyida asosiy adapter interfeyslari va ularning metodlari keltirilgan. AI yoki ishlab chiquvchilar ushbu interfeyslarning soxta (stub) implementatsiyalarini yaratishi kerak.

* IStorageAdapter: Fayllarni saqlash va boshqarish uchun mas'ul.  
  Dastlabki topshiriqda server fayl yuklashlarini o'zi boshqarishi nazarda tutilgan edi. Biroq, katta hajmdagi fayllarni (masalan, video yozuvlar) NestJS serveri orqali yuklash uning tarmoqli kengligi va hisoblash resurslarini band qiladi, bu esa event loop'ni bloklashi mumkin. Bundan tashqari, bu serverga keng qamrovli S3 yozish huquqlarini berishni talab qiladi, bu esa xavfsizlik nuqtai nazaridan nomaqbuldir.  
  Buning o'rniga, sanoatda qabul qilingan eng yaxshi amaliyot – oldindan imzolangan URL'lardan (pre-signed URLs) foydalanishdir.15 Mijoz (yoki bizning holatda, qurilma hodisasini qayta ishlovchi mantiq) serverdan vaqtinchalik, cheklangan huquqlarga ega URL'ni oladi va faylni to'g'ridan-to'g'ri saqlash omboriga (storage bucket) yuklaydi. Bu yuklamani serverdan chetlab o'tadi.  
  TypeScript  
  interface IStorageAdapter {  
    /\*\*  
     \* Faylni to'g'ridan-to'g'ri S3/MinIO'ga yuklash uchun oldindan imzolangan URL yaratadi.  
     \* @param bucket \- Saqlash ombori nomi.  
     \* @param key \- Ob'ektning unikal kaliti (fayl yo'li).  
     \* @param expiresIn \- URL'ning yaroqlilik muddati (soniyalarda).  
     \* @param contentType \- Yuklanadigan faylning MIME turi.  
     \* @returns {Promise\<string\>} Yuklash uchun mo'ljallangan URL.  
     \*/  
    getPresignedUploadUrl(bucket: string, key: string, expiresIn: number, contentType: string): Promise\<string\>;

    /\*\*  
     \* Himoyalangan faylni ko'rish uchun oldindan imzolangan URL yaratadi.  
     \* @param bucket \- Saqlash ombori nomi.  
     \* @param key \- Ob'ektning kaliti.  
     \* @param expiresIn \- URL'ning yaroqlilik muddati (soniyalarda).  
     \* @returns {Promise\<string\>} Ko'rish uchun mo'ljallangan URL.  
     \*/  
    getPresignedDownloadUrl(bucket: string, key: string, expiresIn: number): Promise\<string\>;  
  }

* **INotificationAdapter:** Email va SMS bildirishnomalarini yuborish uchun.  
  TypeScript  
  interface INotificationAdapter {  
    sendEmail(to: string, subject: string, body: string): Promise\<void\>;  
    sendSms(to: string, message: string): Promise\<void\>;  
  }

* **IDeviceAdapter:** Jismoniy qurilmalarga buyruqlar yuborish uchun (masalan, eshikni ochish).  
  TypeScript  
  interface IDeviceAdapter {  
    openDoor(deviceId: string, duration: number): Promise\<boolean\>;  
    updateConfig(deviceId: string, config: Record\<string, any\>): Promise\<boolean\>;  
  }

* **IMatchingAdapter:** Biometrik ma'lumotlarni solishtirish uchun tashqi xizmatga so'rov yuborish uchun.  
  TypeScript  
  interface IMatchingAdapter {  
    requestMatch(template: Buffer): Promise\<{ isMatch: boolean; confidence?: number }\>;  
  }

Har bir stub implementatsiya NotImplementedException xatoligini qaytarishi yoki log yozib, soxta javob qaytarishi kerak (// TODO: Implement real integration here).

## **8\. Audit va Loglash Strategiyasi**

### **8.1. Strukturaviy Loglash (JSON Format)**

Tizimning kuzatuvchanligini (observability) ta'minlash uchun barcha log yozuvlari stdout (standart chiqish oqimi) ga JSON formatida yozilishi shart. Bu yondashuv Datadog, ELK Stack, Splunk kabi zamonaviy log yig'ish platformalari tomonidan loglarni osonlik bilan tahlil qilish va indekslash imkonini beradi. Har bir log yozuvi minimal darajada quyidagi maydonlarni o'z ichiga olishi kerak: timestamp, level (masalan, INFO, ERROR), message, context (masalan, modul nomi) va correlationId (so'rovni kuzatish uchun).

### **8.2. Audit Jurnalini Yuritish**

Tizimdagi barcha muhim o'zgarishlarni kuzatib borish uchun AuditLog jadvaliga yozuvlar avtomatik tarzda qo'shiladi. Bu kim, qachon, qanday o'zgarish qilganini aniqlash imkonini beradi va xavfsizlik tekshiruvlari uchun muhimdir.

Ushbu funksionallikni markazlashtirilgan tarzda amalga oshirish uchun maxsus NestJS Interceptor (AuditLogInterceptor) yaratiladi. Ushbu interceptor barcha o'zgartirish kirituvchi (POST, PATCH, DELETE) endpointlarga global ravishda qo'llaniladi.

**Interceptor Mantiqi:**

1. So'rov kelganda, interceptor request.user.id va boshqa kerakli ma'lumotlarni oladi.  
2. U endpoint'ga yuborilgan ma'lumotlarni (request.body) newValue sifatida saqlaydi.  
3. Agar operatsiya PATCH yoki DELETE bo'lsa, u endpoint'ning asosiy mantiqi ishga tushishidan oldin ma'lumotlar bazasidan o'zgartirilayotgan yoki o'chirilayotgan ob'ektning joriy holatini (oldValue) yuklab oladi.  
4. Endpoint'ning asosiy mantiqi muvaffaqiyatli yakunlangandan so'ng, interceptor AuditLog jadvaliga yangi yozuv qo'shadi. Bu yozuv userId, action (masalan, UPDATE\_EMPLOYEE), entity (Employee), entityId, oldValue va newValue kabi ma'lumotlarni o'z ichiga oladi.

Bu yondashuv audit logikasini biznes mantiqidan to'liq ajratadi va uning barcha kerakli joylarda izchil qo'llanilishini kafolatlaydi.

## **9\. Keng Qamrovli Testlash Strategiyasi**

Tizimning ishonchliligi va to'g'ri ishlashini ta'minlash uchun uch darajali testlash strategiyasi qo'llaniladi: unit, integration va end-to-end (E2E).

### **9.1. Birlik Testlari (Unit Testing \- Jest)**

* **Maqsad:** Biznes mantiqini servislar ichida to'liq izolyatsiyada sinash.  
* **Yondashuv:** Har bir servis metodi uchun alohida testlar yoziladi. Barcha tashqi bog'liqliklar (dependencies), jumladan Prisma va adapterlar, Jest'ning mock funksiyalari (jest.fn(), mockResolvedValue) yordamida to'liq soxtalashtiriladi.19 Bu testlarning tez ishlashini va faqat sinovdan o'tkazilayotgan kod birligiga e'tibor qaratishini ta'minlaydi.

### **9.2. Integratsion Testlar (Integration Testing \- Jest \+ Testcontainers)**

* **Maqsad:** Turli komponentlarning (servislar, Prisma, ma'lumotlar bazasi) birgalikda to'g'ri ishlashini tekshirish.  
* **Yondashuv:** Ma'lumotlar bazasini soxtalashtirish (mocking) real dunyodagi muammolarni (masalan, cheklov buzilishlari, noto'g'ri so'rov mantiqi) yashirishi mumkin. Shu sababli, integratsion testlar **haqiqiy ma'lumotlar bazasida** o'tkazilishi shart.  
  Buni samarali amalga oshirish uchun Testcontainers kutubxonasidan foydalaniladi. Bu kutubxona testlar to'plami ishga tushirilishidan oldin PostgreSQL va Redis kabi xizmatlarning vaqtinchalik (ephemeral) Docker konteynerlarini dasturiy ravishda ishga tushirish imkonini beradi.20  
  Jest uchun global sozlash fayli (jest.setup.ts) quyidagi vazifalarni bajaradi:  
  1. Barcha testlar boshlanishidan oldin (beforeAll) PostgreSQL va Redis konteynerlarini ishga tushiradi.  
  2. prisma migrate deploy buyrug'ini ishga tushirib, test ma'lumotlar bazasida sxemani yaratadi.  
  3. Test ma'lumotlar bazasiga ulangan yagona PrismaClient nusxasini yaratadi va uni barcha test fayllari uchun global miqyosda mavjud qiladi.  
  4. Barcha testlar tugagandan so'ng (afterAll) konteynerlarni to'xtatadi va o'chiradi, bu esa toza test muhitini ta'minlaydi.

### **9.3. To'liq Sikl Testlari (End-to-End Testing \- Supertest \+ Testcontainers)**

* **Maqsad:** Tizimni to'liq yig'ilgan holda, haqiqiy HTTP so'rovlari orqali, foydalanuvchi nuqtai nazaridan sinash.  
* **Yondashuv:** Supertest kutubxonasi yordamida NestJS ilovasiga haqiqiy HTTP so'rovlari yuboriladi. Bu testlar ham Testcontainers yordamida yaratilgan to'liq integratsiyalashgan muhitda (PostgreSQL, Redis bilan) ishlaydi. Quyidagi jadvalda tizimning qabul qilish mezonlarini belgilaydigan eng muhim E2E test stsenariylari keltirilgan.

| ID | Stsenariy Tavsifi | Kutilayotgan Natija |
| :---- | :---- | :---- |
| E2E-01 | **Asosiy Oqim:** SUPER\_ADMIN yangi Tashkilot yaratadi va unga ORG\_ADMIN tayinlaydi. ORG\_ADMIN tizimga kirib, yangi Filial va Bo'lim yaratadi. | Barcha amallar muvaffaqiyatli bajariladi (201 Created, 200 OK). Yaratilgan ob'ektlar GET so'rovlari orqali tekshiriladi. |
| E2E-02 | **Xodim va Davomat:** BRANCH\_MANAGER o'z filialiga yangi Xodim qo'shadi. Keyin /events/raw endpointiga shu xodimning kartasi haqida hodisa yuboriladi. | Xodim muvaffaqiyatli yaratiladi. Hodisa yuborilgandan so'ng, Attendance jadvalida yangi "CHECK\_IN" yozuvi paydo bo'lishi tekshiriladi. |
| E2E-03 | **Mehmon Oqimi:** Mehmon tashrifi yaratiladi, tasdiqlanadi. Keyin uning QR kodi bilan hodisa yuboriladi. | Mehmon statusi APPROVED ga o'zgaradi. QR kod hodisasi yuborilgandan so'ng, Attendance jadvalida GUEST\_CHECK\_IN yozuvi paydo bo'ladi. |
| E2E-04 | **Xavfsizlik (Izolyatsiya):** Org A'ning ORG\_ADMIN'i Org B'dagi xodim ma'lumotlarini (GET /api/v1/employees/:id) olishga harakat qiladi. | 404 Not Found xatoligi qaytariladi. Bu ma'lumot sizdirilishini oldini olish uchun 403 Forbidden o'rniga ishlatiladi. |
| E2E-05 | **Xavfsizlik (Ruxsat):** EMPLOYEE roli bilan tizimga kirgan foydalanuvchi yangi xodim yaratishga (POST /api/v1/employees) harakat qiladi. | 403 Forbidden xatoligi qaytariladi, chunki bu rol uchun bunday ruxsat yo'q. |
| E2E-06 | **Idempotentlik:** Bir xil Idempotency-Key sarlavhasi bilan /events/raw endpointiga ketma-ket ikkita bir xil so'rov yuboriladi. | Birinchi so'rov 202 Accepted qaytaradi. Ikkinchi so'rov ham darhol 202 Accepted qaytaradi. Ma'lumotlar bazasida faqat **bitta** Attendance yozuvi yaratilganligi tekshiriladi. |
| E2E-07 | **Fon Vazifasi (Eksport):** Hisobotni eksport qilish (/api/v1/reports/attendance/export) so'rovi yuboriladi. | Endpoint darhol 202 Accepted javobini qaytaradi va fon vazifasi boshlanganligini bildiradi. Vazifa yakunlangach, natija (masalan, faylga havola) bildirishnoma orqali kelishi kutiladi (stub orqali tekshiriladi). |

## **10\. Joylashtirish va Operatsiyalar (CI/CD)**

### **10.1. Konteynerizatsiya**

Ilovani production muhitida ishga tushirish uchun optimallashtirilgan va xavfsiz Docker image'ini yaratish uchun ko'p bosqichli Dockerfile qo'llaniladi.

* **Birinchi bosqich (build):** To'liq Node.js ishlab chiqish muhitida ilovaning bog'liqliklari o'rnatiladi, kod TypeScript'dan JavaScript'ga kompilyatsiya qilinadi va Prisma client generatsiya qilinadi.  
* **Ikkinchi bosqich (production):** Minimal node:alpine kabi bazaviy image'dan boshlanadi. Birinchi bosqichdan faqat production uchun zarur bo'lgan artefaktlar (dist papkasi, node\_modules, prisma papkasi) nusxalanadi. Bu yakuniy image hajmini sezilarli darajada kamaytiradi va xavfsizlik yuzasini (attack surface) qisqartiradi.

### **10.2. CI/CD Konveyeri (GitHub Actions)**

Har bir kod o'zgarishi avtomatik ravishda tekshirilishi va integratsiya qilinishini ta'minlash uchun .github/workflows/ci.yml faylida to'liq CI/CD konveyeri aniqlanadi.  
Konveyer quyidagi parallel ishlardan (jobs) iborat bo'ladi:

1. **lint-and-format:** Kod uslubi va formatlash qoidalariga muvofiqligini tekshiradi (ESLint, Prettier).  
2. **unit-tests:** Birlik testlarini ishga tushiradi. Bu ish tez bajariladi, chunki u tashqi bog'liqliklarni talab qilmaydi.  
3. **integration-tests:** Integratsion va E2E testlarini ishga tushiradi. Bu ish Testcontainers yordamida PostgreSQL va Redis xizmatlarini ishga tushiradi. Har bir pull request haqiqiy ma'lumotlar bazasiga qarshi tekshirilishini kafolatlaydi.  
4. **build:** Agar barcha oldingi ishlar muvaffaqiyatli yakunlansa, production uchun Docker image'ini yaratadi va uni Docker Hub yoki GitHub Container Registry kabi repozitoriyga yuklaydi.

### **10.3. Konfiguratsiyani Boshqarish**

Ilovani turli muhitlarda (development, test, production) to'g'ri sozlash uchun barcha zarur bo'lgan atrof-muhit o'zgaruvchilari (environment variables) ro'yxati quyidagi jadvalda keltirilgan. README.md faylida ushbu o'zgaruvchilar va ularning namunaviy qiymatlari bilan .env.example fayli taqdim etilishi kerak.

| O'zgaruvchi | Tavsif | Muhit | Majburiy |
| :---- | :---- | :---- | :---- |
| NODE\_ENV | Ilovaning ishlash rejimi. | development, production, test | Ha |
| PORT | Ilova tinglaydigan port. | development, production | Ha |
| DATABASE\_URL | PostgreSQL ma'lumotlar bazasiga ulanish manzili. | Barcha | Ha |
| REDIS\_URL | Redis serveriga ulanish manzili. | Barcha | Ha |
| JWT\_SECRET | Access tokenlarni imzolash uchun maxfiy kalit. | Barcha | Ha |
| JWT\_EXPIRATION\_TIME | Access tokenning yaroqlilik muddati (masalan, 15m). | Barcha | Ha |
| REFRESH\_TOKEN\_SECRET | Refresh tokenlarni imzolash uchun maxfiy kalit. | Barcha | Ha |
| REFRESH\_TOKEN\_EXPIRATION\_TIME | Refresh tokenning yaroqlilik muddati (masalan, 7d). | Barcha | Ha |
| S3\_ENDPOINT | S3-ga mos keluvchi xizmatning endpoint manzili. | Barcha | Ha |
| S3\_ACCESS\_KEY | S3 xizmatiga kirish kaliti. | Barcha | Ha |
| S3\_SECRET\_KEY | S3 xizmati uchun maxfiy kalit. | Barcha | Ha |
| S3\_BUCKET\_NAME | Fayllar saqlanadigan asosiy S3 ombori nomi. | Barcha | Ha |
| LOG\_LEVEL | Log yozuvlarining darajasi (info, debug, warn, error). | Barcha | Ha |

Ushbu texnik topshiriq Sector Staff v2.1 loyihasini muvaffaqiyatli amalga oshirish uchun keng qamrovli va aniq yo'l-yo'riq bo'lib xizmat qiladi. U zamonaviy dasturiy ta'minotni ishlab chiqishning eng yaxshi amaliyotlarini o'zida mujassam etgan va tizimning uzoq muddatli barqarorligi va kengaytiriluvchanligini ta'minlash uchun mo'ljallangan.

#### **Works cited**

1. Queues | NestJS \- A progressive Node.js framework, accessed August 10, 2025, [https://docs.nestjs.com/techniques/queues](https://docs.nestjs.com/techniques/queues)  
2. NestJs Bullmq best practices : r/nestjs \- Reddit, accessed August 10, 2025, [https://www.reddit.com/r/nestjs/comments/1lfxrl7/nestjs\_bullmq\_best\_practices/](https://www.reddit.com/r/nestjs/comments/1lfxrl7/nestjs_bullmq_best_practices/)  
3. passport | NestJS \- A progressive Node.js framework, accessed August 10, 2025, [https://docs.nestjs.com/recipes/passport](https://docs.nestjs.com/recipes/passport)  
4. A Step-by-Step Guide to Implement JWT Authentication in NestJS using Passport | Medium, accessed August 10, 2025, [https://medium.com/@camillefauchier/implementing-authentication-in-nestjs-using-passport-and-jwt-5a565aa521de](https://medium.com/@camillefauchier/implementing-authentication-in-nestjs-using-passport-and-jwt-5a565aa521de)  
5. Many-to-many relations | Prisma Documentation, accessed August 10, 2025, [https://www.prisma.io/docs/orm/prisma-schema/data-model/relations/many-to-many-relations](https://www.prisma.io/docs/orm/prisma-schema/data-model/relations/many-to-many-relations)  
6. Properly handling Many-to-Many relations with additional fields using Prisma Client \#2429 \- GitHub, accessed August 10, 2025, [https://github.com/prisma/prisma/discussions/2429](https://github.com/prisma/prisma/discussions/2429)  
7. Guards | NestJS \- A progressive Node.js framework \- NestJS Docs, accessed August 10, 2025, [https://docs.nestjs.com/guards](https://docs.nestjs.com/guards)  
8. How to get token claims on NestJS Passport? \- jwt \- Stack Overflow, accessed August 10, 2025, [https://stackoverflow.com/questions/70367236/how-to-get-token-claims-on-nestjs-passport](https://stackoverflow.com/questions/70367236/how-to-get-token-claims-on-nestjs-passport)  
9. Authentication | NestJS \- A progressive Node.js framework, accessed August 10, 2025, [https://docs.nestjs.com/security/authentication](https://docs.nestjs.com/security/authentication)  
10. User Authentication with Passport JS and JWT in Nest JS \- DEV Community, accessed August 10, 2025, [https://dev.to/andisiambuku/user-authentication-with-passport-js-and-jwt-in-nest-js-1ag3](https://dev.to/andisiambuku/user-authentication-with-passport-js-and-jwt-in-nest-js-1ag3)  
11. Creating an Idempotent REST API with NestJS. | by Robert Stoia \- Medium, accessed August 10, 2025, [https://medium.com/@robertstoia/creating-an-idempotent-rest-api-with-nestjs-7c8940e71d12](https://medium.com/@robertstoia/creating-an-idempotent-rest-api-with-nestjs-7c8940e71d12)  
12. Understanding Idempotency in NestJS | by Iftikhar Ahmed \- Medium, accessed August 10, 2025, [https://iftikhar-ahmed.medium.com/understanding-idempotency-in-nestjs-558e56b1300a](https://iftikhar-ahmed.medium.com/understanding-idempotency-in-nestjs-558e56b1300a)  
13. Idempotency Explained: Ensuring Reliable API Calls. A practical example in Nestjs, accessed August 10, 2025, [https://dev.to/joaoreider/idempotency-explained-ensuring-reliable-and-repeated-api-calls-in-nestjs-5emc](https://dev.to/joaoreider/idempotency-explained-ensuring-reliable-and-repeated-api-calls-in-nestjs-5emc)  
14. Retrying failing jobs | BullMQ, accessed August 10, 2025, [https://docs.bullmq.io/guide/retrying-failing-jobs](https://docs.bullmq.io/guide/retrying-failing-jobs)  
15. Pre-signed MultiPart Uploads with Minio | VanessaSaurus, accessed August 10, 2025, [https://vsoch.github.io/2020/s3-minio-multipart-presigned-upload/](https://vsoch.github.io/2020/s3-minio-multipart-presigned-upload/)  
16. Generate a presigned URL in modular AWS SDK for JavaScript | AWS Developer Tools Blog, accessed August 10, 2025, [https://aws.amazon.com/blogs/developer/generate-presigned-url-modular-aws-sdk-javascript/](https://aws.amazon.com/blogs/developer/generate-presigned-url-modular-aws-sdk-javascript/)  
17. Implementing Secure File Download/Upload to AWS S3 with NestJS | by Sam Xzo | Medium, accessed August 10, 2025, [https://medium.com/@sam.xzo.developing/implementing-secure-file-download-upload-to-aws-s3-with-nestjs-11144b789c75](https://medium.com/@sam.xzo.developing/implementing-secure-file-download-upload-to-aws-s3-with-nestjs-11144b789c75)  
18. Upload large files to AWS S3 using Multipart upload and presigned URLs \- DEV Community, accessed August 10, 2025, [https://dev.to/magpys/upload-large-files-to-aws-s3-using-multipart-upload-and-presigned-urls-4olo](https://dev.to/magpys/upload-large-files-to-aws-s3-using-multipart-upload-and-presigned-urls-4olo)  
19. NestJS Testing Recipe: Mocking Prisma | by Bonaventuragal \- Medium, accessed August 10, 2025, [https://medium.com/@bonaventuragal/nestjs-testing-recipe-mocking-prisma-274c212d4b80](https://medium.com/@bonaventuragal/nestjs-testing-recipe-mocking-prisma-274c212d4b80)  
20. Integration testing with Prisma | Prisma Documentation, accessed August 10, 2025, [https://www.prisma.io/docs/orm/prisma-client/testing/integration-testing](https://www.prisma.io/docs/orm/prisma-client/testing/integration-testing)  
21. Improving Integration/E2E Testing Using NestJS and TestContainers ..., accessed August 10, 2025, [https://blog.stackademic.com/improving-integration-e2e-testing-using-nestjs-and-testcontainers-4a815142d147](https://blog.stackademic.com/improving-integration-e2e-testing-using-nestjs-and-testcontainers-4a815142d147)  
22. Improving Integration/E2E testing using NestJS and TestContainers \- DEV Community, accessed August 10, 2025, [https://dev.to/medaymentn/improving-intergratione2e-testing-using-nestjs-and-testcontainers-3eh0](https://dev.to/medaymentn/improving-intergratione2e-testing-using-nestjs-and-testcontainers-3eh0)