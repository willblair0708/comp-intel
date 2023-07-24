import axios from 'axios';
import Papa from 'papaparse';

interface Page {
  url: string;
  content: any[];
}

class Crawler {
  // Modify the crawl method to accept the Google Sheets URL directly
  async crawl(url: string): Promise<Page> {
    const csv = await this.fetchPage(url);
    return {
      url,
      content: this.parseCsv(csv),
    };
  }

  private async fetchPage(url: string): Promise<string> {
    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch ${url}: ${error}`);
      return '';
    }
  }

  private parseCsv(csv: string): any[] {
    const parsed = Papa.parse(csv, { header: true });
    return parsed.data;
  }
}

export { Crawler };
export type { Page };