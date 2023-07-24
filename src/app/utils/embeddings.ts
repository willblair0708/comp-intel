
import { OpenAIApi, Configuration } from "openai-edge";

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
})
const openai = new OpenAIApi(config)

export async function getEmbeddings(input: string) {
  try {
    const response = await openai.createEmbedding({
      model: "text-embedding-ada-002",
      input: input.replace(/\n/g, ' ')
    })

    // Wait for 1 second before returning the result
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        const result = await response.json();
        resolve(result.data[0].embedding as number[]);
      }, 1000);
    });

  } catch (e) {
    console.log("Error calling OpenAI embedding API: ", e);
    throw new Error(`Error calling OpenAI embedding API: ${e}`);
  }
}
