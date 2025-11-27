#  Zero-Knowledge Password Manager

![Django](https://img.shields.io/badge/Django-5.1-092E20?style=for-the-badge&logo=django&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=next.js&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.13-3776AB?style=for-the-badge&logo=python&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Security](https://img.shields.io/badge/Security-AES--256--GCM-red?style=for-the-badge)

Zero-knowledge password manager where **the server never sees your decrypted passwords**. Built with modern web technologies and cryptographic best practices, this application ensures your sensitive data remains private through client-side encryption.

---

##  Key Features

-  **Zero-Knowledge Architecture** - Server only stores encrypted data
-  **Client-Side AES-256-GCM Encryption** - All encryption happens in your browser
-  **Argon2id Password Hashing** - Industry-standard password security
-  **Master Password Never Stored** - Even we can't access your passwords
-  **Folder Organization** - Group passwords by categories
-  **Favorites** - Quick access to frequently used passwords
-  **Search & Filter** - Find passwords instantly
-  **Auto-Lock** - Automatic logout after 10 minutes of inactivity
-  **RESTful API** - Clean, documented backend architecture
-  **Modern UI** - Built with Tailwind CSS for a clean, responsive interface
-  **Rate Limiting** - Protection against brute-force attacks
-  **CORS-Enabled** - Secure cross-origin resource sharing

---

##  Tech Stack

### Backend
- **Framework:** Django 5.1 + Django REST Framework 3.15
- **Database:** SQLite (development) / PostgreSQL (production-ready)
- **Password Hashing:** Argon2id via `django-argon2`
- **Authentication:** Session-based with CSRF exemption for API
- **Rate Limiting:** Built-in DRF throttling
- **CORS:** `django-cors-headers`

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** JavaScript (ES6+)
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **HTTP Client:** Axios
- **Encryption:** Web Crypto API (browser-native)

### Cryptography
- **Encryption Algorithm:** AES-256-GCM
- **Key Derivation:** PBKDF2 (100,000 iterations, SHA-256)
- **Password Hashing:** Argon2id
- **IV Generation:** Cryptographically secure random values

##  System Architecture Overview

### Zero-Knowledge Flow

This password manager implements a **true zero-knowledge architecture** [web:19][web:181], meaning:

1. **Master Password Never Leaves Your Device** - It's used only for local key derivation
2. **All Encryption Happens Client-Side** - Passwords are encrypted in your browser before transmission
3. **Server Stores Only Ciphertext** - The backend never sees plaintext passwords
4. **You Control the Keys** - Only you can decrypt your data


### Architecture Diagram

<p align="center">
  <img src="assets/pass1.png" alt="pass tracker" width="800">
  <br>
  
</p>


### Security Model

| Component | Purpose | Location |
|-----------|---------|----------|
| Master Password | User authentication + key derivation | Client only (never sent) |
| Argon2 Hash | Server-side authentication | Server database |
| Encryption Key | Decrypt/encrypt passwords | Client memory (never sent) |
| Ciphertext + IV | Encrypted password storage | Server database |
| Salt | Key derivation randomness | Client localStorage |
