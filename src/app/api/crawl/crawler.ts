import fetch from 'node-fetch';
import Papa from 'papaparse';

interface Page {
  url: string;
  content: any[];
}

class Crawler {
  async crawl(url: string): Promise<Page> {
    const csv = await this.fetchPage(url);
    return {
      url,
      content: this.parseCsv(csv),
    };
  }

  private async fetchPage(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.text();
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
