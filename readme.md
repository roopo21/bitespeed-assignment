# 🧠 Bitespeed Identity Reconciliation - Backend Task

A backend service to identify and consolidate user identities across purchases using email and/or phone number. Built with **Node.js**, **TypeScript**, **Express**, and **Prisma**.

---

## 🚀 Live Demo

👉 [https://bitespeed-assignment-chfn.onrender.com](https://bitespeed-assignment-chfn.onrender.com)  

example cURL (GET) : 
curl --location 'https://bitespeed-assignment-chfn.onrender.com/identify' \
--header 'Content-Type: application/json' \
--data-raw '{
    "email": "biffsucks@hillvalley.edu",
    "phoneNumber": "919191"
}'
---

## 📦 Tech Stack

- Node.js
- TypeScript
- Express.js
- PostgreSQL
- Prisma ORM

---

## 🧪 Endpoint

### POST `/identify`

**Request Body (JSON)**

```json
{
  "email": "doc@hillvalley.edu",
  "phoneNumber": "1234567890"
}
