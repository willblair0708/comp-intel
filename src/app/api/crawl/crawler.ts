import csvParser from 'csv-parser';
import axios from 'axios';
import { promisify } from 'util';
import stream, { pipeline } from 'stream';

class Person {
  constructor(
    public Name: string,
    public Class: string,
    public URL: string,
    public Email: string,
    public Company: string,
    public Position: string,
    public Location: string,
    public Skills: string,
    public PastJobTitles: string,
    public Organizations: string,
    public About: string,
  ) { }
}

class CsvCrawler {
  private people: Person[] = [];

  constructor(private maxPeople = 250) { }

  async crawl(csvUrl: string): Promise<Person[]> {
    // Read the CSV file from URL and add people to the queue
    await this.addToQueueFromCsv(csvUrl);

    // Return the list of crawled people
    return this.people;
  }

  private async addToQueueFromCsv(csvUrl: string) {
    const response = await axios.get(csvUrl, { responseType: 'stream' });
    const asyncPipeline = promisify(pipeline);

    return new Promise<void>((resolve, reject) => {
      asyncPipeline(
        response.data,
        csvParser(),
        new stream.Writable({
          objectMode: true,
          write: (data: any, _: string, callback: (error?: Error | null) => void) => {
            const person = new Person(
              data.Name,
              data.Class,
              data.URL,
              data.Email,
              data.Company,
              data.Position,
              data.Location,
              data.Skills,
              data.PastJobTitles,
              data.Organizations,
              data.About,
            );
            this.addToQueue(person);
            callback();
          },
        })
      )
      .then(resolve)
      .catch(reject);
    });
  }

  private addToQueue(person: Person) {
    if (this.people.length < this.maxPeople) {
      this.people.push(person);
    }
  }
}

export function generateTimestampAsString(): string {
  const now = new Date();
  const year = now.getFullYear().toString().padStart(4, '0');
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export { CsvCrawler };
export type { Person };
