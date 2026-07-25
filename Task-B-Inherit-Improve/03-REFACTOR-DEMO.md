# Before / after refactor (concrete demonstration)

This sample mirrors a realistic anti-pattern for a live agency site like digitalheroesco.com: a contact/lead endpoint with validation, persistence, email, and CRM side effects all jammed into a route handler — plus a frontend that once talked to the DB directly (shown as the “before” client smell).

---

## Before (bad)

### Backend route handler — everything inline

```js
// routes/contact.js  (BEFORE)
const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const router = express.Router();

const leadSchema = new mongoose.Schema({
  name: String,
  email: String,
  company: String,
  message: String,
  createdAt: { type: Date, default: Date.now },
});
const Lead = mongoose.models.Lead || mongoose.model('Lead', leadSchema);

router.post('/api/contact', async (req, res) => {
  try {
    const { name, email, company, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).send('Missing fields');
    }
    if (!email.includes('@')) {
      return res.status(400).send('Bad email');
    }

    // Business rule buried in the handler
    const source = company ? 'b2b-form' : 'consumer-form';
    const priority = message.toLowerCase().includes('shopify plus') ? 'high' : 'normal';

    const lead = await Lead.create({ name, email, company, message, source, priority });

    // Side effect + secrets read ad hoc
    const transporter = nodemailer.createTransport({
      host: 'smtp.example.com',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transporter.sendMail({
      from: 'noreply@digitalheroesco.com',
      to: 'sales@digitalheroesco.com',
      subject: `[${priority}] New lead: ${name}`,
      text: `${email}\n${company}\n\n${message}`,
    });

    // Another integration, still in the handler
    await fetch('https://crm.example.com/hooks/leads', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.CRM_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: lead._id, name, email, priority }),
    });

    res.json({ ok: true, id: lead._id });
  } catch (e) {
    console.log(e);
    res.status(500).send(e.message); // leaks internals
  }
});

module.exports = router;
```

### Frontend — direct database access (catastrophic)

```js
// pages/contact.jsx  (BEFORE — do not ship)
import { MongoClient } from 'mongodb';

export async function submitLead(form) {
  // Bundle or server component with a privileged URI — either way, wrong boundary
  const client = new MongoClient(process.env.NEXT_PUBLIC_MONGO_URI);
  await client.connect();
  await client.db('prod').collection('leads').insertOne(form);
  await client.close();
}
```

### What is wrong

| Problem | Why it hurts on a live customer site |
|---------|--------------------------------------|
| Logic in the route | Cannot unit-test priority/source rules without HTTP |
| Weak validation | Bad data reaches DB and sales inbox |
| Side effects inline | Email/CRM failures can fail the whole request unpredictably |
| `res.send(e.message)` | Stack/DB errors leak to clients |
| Frontend DB URI | Anyone can read/write production data |
| No tests | Refactors are guesswork |

---

## After (improved)

### Shared validation

```js
// validators/contact.js
const { z } = require('zod');

const contactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
  company: z.string().trim().max(120).optional().default(''),
  message: z.string().trim().min(1).max(5000),
});

module.exports = { contactSchema };
```

### Domain/service layer

```js
// services/contactService.js
const Lead = require('../models/Lead');
const { sendSalesLeadEmail } = require('./emailService');
const { pushLeadToCrm } = require('./crmService');
const AppError = require('../utils/AppError');

function classifyLead({ company, message }) {
  const source = company ? 'b2b-form' : 'consumer-form';
  const priority = message.toLowerCase().includes('shopify plus') ? 'high' : 'normal';
  return { source, priority };
}

async function createContactLead(input) {
  const { source, priority } = classifyLead(input);

  const lead = await Lead.create({
    name: input.name,
    email: input.email,
    company: input.company || '',
    message: input.message,
    source,
    priority,
  });

  // Best-effort notifications: lead is already durable
  try {
    await sendSalesLeadEmail(lead);
  } catch (err) {
    console.error('email_failed', { leadId: lead.id, err: err.message });
  }

  try {
    await pushLeadToCrm(lead);
  } catch (err) {
    console.error('crm_failed', { leadId: lead.id, err: err.message });
  }

  return lead;
}

module.exports = { createContactLead, classifyLead };
```

### Thin route handler

```js
// routes/contact.js  (AFTER)
const express = require('express');
const rateLimit = require('express-rate-limit');
const { contactSchema } = require('../validators/contact');
const { createContactLead } = require('../services/contactService');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });

router.post(
  '/api/contact',
  limiter,
  asyncHandler(async (req, res) => {
    const parsed = contactSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      });
    }

    const lead = await createContactLead(parsed.data);
    return res.status(201).json({
      data: { id: lead.id, priority: lead.priority },
    });
  })
);

module.exports = router;
```

### Frontend — API only

```js
// lib/contactApi.js  (AFTER)
export async function submitLead(form) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(form),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.message || 'Could not submit');
  }
  return body.data;
}
```

### Focused test (now possible)

```js
// services/contactService.test.js
const { classifyLead } = require('./contactService');

test('marks Shopify Plus inquiries as high priority', () => {
  const result = classifyLead({
    company: 'Acme',
    message: 'We need a Shopify Plus migration',
  });
  expect(result).toEqual({ source: 'b2b-form', priority: 'high' });
});
```

---

## Commentary — what improved

1. **Boundary restored**  
   The browser talks to HTTP only. Database credentials never ship to clients. This alone removes a class of total-data-loss attacks.

2. **Testable business rules**  
   `classifyLead` is pure and covered without spinning up Express. Priority bugs can be caught in CI before sales sees wrong SLAs.

3. **Durable first, notify second**  
   The lead is saved before email/CRM. A flaky SMTP provider no longer drops the customer inquiry — the failure mode becomes “sales wasn’t notified,” which you can alert on, not “customer got a 500 and vanished.”

4. **Consistent API errors**  
   JSON validation errors replace opaque strings and leaked exception messages. Frontend UX and logging both get better.

5. **Handler stays boring**  
   New engineers can read the route in seconds. Changes to CRM mapping do not risk breaking validation, and vice versa.

6. **Incremental migration path**  
   You can ship this one endpoint while fifty other legacy handlers remain. That matches a no-downtime strangler strategy: repeat the pattern for the next hottest route.

---

## What we deliberately did *not* change

- Did not rewrite the marketing site.  
- Did not introduce microservices or a message bus on day one (can come later for CRM retries).  
- Did not demand 100% coverage — one pure-function test already raises confidence for this rule.

That restraint is the point: improve the dangerous seam without taking the customer site offline.
