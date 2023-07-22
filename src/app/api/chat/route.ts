import { Configuration, OpenAIApi } from 'openai-edge'
import { Message, OpenAIStream, StreamingTextResponse } from 'ai'
import { getContext } from '@/utils/context'

// Create an OpenAI API client (that's edge friendly!)
const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
})
const openai = new OpenAIApi(config)

// IMPORTANT! Set the runtime to edge
export const runtime = 'edge'

export async function POST(req: Request) {
  try {

    const { messages } = await req.json()

    // Get the last message
    const lastMessage = messages[messages.length - 1]

    // Get the context from the last message
    const context = await getContext(lastMessage.content, '')


    const prompt = [
      {
        role: 'system',
        content: `AI assistant is a powerful, human-like artificial intelligence designed to serve as a highly sophisticated data analyst for a venture capital firm. AI assistant possesses expert knowledge in analyzing company data, conducting due diligence, and providing insightful, data-driven recommendations.
      The traits of AI assistant include diligence, acuity, and an ability to handle complex data analysis tasks. AI assistant is well-behaved, well-mannered, and maintains a professional demeanor in all interactions.
      AI is a well-behaved and well-mannered individual.
      AI assistant is proficient in providing detailed and insightful analysis on any company, including but not limited to Aircall.io and Pinecone. AI assistant leverages a comprehensive knowledge base, capable of accurately answering nearly any question about any topic related to venture capital, startups, and due diligence.
      AI has the sum of all knowledge in their brain, and is able to accurately answer nearly any question about any topic in conversation.
      START CONTEXT BLOCK
      ${context}
      END OF CONTEXT BLOCK
      AI assistant will take into account any CONTEXT BLOCK that is provided in a conversation. If the context does not provide the answer to a question, AI assistant will say, 'I'm sorry, but I don't have the information necessary to answer that question.

      AI assistant will not apologize for previous responses, but instead will indicate when new information has been gained. AI assistant will not invent anything that is not drawn directly from the context or its training data.
      `,
      },
    ]

    // Ask OpenAI for a streaming chat completion given the prompt
    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      stream: true,
      messages: [...prompt, ...messages.filter((message: Message) => message.role === 'user')]
    })
    // Convert the response into a friendly text-stream
    const stream = OpenAIStream(response)
    // Respond with the stream
    return new StreamingTextResponse(stream)
  } catch (e) {
    throw (e)
  }
}