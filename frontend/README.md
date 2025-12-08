# Social Feed Web (Frontend)

Frontend สำหรับ Social Feed Web Application

## เทคโนโลยีที่ใช้

- Next.js 15
- React 19
- Material-UI (MUI)
- TypeScript
- Axios

## การติดตั้ง

1. ติดตั้ง dependencies:
```bash
npm install
# หรือ
yarn install
```

2. สร้างไฟล์ `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

3. รันโปรแกรม:
```bash
npm run dev
# หรือ
yarn dev
```

เว็บไซต์จะรันที่ http://localhost:3000

## หน้าต่างๆ

- `/login` - หน้าเข้าสู่ระบบ
- `/register` - หน้าสมัครสมาชิก
- `/feed` - หน้าหลัก (ฟีดโพสต์)
- `/profile` - หน้าโปรไฟล์

