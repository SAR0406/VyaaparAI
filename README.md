# VyapaarAI 🇮🇳

> **An AI Business Operating System for India's 63 million MSMEs — delivered entirely through WhatsApp, in Hindi and vernacular languages.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org)
[![WhatsApp](https://img.shields.io/badge/WhatsApp-Business%20API-25D366)](https://business.whatsapp.com)

---

## What is VyapaarAI?

VyapaarAI is a **WhatsApp-native AI business assistant** that gives every kirana owner, saree trader, and transport company owner their own CA + business manager + growth advisor — all inside a WhatsApp conversation.

- **No new app** to download
- **No English required** — Hindi, Marathi, Gujarati, Tamil supported from day 1
- **No technical knowledge needed** — just WhatsApp, the way they already use it

Think of it as infrastructure — the financial and operational spine of India's small business economy, finally made accessible.

---

## The Problem

| Metric | Data |
|--------|------|
| Indian MSMEs | 63 million |
| MSMEs with digital tools | ~6% |
| Compliance obligations per year | 1,400+ |
| Annual CA cost per business | ₹15,000–₹50,000 |
| India's SMB software opportunity | $13 billion |
| WhatsApp users in India | 500M+ |

India's 63 million small businesses are drowning in compliance, paperwork, and chaos — with no digital tools and no one building for them in their language. MSMEs face 1,400+ compliance obligations annually (GST, ITR, TDS, labour laws, factory licenses) — many with jail clauses for minor lapses.

---

## What VyapaarAI Does

### Phase 1 — MVP (Month 1–2) · ₹499/month
- 🧾 **GST Invoice Bot** — "Bhaiya, ek invoice banao ₹5,000 ka" → instant GST invoice PDF sent to customer
- 🔔 **Auto Payment Reminder** — pings overdue customers in their own language after 7/15/30 days
- 📦 **Basic Inventory** — "Kitna stock bacha?" → bot tells you
- 📊 **Monthly GST Summary** — what you owe, what you can claim back
- 🗣️ **Hindi, Marathi, Gujarati** language support from day 1

### Phase 2 — Platform (Month 3–6) · ₹999/month
- 📋 Auto GST return filing (GSTR-1, GSTR-3B) directly to government portal
- 💰 Real-time P&L: profit, loss, outstanding payments — all by voice
- 🔮 Cash flow prediction: "Agle mahine kitna paisa chahiye?" → AI tells you
- 👥 Employee attendance & salary automation via WhatsApp
- 🏦 Working capital loan recommendations via fintech API partners

### Phase 3 — Empire (Month 7–12) · ₹2,999/month
- 🛒 B2B marketplace: connect verified suppliers with buyers
- 💳 Embedded lending using YOUR business data
- 🛡️ Insurance products tailored to MSME risk profiles
- 🌏 Export to Indonesia, Vietnam, Brazil — same tech, new compliance layer
- 🔌 API business: sell the compliance layer to banks and NBFCs

---

## Tech Stack

```
WhatsApp Business API (360dialog / Twilio)
    ↓
Node.js / Express Backend
    ↓
Claude API (NLP + Hindi/vernacular understanding)
    ↓
PostgreSQL (business data + financial intelligence)
    ↓
Razorpay (payments + subscriptions)
    ↓
Government GST APIs (GSTIN validation, IRP, e-invoicing) — free
    ↓
Vercel / Railway (hosting)
    ↓
React Dashboard (Phase 2+)
```

---

## Project Structure

```
vyapaarai/
├── src/
│   ├── bot/
│   │   ├── whatsapp.js        # WhatsApp webhook handler
│   │   └── messageRouter.js   # Routes messages to correct handler
│   ├── handlers/
│   │   ├── invoice.js         # GST invoice generation
│   │   ├── reminder.js        # Payment reminder system
│   │   ├── inventory.js       # Inventory tracking
│   │   └── gst.js             # GST filing & compliance
│   ├── nlp/
│   │   ├── parser.js          # Hindi/vernacular NLP parser
│   │   └── languages.js       # Language detection & translation
│   ├── integrations/
│   │   ├── gstPortal.js       # GST portal API integration
│   │   ├── razorpay.js        # Payment & subscription handling
│   │   └── claude.js          # Claude AI integration
│   ├── models/
│   │   ├── Business.js        # Business data model
│   │   ├── Invoice.js         # Invoice model
│   │   ├── Customer.js        # Customer model
│   │   └── Inventory.js       # Inventory model
│   └── utils/
│       ├── pdfGenerator.js    # GST invoice PDF generator
│       └── dateHelper.js      # Date utilities
├── .env.example
├── package.json
└── README.md
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- WhatsApp Business API account (360dialog or Twilio)
- Claude API key (Anthropic)
- Razorpay account
- GST Portal API access

### Installation

```bash
# Clone the repository
git clone https://github.com/SAR0406/VyaaparAI.git
cd VyaaparAI

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Set up database
npm run db:migrate

# Start the server
npm run dev
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```env
# WhatsApp
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_VERIFY_TOKEN=your_verify_token

# Claude AI
CLAUDE_API_KEY=your_claude_api_key

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/vyapaarai

# Razorpay
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret

# GST Portal
GST_API_BASE_URL=https://api.gst.gov.in
```

---

## Revenue Model

| Customers | Plan | Annual Revenue (INR) | Annual Revenue (USD) |
|-----------|------|---------------------|---------------------|
| 1,000 | ₹999/month avg | ₹1.2 Crore / year | ~$143,000 |
| 10,000 | ₹999/month avg | ₹12 Crore / year | ~$1.4M |
| 1,00,000 | ₹999/month avg | ₹120 Crore / year | ~$14.4M |
| 10,00,000 | ₹999/month avg | ₹1,200 Crore / year | ~$144M 🚀 |

**The math:** A business paying ₹999/month = ₹11,988/year. A CA charges ₹15,000–₹50,000/year. Tally + HR software + compliance tools = ₹50,000+/year. VyapaarAI replaces all of it at less than the cost of just the CA.

---

## The Moat — Why This Can't Be Copied

| Factor | Detail |
|--------|--------|
| 🏛️ Regulatory complexity | India has 1,400+ compliance requirements, unique GST architecture, IRP APIs, e-invoicing mandates, TDS rules — takes 12–18 months to get right |
| 📊 Data lock-in | After 6 months, VyapaarAI knows every customer, supplier, seasonal cash flow pattern. Switching = losing years of intelligence |
| 🗣️ Language & cultural moat | Genuine vernacular understanding including local business idioms — not surface-level translation |
| 🔗 Network effects | Businesses send invoices to customers and orders to suppliers via the platform — pulling in their entire network |
| 🤝 CA channel moat | 400,000 CAs in India, each serving dozens of SMBs. White-label product for CAs = zero-cost distribution |
| 🏗️ Government API depth | GST portal, GSTIN validation, IRP, Udyam portal, TDS filing — months of engineering to build correctly |

---

## 90-Day Build Plan

| Weeks | Milestone |
|-------|-----------|
| 1–2 | WhatsApp Business API + Basic Invoice Bot |
| 3–4 | Hindi NLP + Payment Reminder System |
| 5–6 | GST API Integration + First 10 Paying Customers |
| 7–8 | Inventory Tracking + Basic Dashboard |
| 9–12 | CA Channel Partner Program + 100 Paying Customers |

---

## Global Expansion

After India is proven, the same WhatsApp-first, vernacular AI, compliance-automation model works in every emerging market:

| Country | SMBs | Compliance Layer |
|---------|------|-----------------|
| 🇮🇳 India (Home) | 63M | GST, TDS, TCS, Udyam |
| 🇮🇩 Indonesia | 65M | PPN (VAT), Bahasa |
| 🇧🇷 Brazil | 20M | NF-e (Nota Fiscal) |
| 🇲🇽 Mexico | 4.9M | SAT / CFDI |
| 🇻🇳 Vietnam | 8M | Rapid digital adoption |
| 🇳🇬 Nigeria | 40M | FIRS compliance |

**Total addressable market: 200M+ small businesses across 6 countries.**

---

## Launch Strategy

1. **Pick one city** — Start in Surat (textile traders), Rajkot (engineering SMEs), or Indore (retail traders). Get hyper-local.
2. **Partner with 3 local CAs** — Offer 30% recurring commission. Each CA has 50–100 clients. Zero-cost distribution with built-in trust.
3. **Build in public** — GitHub + Twitter. Document the build journey.
4. **Charge from day 1** — ₹499/month. Never give free trials. A paying customer gives honest feedback.
5. **Target invoice pain first** — GST invoicing is the highest-frequency pain point. Solve this reliably in Hindi inside WhatsApp and you have a product people never leave.

---

## Why Right Now

- **GST formalization wave** — GST-registered MSMEs grew from 5 lakh (2017) to 1.5 crore (2024). These newly formalized businesses urgently need digital tools.
- **WhatsApp Business Calling API** — Meta launched voice calls within WhatsApp for businesses in July 2025.
- **Y Combinator Spring 2026 RFS** — YC explicitly requested AI that "does work end-to-end, not just copilots" and "vertical AI agents that automate work entirely."
- **LLM cost crash** — GPT-4 API costs dropped 90% in 18 months. Running Hindi NLP for 63M businesses is now viable at ₹499/month.
- **E-invoicing mandate** — From April 2025, compliance urgency is forcing digitisation. Urgency makes people pay.

---

## Sources

- Y Combinator RFS Spring 2026
- Menlo Ventures State of Consumer AI 2025
- SaaSBoomi $100B India Software Report
- MSME Ministry of India Data
- Market Research Future India Accounting Software 2035
- Foundation Capital 2026 AI Outlook

---

## Contributing

This is an open-source project. Contributions welcome — especially:
- Hindi/vernacular NLP improvements
- GST API integrations
- Regional language support (Tamil, Telugu, Kannada, Bengali)
- WhatsApp message flow optimizations

---

## License

MIT © 2026 Sarthak Upadhyay
