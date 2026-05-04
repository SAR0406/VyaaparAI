# VyapaarAI — Development Roadmap

> An AI Business Operating System for India's 63 million MSMEs, delivered through WhatsApp in Hindi and vernacular languages.

---

## ✅ Phase 0 — Foundation (Complete)

- [x] WhatsApp Cloud API webhook (verification + message ingestion)
- [x] Hindi/vernacular NLP intent parser (Claude-backed)
- [x] GST invoice generation (PDF) and WhatsApp delivery
- [x] Payment reminder system (multilingual)
- [x] In-memory inventory tracking (purchase / sale / stock check)
- [x] GST summary display
- [x] Razorpay subscription + payment link integration
- [x] PostgreSQL schema (businesses, customers, invoices, inventory, reminders)
- [x] Structured logging (Winston)

---

## 🔒 Phase 0.5 — Security Hardening (Current)

- [x] Meta webhook HMAC-SHA256 signature verification (`X-Hub-Signature-256`)
- [x] Helmet HTTP security headers (CSP, HSTS, X-Frame-Options, etc.)
- [x] Global + per-endpoint rate limiting (express-rate-limit)
- [x] Request body size caps (64 KB JSON, 16 KB URL-encoded)
- [x] Phone number format validation (E.164) before processing
- [x] Strict `businessPhoneId` matching against configured env var
- [x] Input sanitization — strip control chars, cap field lengths
- [x] Amount and quantity validation (bounds, finite, positive)
- [x] NLP output schema validation + prototype-pollution prevention
- [x] Cryptographically random invoice numbers (`crypto.randomBytes`)
- [x] Phone numbers masked in all log lines
- [x] Razorpay webhook HMAC signature verification
- [x] `timingSafeEqual` for all HMAC comparisons
- [x] Startup environment-variable validation (fail fast in production)
- [x] Generic error handler (no stack traces to clients)
- [x] `.env.example` updated with all required + recommended secrets

---

## 🚀 Phase 1 — MVP Production-Ready (Next, 4 weeks)

### Core reliability
- [ ] Persist inventory to PostgreSQL (replace in-memory Map)
- [ ] Persist invoice records to DB (link to `invoices` + `invoice_items` tables)
- [ ] Database connection pooling + query timeout (pg Pool)
- [ ] Database migration runner (`src/db/migrate.js`)
- [ ] Per-phone graceful deduplication (idempotency key on message ID)
- [ ] Retry + dead-letter queue for failed WhatsApp sends

### Business features
- [ ] Customer phone number lookup from DB for payment reminders (actually deliver reminders)
- [ ] GSTR-1 real data from DB transactions (replace placeholder hardcoded figures in GST summary)
- [ ] GST rate selection per item category (textile 5%, exempt 0%, etc.)
- [ ] Invoice PDF stored to cloud (S3/Cloudflare R2) and linked in DB
- [ ] WhatsApp voice message transcription (Sarvam AI / Whisper)
- [ ] Onboarding flow: new user → language selection → plan selection → Razorpay link

### DevOps
- [ ] Docker + Docker Compose setup
- [ ] CI/CD pipeline (GitHub Actions: test → lint → deploy)
- [ ] Health check endpoint with DB ping
- [ ] Structured error codes (machine-readable)
- [ ] Integration tests with supertest + DB fixtures

---

## 📊 Phase 2 — Platform (Months 3–6)

### GST automation
- [ ] Auto GSTR-1 generation from invoice records
- [ ] Auto GSTR-3B calculation (output - ITC)
- [ ] IRP e-Invoice generation (businesses above ₹10 Cr threshold)
- [ ] GSTIN validation with live GST portal API
- [ ] Monthly GST reminder cron job (20th of each month)

### Financial intelligence
- [ ] Real-time P&L from DB transactions
- [ ] Cash flow prediction ("Agle mahine kitna paisa chahiye?")
- [ ] Overdue payment detection + automated reminder scheduling (node-cron)
- [ ] Monthly business report delivered via WhatsApp

### Growth features
- [ ] CA white-label portal (CAs manage their client businesses)
- [ ] CA commission tracking (30% recurring)
- [ ] Referral code system
- [ ] Multi-user support (staff can add inventory; owner sees reports)
- [ ] WhatsApp Business Calling API integration (Meta July 2025)

### Tamil + additional languages
- [ ] Full Tamil language support (Devanagari detection already covers Hindi/Marathi)
- [ ] Bengali support
- [ ] Telugu support

---

## 🏗️ Phase 3 — Empire (Months 7–12)

### Embedded finance
- [ ] Working capital loan recommendations (fintech API partners)
- [ ] VyapaarAI credit scoring from transaction history
- [ ] Insurance products (MSME risk profile from DB data)

### B2B marketplace
- [ ] Supplier discovery (verified supplier database)
- [ ] B2B purchase order flow within WhatsApp
- [ ] Transaction fee layer (0.5–1% on B2B transactions)

### API business
- [ ] Developer API — GST compliance layer as-a-service (for banks, NBFCs)
- [ ] Webhook events API (invoice paid, GST due, etc.)
- [ ] API key management + rate limiting per key

### Global expansion
- [ ] Indonesia: PPN (VAT), Bahasa Indonesia NLP, WhatsApp-first
- [ ] Brazil: Nota Fiscal (NF-e) e-invoice integration
- [ ] Mexico: SAT/CFDI mandatory e-invoicing
- [ ] Configurable compliance module per country

---

## 🛡️ Ongoing Security Practices

| Practice | Status |
|---|---|
| Dependency audits (`npm audit`) | Run on every PR |
| Secret scanning (GitHub) | Enabled |
| No secrets in source code | Enforced via `.gitignore` + `envCheck.js` |
| HMAC for all incoming webhooks | ✅ Meta + Razorpay |
| Rate limiting on all public routes | ✅ |
| Input validation on all user data | ✅ |
| Principle of least privilege (DB user) | Pending |
| HTTPS-only (enforced via Helmet HSTS) | ✅ |
| Regular dependency updates | Monthly |

---

## 📐 Architecture Evolution

```
Phase 1 (Now)              Phase 2                     Phase 3
─────────────────          ──────────────────────      ─────────────────────
WhatsApp Cloud API    →    + Cron Jobs                 + B2B Marketplace
     ↓                     + CA Portal                 + Lending API
  Node.js / Express   →    + Multi-worker cluster      + Multi-region
     ↓                                                  + Global compliance
  PostgreSQL          →    + Read replicas             + Sharded by country
     ↓
  Razorpay            →    + Multiple payment gateways
     ↓
  Claude API          →    + Fine-tuned MSME model     + Self-hosted LLM
```

---

*Last updated: May 2026*
