/**
 * Outbound WhatsApp Business Cloud API Service
 * Integrated from remaining.md specification
 */
export class WhatsAppService {
  private accessToken: string;
  private phoneNumberId: string;
  private baseUrl: string;

  constructor() {
    this.accessToken =
      process.env.WHATSAPP_ACCESS_TOKEN ||
      'EAAsZByXDhm5MBRzC7c34OX3IVCcuXTi2GQPdfAsVHutdyx3gkFsG0KyRWG8HOp2tz7pAt9uFdlIOIUA8JOmzC4SIFX7z6o3xbEGqXfa4ZBZAIE9i4hLvuJ7J0MVwnWCINjsUCzVYD5HjiKwsaEA523d1OsYnhnH3gNyeamqfPo8CFxHlnj0lWsGRpuQFPwu5gZDZD';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '1164922906709086';
    this.baseUrl = 'https://graph.facebook.com/v25.0';
  }

  /**
   * Send text message
   * @param to Recipient phone number with country code (e.g., "919399250600")
   * @param text Message body
   */
  async sendTextMessage(to: string, text: string) {
    if (!this.accessToken || process.env.MOCK_MODE === 'true') {
      console.log(`[WhatsApp Mock] Text to ${to}: "${text}"`);
      return { mock: true, success: true, to, text };
    }

    try {
      const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'text',
          text: { body: text },
        }),
      });

      const data = (await response.json()) as any;
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
   */
  async sendInteractiveButtons(
    to: string,
    bodyText: string,
    buttons: Array<{ id: string; title: string }>
  ) {
    if (!this.accessToken || process.env.MOCK_MODE === 'true') {
      console.log(`[WhatsApp Mock] Buttons to ${to}: "${bodyText}"`, buttons);
      return { mock: true, success: true, to, bodyText, buttons };
    }

    try {
      const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'interactive',
          interactive: {
            type: 'button',
            body: { text: bodyText },
            action: {
              buttons: buttons.map((b) => ({
                type: 'reply',
                reply: { id: b.id, title: b.title },
              })),
            },
          },
        }),
      });

      const data = (await response.json()) as any;
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
  async sendDocument(to: string, documentUrl: string, filename: string, caption?: string) {
    try {
      const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'document',
          document: {
            link: documentUrl,
            filename,
            caption,
          },
        }),
      });

      const data = (await response.json()) as any;
      return { success: response.ok, data };
    } catch (error) {
      return { success: false, error };
    }
  }

  /**
   * Send typing indicator to user
   */
  async sendTypingIndicator(to: string) {
    try {
      const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'typing_indicator',
          typing_indicator: { type: 'text' },
        }),
      });

      const data = (await response.json()) as any;
      return { success: response.ok, data };
    } catch (error) {
      return { success: false, error };
    }
  }
}

export const whatsappService = new WhatsAppService();
