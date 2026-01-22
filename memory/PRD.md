# MO Deal Wholesaler - Product Requirements Document

## Project Overview
**Name:** MO Deal Wholesaler  
**Type:** Real Estate Wholesaling Platform  
**Target Market:** Missouri distressed property investors  
**Launch Date:** December 2024

---

## Original Problem Statement
Build a comprehensive, legally-compliant real estate wholesaling app for Missouri that connects investors with distressed properties while maintaining proper wholesaling legal structure. The platform operates as a principal in every transaction — buying equitable interest in properties via assignable purchase contracts, then selling/assigning those contractual rights to investor-buyers for an assignment fee.

---

## User Personas

### 1. Real Estate Investor (Primary)
- Flippers, landlords, BRRRR investors
- Looking for off-market distressed properties
- Needs quick access to deal analysis and due diligence
- Values speed of closing and clear fee structure

### 2. Platform Admin
- Manages property pipeline
- Handles seller outreach campaigns
- Coordinates closings with title companies
- Monitors revenue and investor activity

---

## Core Requirements (Static)

### Property Intelligence Engine
- DistressScore™ algorithm (0-100) based on:
  - Tax delinquency (20%)
  - Physical condition (20%)
  - Vacancy indicators (15%)
  - Ownership structure (15%)
  - Neighborhood demand (15%)
  - Motivation probability (15%)

### Investor Tier System
| Tier | Price | Features |
|------|-------|----------|
| Bronze | $97/mo | Email alerts, 24hr delayed access |
| Silver | $297/mo | Real-time alerts, instant access, due diligence |
| Gold | $597/mo | 30-min early access, direct seller contact |
| Platinum | $1,497/mo | Exclusive listings, deal guarantee |

### Fee Structure
- Assignment Fee: $10,000 flat OR 15% of spread (whichever higher)
- Minimum Assignment: $5,000
- Contract Coordination Fee: $795
- Expedited Close (7-day): +$1,500

---

## What's Been Implemented ✅

### December 2024 - MVP Launch

#### Backend (FastAPI)
- [x] JWT Authentication system
- [x] Property database with DistressScore calculation
- [x] Contract management (purchase/assignment agreements)
- [x] Stripe integration for subscriptions + EMD payments
- [x] OpenAI GPT-5.2 integration for property analysis
- [x] AI Chatbot for seller qualification
- [x] Investor tier access control
- [x] Admin dashboard with analytics
- [x] Outreach campaign system (Twilio-ready)
- [x] Closing transaction tracking
- [x] Payment transaction logging

#### Frontend (React)
- [x] Landing page with pricing tiers
- [x] User registration (2-step flow)
- [x] User login/authentication
- [x] Investor dashboard with deal pipeline
- [x] Property database with filters
- [x] Property detail page with AI analysis
- [x] Available deals marketplace
- [x] Contract management page
- [x] Payments page with Stripe checkout
- [x] AI Assistant chat interface
- [x] Settings page with API key configuration
- [x] Admin dashboard with statistics

#### Integrations Active
- ✅ Stripe (subscriptions + EMD payments)
- ✅ OpenAI GPT-5.2 (property analysis, chatbot)
- ⏳ Twilio (SMS/Voice - awaiting API keys)
- ⏳ DocuSign (e-signatures - awaiting API keys)
- ⏳ PropStream (property data - awaiting API keys)
- ⏳ Notarize.com (remote notarization - awaiting API keys)

---

## Prioritized Backlog

### P0 - Critical (Next Sprint)
1. Connect PropStream API for real property data
2. Integrate DocuSign for e-signatures on contracts
3. Enable Twilio for automated seller outreach

### P1 - High Priority
4. Notarize.com integration for remote notarization
5. BatchSkipTracing API for owner contact info
6. Title company API integration (Stewart/Fidelity)
7. Plaid integration for POF verification

### P2 - Medium Priority
8. Automated outreach sequences (multi-day campaigns)
9. Email notifications for deal alerts
10. Mobile-responsive PWA optimization
11. Google Maps/Street View integration

### P3 - Future Enhancements
12. Double-close automation with transactional funding
13. Investor portfolio tracking
14. ROI calculator and deal analyzer
15. White-label options for enterprise

---

## Technical Architecture

### Stack
- **Frontend:** React 19 + TailwindCSS + shadcn/ui
- **Backend:** FastAPI (Python 3.11)
- **Database:** MongoDB
- **Payments:** Stripe
- **AI:** OpenAI GPT-5.2 via Emergent LLM Key
- **SMS/Voice:** Twilio (pending)
- **E-Sign:** DocuSign (pending)

### Database Collections
- `users` - Investor accounts with tier info
- `properties` - Distressed property database
- `contracts` - Purchase/assignment agreements
- `payment_transactions` - Stripe payment records
- `outreach_campaigns` - Seller contact tracking
- `chat_messages` - AI conversation history
- `closing_transactions` - Title company coordination

---

## Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Monthly Active Investors | 100 | 7 |
| Properties in Pipeline | 500 | 3 |
| Close Rate | 70% | - |
| Avg. Assignment Fee | $12,000 | - |
| Subscription Revenue | $10,000/mo | $0 |

---

## Next Actions

1. **Provide API Keys** - User needs to provide:
   - PropStream API key (property data)
   - Twilio credentials (SMS/Voice)
   - DocuSign API key (e-signatures)
   - Notarize.com API key (notarization)

2. **Add Real Properties** - Use PropStream to pull actual Missouri distressed properties

3. **Test Payment Flow** - Complete full subscription + EMD payment cycle

4. **Launch Outreach** - Enable Twilio and start automated seller contact

---

## Legal Compliance Notes

- Platform operates as principal (buyer), not broker/agent
- All contracts include proper Missouri disclosures
- Assignment rights explicitly stated in purchase agreements
- No MLS access or REALTOR® cooperation
- Lead-based paint disclosure for pre-1978 properties
- Remote Online Notarization (RON) compliant since MO 2020

---

*Last Updated: December 2024*
