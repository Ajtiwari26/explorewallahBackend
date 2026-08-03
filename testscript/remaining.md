# Razorpay & WhatsApp API Integration Guide

This guide contains the **exact production code, webhook handlers, backend configurations, and environment secrets** extracted from:
1. **Razorpay API** (Source: `nukkadMart`)
2. **WhatsApp Cloud API & Webhooks** (Source: `IQSL`)

---

## 1. Razorpay API Integration (from `nukkadMart`)

### Environment Variables (`.env`)
```env
# Razorpay Credentials
RAZORPAY_KEY_ID=rzp_live_IOk2tHMSQHhGzI
RAZORPAY_KEY_SECRET=n4ew6QXZwLhK1xLfF2j4XiCT
BYPASS_RAZORPAY=false
```

---

### Python FastAPI Implementation (`payments.py`)

```python
"""
Payments Router - Razorpay Integration
Extracted from NukkadMart Backend
"""
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import hmac
import hashlib
import httpx

router = APIRouter(prefix="/payments", tags=["Payments"])

# ==================== Data Schemas ====================

class CreateOrderRequest(BaseModel):
    amount: float  # Amount in INR (e.g. 299.50)
    order_id: str
    store_id: str
    user_id: str
    notes: Optional[dict] = None


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    order_id: str


# ==================== Helper Functions ====================

def verify_razorpay_signature(razorpay_order_id: str, razorpay_payment_id: str, razorpay_signature: str, key_secret: str) -> bool:
    """Verify Razorpay HMAC SHA256 payment signature"""
    if not key_secret:
        return False

    message = f"{razorpay_order_id}|{razorpay_payment_id}"
    expected_signature = hmac.new(
        key_secret.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(expected_signature, razorpay_signature)


# ==================== Endpoints ====================

@router.get("/config")
async def get_payment_config(key_id: str = "rzp_live_IOk2tHMSQHhGzI"):
    """Get Razorpay configuration for frontend SDK"""
    return {
        "razorpay_key_id": key_id,
        "currency": "INR"
    }


@router.post("/create-order")
async def create_razorpay_order(request: CreateOrderRequest, key_id: str = "rzp_live_IOk2tHMSQHhGzI", key_secret: str = "n4ew6QXZwLhK1xLfF2j4XiCT", bypass: bool = False):
    """Create a Razorpay order via Razorpay REST API"""
    if bypass:
        return {
            "razorpay_order_id": f"order_dev_{request.order_id}",
            "amount": int(request.amount * 100),
            "currency": "INR",
            "key_id": "rzp_dev_bypass",
            "bypass": True
        }

    # Amount in paise (Razorpay requires smallest currency unit: 1 INR = 100 paise)
    amount_paise = int(request.amount * 100)

    razorpay_data = {
        "amount": amount_paise,
        "currency": "INR",
        "receipt": request.order_id,
        "notes": {
            "store_id": request.store_id,
            "user_id": request.user_id,
            "order_id": request.order_id,
            **(request.notes or {})
        }
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.razorpay.com/v1/orders",
            json=razorpay_data,
            auth=(key_id, key_secret)
        )

        if response.status_code != 200:
            raise HTTPException(status_code=500, detail=f"Failed to create Razorpay order: {response.text}")

        razorpay_order = response.json()

    return {
        "razorpay_order_id": razorpay_order["id"],
        "amount": amount_paise,
        "currency": "INR",
        "key_id": key_id
    }


@router.post("/verify")
async def verify_payment(request: VerifyPaymentRequest, key_secret: str = "n4ew6QXZwLhK1xLfF2j4XiCT", bypass: bool = False):
    """Verify Razorpay payment signature and confirm payment status"""
    if bypass or request.razorpay_order_id.startswith("order_dev_"):
        return {
            "success": True,
            "message": "Payment verified (development bypass)",
            "order_id": request.order_id,
            "payment_id": f"pay_dev_{request.order_id}"
        }

    is_valid = verify_razorpay_signature(
        request.razorpay_order_id,
        request.razorpay_payment_id,
        request.razorpay_signature,
        key_secret
    )

    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid Razorpay payment signature")

    return {
        "success": True,
        "message": "Payment verified successfully",
        "order_id": request.order_id,
        "payment_id": request.razorpay_payment_id
    }


@router.post("/webhook")
async def razorpay_webhook(request: Request, key_secret: str = "n4ew6QXZwLhK1xLfF2j4XiCT"):
    """Handle incoming Razorpay webhooks (payment.captured, payment.failed)"""
    import json

    body = await request.body()
    signature = request.headers.get("X-Razorpay-Signature")

    if not signature:
        raise HTTPException(status_code=400, detail="Missing webhook signature")

    expected_signature = hmac.new(
        key_secret.encode(),
        body,
        hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(expected_signature, signature):
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    payload = json.loads(body)
    event = payload.get("event")

    if event == "payment.captured":
        payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
        razorpay_order_id = payment_entity.get("order_id")
        # TODO: Mark order as captured/paid in your DB
        print(f"[Razorpay Webhook] Payment Captured for Order: {razorpay_order_id}")

    elif event == "payment.failed":
        payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
        razorpay_order_id = payment_entity.get("order_id")
        reason = payment_entity.get("error_description")
        # TODO: Mark order as failed in your DB
        print(f"[Razorpay Webhook] Payment Failed for Order {razorpay_order_id}: {reason}")

    return {"status": "ok"}
```

---

## 2. WhatsApp Business Cloud API & Webhook (from `IQSL`)

### Environment Variables (`.env`)
```env
# Meta WhatsApp Cloud API Credentials
WHATSAPP_ACCESS_TOKEN=EAAsZByXDhm5MBRzC7c34OX3IVCcuXTi2GQPdfAsVHutdyx3gkFsG0KyRWG8HOp2tz7pAt9uFdlIOIUA8JOmzC4SIFX7z6o3xbEGqXfa4ZBZAIE9i4hLvuJ7J0MVwnWCINjsUCzVYD5HjiKwsaEA523d1OsYnhnH3gNyeamqfPo8CFxHlnj0lWsGRpuQFPwu5gZDZD
WHATSAPP_PHONE_NUMBER_ID=1164922906709086
WHATSAPP_VERIFY_TOKEN=iqsl_whatsapp_verify_token_2026
MOCK_MODE=false
```

### WhatsApp API Details
- **Base Endpoint**: `https://graph.facebook.com/v25.0/1164922906709086/messages`
- **Webhook Callback URL**: `https://<YOUR_DOMAIN>/api/whatsapp/webhook`
- **Webhook Verify Token**: `iqsl_whatsapp_verify_token_2026`

---

### Node.js / Express Service (`whatsappService.js`)

```javascript
/**
 * Outbound WhatsApp Business Cloud API Service
 * Extracted from IQSL Project
 */
class WhatsAppService {
  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || 'EAAsZByXDhm5MBRzC7c34OX3IVCcuXTi2GQPdfAsVHutdyx3gkFsG0KyRWG8HOp2tz7pAt9uFdlIOIUA8JOmzC4SIFX7z6o3xbEGqXfa4ZBZAIE9i4hLvuJ7J0MVwnWCINjsUCzVYD5HjiKwsaEA523d1OsYnhnH3gNyeamqfPo8CFxHlnj0lWsGRpuQFPwu5gZDZD';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '1164922906709086';
    this.baseUrl = 'https://graph.facebook.com/v25.0';
  }

  /**
   * Send text message
   * @param {string} to - Recipient phone number with country code (e.g., "919399250600")
   * @param {string} text - Message body
   */
  async sendTextMessage(to, text) {
    if (!this.accessToken || process.env.MOCK_MODE === 'true') {
      console.log(`[WhatsApp Mock] Text to ${to}: "${text}"`);
      return { mock: true, success: true, to, text };
    }

    try {
      const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: to,
          type: 'text',
          text: { body: text }
        })
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('[WhatsApp Service] Send text failed:', data);
        return { success: false, error: data };
      }
      return { success: true, data };
    } catch (error) {
      console.error('[WhatsApp Service] Network error in sendTextMessage:', error);
      return { success: false, error };
    }
  }

  /**
   * Send Quick Reply Interactive Buttons (Max 3 buttons allowed by Meta)
   * @param {string} to 
   * @param {string} bodyText 
   * @param {Array<{id: string, title: string}>} buttons 
   */
  async sendInteractiveButtons(to, bodyText, buttons) {
    if (!this.accessToken || process.env.MOCK_MODE === 'true') {
      console.log(`[WhatsApp Mock] Buttons to ${to}: "${bodyText}"`, buttons);
      return { mock: true, success: true, to, bodyText, buttons };
    }

    try {
      const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: to,
          type: 'interactive',
          interactive: {
            type: 'button',
            body: { text: bodyText },
            action: {
              buttons: buttons.map(b => ({
                type: 'reply',
                reply: { id: b.id, title: b.title }
              }))
            }
          }
        })
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('[WhatsApp Service] Send buttons failed:', data);
        return { success: false, error: data };
      }
      return { success: true, data };
    } catch (error) {
      console.error('[WhatsApp Service] Network error in sendInteractiveButtons:', error);
      return { success: false, error };
    }
  }

  /**
   * Send PDF or Document link
   */
  async sendDocument(to, documentUrl, filename, caption) {
    try {
      const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: to,
          type: 'document',
          document: {
            link: documentUrl,
            filename: filename,
            caption: caption
          }
        })
      });

      const data = await response.json();
      return { success: response.ok, data };
    } catch (error) {
      return { success: false, error };
    }
  }

  /**
   * Send typing indicator to user
   */
  async sendTypingIndicator(to) {
    try {
      const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: to,
          type: 'typing_indicator',
          typing_indicator: { type: 'text' }
        })
      });

      const data = await response.json();
      return { success: response.ok, data };
    } catch (error) {
      return { success: false, error };
    }
  }
}

module.exports = new WhatsAppService();
```

---

### Node.js / Express Webhook Controller (`webhookController.js`)

```javascript
/**
 * WhatsApp Business API Webhook Handler
 * Handles GET (Meta Verification) and POST (Events / Messages)
 */
class WebhookController {
  
  /**
   * Verify Webhook Callback URL (GET /api/whatsapp/webhook)
   */
  async verifyWebhook(req, res) {
    try {
      const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'iqsl_whatsapp_verify_token_2026';
      
      // Parse query params safely using WHATWG URL API
      const parsedUrl = new URL(req.originalUrl, `http://${req.headers.host || 'localhost'}`);
      const mode = parsedUrl.searchParams.get('hub.mode');
      const token = parsedUrl.searchParams.get('hub.verify_token');
      const challenge = parsedUrl.searchParams.get('hub.challenge');

      if (mode && token) {
        if (mode === 'subscribe' && token === verifyToken) {
          console.log('[WhatsApp Webhook] Verified successfully!');
          return res.status(200).send(challenge);
        } else {
          console.warn('[WhatsApp Webhook] Verification failed. Token mismatch.');
          return res.status(403).send('Forbidden');
        }
      }
      
      return res.status(400).send('Bad Request');
    } catch (error) {
      console.error('[WhatsApp Webhook] Error during verification:', error);
      return res.status(500).send('Internal Server Error');
    }
  }

  /**
   * Receive WhatsApp Event Notifications (POST /api/whatsapp/webhook)
   */
  async handleWebhook(req, res) {
    try {
      const body = req.body;
      
      if (body.object !== 'whatsapp_business_account') {
        return res.status(200).send('EVENT_RECEIVED');
      }

      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          const value = change.value;
          if (!value) continue;

          // 1. Message status updates (sent, delivered, read, failed)
          if (value.statuses && value.statuses.length > 0) {
            for (const status of value.statuses) {
              const msgId = status.id;
              const msgStatus = status.status;
              const recipient = status.recipient_id;
              console.log(`[WhatsApp Webhook] Message ${msgId} to ${recipient} status: ${msgStatus}`);
            }
          }

          // 2. Incoming Messages
          if (value.messages && value.messages.length > 0) {
            for (const message of value.messages) {
              const from = message.from; // Phone number without + sign (e.g., 919399250600)

              // Text Message
              if (message.type === 'text' && message.text) {
                const messageText = message.text.body;
                console.log(`[WhatsApp Webhook] Text from ${from}: "${messageText}"`);
                // TODO: Process incoming text message
              } 
              // Interactive Button Reply Clicked
              else if (message.type === 'interactive' && message.interactive) {
                if (message.interactive.type === 'button_reply') {
                  const buttonId = message.interactive.button_reply.id;
                  console.log(`[WhatsApp Webhook] Button Click from ${from}: ${buttonId}`);
                  // TODO: Handle button action
                }
              }
            }
          }
        }
      }
      return res.status(200).send('EVENT_RECEIVED');
    } catch (error) {
      console.error('[WhatsApp Webhook] Error handling event:', error);
      return res.status(200).send('EVENT_RECEIVED'); // Always reply 200 OK to Meta
    }
  }
}

module.exports = new WebhookController();
```

---

### Express Router Registration (`routes.js`)

```javascript
const express = require('express');
const router = express.Router();
const webhookController = require('./webhookController');

// Public Webhook Endpoints for Meta WhatsApp API
router.get('/whatsapp/webhook', webhookController.verifyWebhook);
router.post('/whatsapp/webhook', webhookController.handleWebhook);

module.exports = router;
```
