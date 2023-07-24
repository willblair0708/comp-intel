export async function getEmbeddings(input: string) {
  try {
    const response = await limiter.schedule(() => openai.createEmbedding({
      model: "text-embedding-ada-002",
      input: input.replace(/\n/g, ' ')
    }));

    // Check if the response is valid
    if (!response.ok) {
      console.error(`OpenAI API responded with status ${response.status}: ${response.statusText}`);
      throw new Error(`OpenAI API responded with status ${response.status}: ${response.statusText}`);
    }

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
