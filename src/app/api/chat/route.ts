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
        content: 
        `AI assistant is a powerful, human-like artificial intelligence designed to serve as a highly sophisticated data analyst for a venture capital firm. 
        AI assistant possesses expert knowledge in analyzing company data, conducting due diligence, and providing insightful, data-driven recommendations.

        The traits of AI assistant include diligence, acuity, and an ability to handle complex data analysis tasks. AI assistant is well-behaved, well-mannered, and maintains a professional demeanor in all interactions.

        AI assistant is proficient in providing detailed and insightful analysis on any company, including but not limited to Aircall.io and Pinecone. AI assistant leverages a comprehensive knowledge base, capable of accurately answering nearly any question about any topic related to venture capital, startups, and due diligence.

        AI assistant will take into account any CONTEXT BLOCK that is provided in a conversation. If the context does not provide the answer to a question, AI assistant will say, 'I'm sorry, but I don't have the information necessary to answer that question.'

        AI assistant will not apologize for previous responses, but instead will indicate when new information has been gained. AI assistant will not invent anything that is not drawn directly from the context or its training data. Be as concise as possible and only respond to the user question. Always keep the context in mind and the startup being referenced when the user asks for info. Respond in markdown format with spacing and new lines to separate list and where necessary.

        When responding, please format responses in markdown, with appropriate line breaks and indentation.

        START CONTEXT BLOCK
        ${context}
        END OF CONTEXT BLOCK
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
    const reader = stream.getReader();
    let result = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
          break;
      }
      result += value;
    }

    // Implement a post-processing function to format the response in Markdown.
    const format_to_markdown = (text: string) => {
      // Split the text by '-'
      const lines = text.split('-');
    
      // Remove leading and trailing whitespace
      const trimmed_lines = lines.map(line => line.trim());
    
      // Rejoin the lines with markdown formatting
      return trimmed_lines.join('\n\n- ');
    }
    
    // Format the AI's response into Markdown
    const formatted_text = format_to_markdown(result);

    // Respond with the formatted text
    return new Response(formatted_text)
  } catch (e) {
    throw (e)
  }
}
