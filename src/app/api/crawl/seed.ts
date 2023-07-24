import { getEmbeddings } from "@/utils/embeddings";
import { Document, MarkdownTextSplitter, RecursiveCharacterTextSplitter } from "@pinecone-database/doc-splitter";
import { utils as PineconeUtils, Vector } from "@pinecone-database/pinecone";
import md5 from "md5";
import { getPineconeClient } from "@/utils/pinecone";
import { Crawler, Page } from "./crawler";
import { truncateStringByBytes } from "@/utils/truncateString"
import { chunk } from 'lodash'; // lodash is a utility library that provides helpful functions like "chunk"

const { chunkedUpsert, createIndexIfNotExists } = PineconeUtils

interface SeedOptions {
  splittingMethod: string
  chunkSize: number
  chunkOverlap: number
}

type DocumentSplitter = RecursiveCharacterTextSplitter | MarkdownTextSplitter

async function seed(url: string, limit: number, indexName: string, options: SeedOptions) {
  try {
    const pinecone = await getPineconeClient();
    const { splittingMethod, chunkSize, chunkOverlap } = options;
    const crawler = new Crawler();
    const page = await crawler.crawl(url);
    const pages = [page]; // Wrap the single page in an array to work with the rest of the code
    const splitter: DocumentSplitter = splittingMethod === 'recursive' ?
      new RecursiveCharacterTextSplitter({ chunkSize, chunkOverlap }) : new MarkdownTextSplitter({});
    const documents = await Promise.all(pages.map(page => prepareDocument(page, splitter)));
    await createIndexIfNotExists(pinecone!, indexName, 1536);
    const index = pinecone && pinecone.Index(indexName);
    
    // Chunk the documents into smaller groups to respect API rate limits
    const documentChunks = chunk(documents.flat(), 20); // Adjust the chunk size as needed

    // Process each chunk separately
    const vectorChunks: Vector[][] = await Promise.all(documentChunks.map(async (documentChunk) => {
      return await Promise.all(documentChunk.map(embedDocument));
    }));

    // Flatten the chunks back into a single array
    const vectors: Vector[] = ([] as Vector[]).concat(...vectorChunks);
    
    await chunkedUpsert(index!, vectors, '', 10);
    return documents[0];
  } catch (error) {
    console.error("Error seeding:", error);
    throw error;
  }
}

async function embedDocument(doc: Document): Promise<Vector> {
  try {
    const embedding = await getEmbeddings(doc.pageContent);
    const hash = md5(doc.pageContent);
    return {
      id: hash,
      values: embedding,
      metadata: {
        chunk: doc.pageContent,
        text: doc.metadata.text as string,
        url: doc.metadata.url as string,
        hash: doc.metadata.hash as string
      }
    } as Vector;
  } catch (error) {
    console.log("Error embedding document: ", error)
    throw error
  }
}

async function prepareDocument(page: Page, splitter: DocumentSplitter): Promise<Document[]> {
  const documents: Document[] = [];

  // Loop over each object in the page content array
  for (const obj of page.content) {
    // Convert the object to a string
    const objStr = JSON.stringify(obj);

    // Split the document
    const docs = await splitter.splitDocuments([
      new Document({
        pageContent: objStr,
        metadata: {
          url: page.url,
          text: truncateStringByBytes(objStr, 36000)
        },
      }),
    ]);

    // Add a hash to the document metadata and add it to the documents array
    documents.push(
      ...docs.map((doc: Document) => {
        return {
          pageContent: doc.pageContent,
          metadata: {
            ...doc.metadata,
            hash: md5(doc.pageContent)
          },
        };
      })
    );
  }

  return documents;
}

export default seed;
