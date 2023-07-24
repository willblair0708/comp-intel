import { getEmbeddings } from "@/utils/embeddings";
import { Document, MarkdownTextSplitter, RecursiveCharacterTextSplitter } from "@pinecone-database/doc-splitter";
import { utils as PineconeUtils, Vector } from "@pinecone-database/pinecone";
import md5 from "md5";
import { getPineconeClient } from "@/utils/pinecone";
import { CsvCrawler, Person, generateTimestampAsString } from "./crawler";
import { truncateStringByBytes } from "@/utils/truncateString";

const { chunkedUpsert, createIndexIfNotExists } = PineconeUtils;

interface SeedOptions {
  splittingMethod: string;
  chunkSize: number;
  chunkOverlap: number;
}

type DocumentSplitter = RecursiveCharacterTextSplitter | MarkdownTextSplitter;

async function seed(csvUrl: string, limit: number, indexName: string, options: SeedOptions) {
  try {
    const pinecone = await getPineconeClient();
    const { splittingMethod, chunkSize, chunkOverlap } = options;
    const crawler = new CsvCrawler(limit || 100);
    const persons = await crawler.crawl(csvUrl) as Person[];
    const splitter: DocumentSplitter = splittingMethod === 'recursive'
      ? new RecursiveCharacterTextSplitter({ chunkSize, chunkOverlap })
      : new MarkdownTextSplitter({});
    const documents = await Promise.all(persons.map(person => prepareDocument(person, splitter)));
    await createIndexIfNotExists(pinecone!, indexName, 1536);
    const index = pinecone && pinecone.Index(indexName);
    const vectors = await Promise.all(documents.flat().map(embedDocument));
    await chunkedUpsert(index!, vectors, csvUrl, 10);
    return documents[0];
  } catch (error) {
    console.error("Error seeding:", error);
    throw error;
  }
}

async function embedDocument(doc: Document): Promise<Vector> {
  try {
    const timestamp = generateTimestampAsString();
    const embedding = await getEmbeddings(doc.pageContent);
    const hash = md5(doc.pageContent);
    return {
      id: hash,
      values: embedding,
      metadata: {
        chunk: doc.pageContent,
        text: doc.metadata.text as string,
        hash: doc.metadata.hash as string,
        Name: doc.metadata.Name as string,
        Class: doc.metadata.Class as string,
        URL: doc.metadata.URL as string,
        Email: doc.metadata.Email as string,
        Company: doc.metadata.Company as string,
        Position: doc.metadata.Position as string,
        Location: doc.metadata.Location as string,
        Skills: doc.metadata.Skills as string,
        PastJobTitles: doc.metadata.PastJobTitles as string,
        Organizations: doc.metadata.Organizations as string,
        About: doc.metadata.About as string,
        timestamp: timestamp as string,
      },
    } as Vector;
  } catch (error) {
    console.log("Error embedding document: ", error);
    throw error;
  }
}

async function prepareDocument(person: Person, splitter: DocumentSplitter): Promise<Document[]> {
  const pageContent = `${person.Name} ${person.Class} ${person.URL} ${person.Email} ${person.Company} ${person.Position} ${person.Location} ${person.Skills} ${person.PastJobTitles} ${person.Organizations} ${person.About}`;
  const docs = await splitter.splitDocuments([
    new Document({
      pageContent,
      metadata: {
        text: truncateStringByBytes(pageContent, 36000),
        ...person
      },
    }),
  ]);
  return docs.map((doc: Document) => {
    return {
      pageContent: doc.pageContent,
      metadata: {
        ...doc.metadata,
        hash: md5(doc.pageContent),
      },
    };
  });
}

export default seed;
