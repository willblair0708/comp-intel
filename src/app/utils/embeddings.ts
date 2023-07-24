import Bottleneck from 'bottleneck';
import { OpenAIApi, Configuration } from "openai-edge";

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(config);

// Create a new limiter with a desired rate
const limiter = new Bottleneck({
  minTime: 200, // Let's say we want to wait at least 200ms between API calls
});

export async function getEmbeddings(input: string) {
  try {
    const response = await limiter.schedule(() => openai.createEmbedding({
      model: "text-embedding-ada-002",
      input: input.replace(/\n/g, ' ')
    }));

    const result = await response.json();
    if (result.data && result.data.length > 0) {
      return result.data[0].embedding as number[]
    } else {
      // Handle the case when data is not available
      console.error('No data available in the response');
      return []; // You should decide what to return or throw in this case
    }

  } catch (e) {
    console.log("Error calling OpenAI embedding API: ", e);
    throw new Error(`Error calling OpenAI embedding API: ${e}`);
  }
}
