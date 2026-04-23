# MenuFE

## Cấu hình API

- Copy file `.env.example` thành `.env`
- Sửa URL API:

```
VITE_API_BASE_URL=http://localhost:7080
```

## Deploy trên Vercel (khuyến nghị)

- **Không set** `VITE_API_BASE_URL` để frontend gọi API qua same-origin `/api/...`
- Vercel sẽ proxy qua backend nhờ `vercel.json` (rewrite `/api/*` → `https://menuapi.runasp.net/api/*`)

## Chạy local

```
npm install
npm run dev
```

