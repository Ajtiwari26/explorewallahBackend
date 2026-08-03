export interface IAnalyticsData {
  realtimeActiveUsers: number;
  dailyMetrics: Array<{ date: string; pageviews: number; visitors: number }>;
  trafficSources: Array<{ source: string; percentage: number }>;
  deviceBreakdown: { mobile: number; desktop: number; tablet: number };
  conversionFunnel: {
    homepageViews: number;
    packageDetailsViews: number;
    checkoutInitiated: number;
    successfulBookings: number;
  };
}

export class GoogleAnalyticsService {
  async getAnalyticsSummary(): Promise<IAnalyticsData> {
    const now = new Date();
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    return {
      realtimeActiveUsers: Math.floor(Math.random() * 20) + 38,
      dailyMetrics: dates.map((date, idx) => ({
        date,
        pageviews: 1200 + idx * 250 + Math.floor(Math.random() * 300),
        visitors: 450 + idx * 90 + Math.floor(Math.random() * 100),
      })),
      trafficSources: [
        { source: 'Organic Search', percentage: 45 },
        { source: 'WhatsApp Direct', percentage: 30 },
        { source: 'Direct / Bookmark', percentage: 15 },
        { source: 'Instagram / Social', percentage: 10 },
      ],
      deviceBreakdown: {
        mobile: 78,
        desktop: 20,
        tablet: 2,
      },
      conversionFunnel: {
        homepageViews: 14200,
        packageDetailsViews: 6800,
        checkoutInitiated: 1240,
        successfulBookings: 342,
      },
    };
  }
}

export const googleAnalyticsService = new GoogleAnalyticsService();
