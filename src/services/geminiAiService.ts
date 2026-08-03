import { GoogleGenerativeAI } from '@google/generative-ai';
import Package from '../models/Package';

export class GeminiAiService {
  private genAI: GoogleGenerativeAI | null = null;
  private modelName = 'gemini-1.5-flash';

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async generateResponseForWhatsApp(customerQuery: string): Promise<string> {
    try {
      const packages = await Package.find({ isActive: true }).select(
        'title slug pricePerPerson discountedPrice durationDays difficulty baseLocation batches'
      ).limit(10);

      const packagesContext = packages.map((pkg) => ({
        title: pkg.title,
        price: pkg.discountedPrice || pkg.pricePerPerson,
        duration: `${pkg.durationDays || 5} Days`,
        difficulty: pkg.difficulty || 'Moderate',
        baseLocation: pkg.baseLocation || 'Uttarakhand',
        upcomingBatches: (pkg.batches || []).filter((b) => b.isOpen).map((b) => ({
          startDate: b.startDate ? new Date(b.startDate).toISOString().split('T')[0] : '',
          availableSeats: (b.totalSeats || 20) - (b.bookedSeats || 0),
        })),
      }));

      const systemPrompt = `You are Explore Wallah's friendly, highly knowledgeable AI Travel Assistant responding on WhatsApp.
Your goal is to help travelers discover treks & trips, check batch availability, explain difficulty/itineraries, and encourage booking.

Active Explore Wallah Travel Packages Context:
${JSON.stringify(packagesContext, null, 2)}

User Question: "${customerQuery}"

Instructions:
- Keep your response friendly, enthusiastic, concise (suitable for WhatsApp), and well-formatted.
- Always quote prices in INR (₹).
- Include relevant package highlights and available batch dates.
- If asking for booking, provide a friendly direct link hint like "visit explorewallah.com".`;

      if (this.genAI) {
        const model = this.genAI.getGenerativeModel({ model: this.modelName });
        const result = await model.generateContent(systemPrompt);
        const response = result.response.text();
        return response.trim();
      }

      return `Hello! Explore Wallah AI Assistant here. We have amazing treks like Kedarkantha and Hampta Pass starting at ₹10,500. Visit explorewallah.com to book your adventure!`;
    } catch (error) {
      console.error('Error generating Gemini AI response:', error);
      return `Hello! Thank you for contacting Explore Wallah. Our team is ready to assist you. What destination are you looking to explore?`;
    }
  }
}

export const geminiAiService = new GeminiAiService();
