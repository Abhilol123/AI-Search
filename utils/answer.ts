import { OllamaModels } from "@/types";

export const OllamaStream = async (prompt: string) => {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const res = await fetch(`http://${process.env.OLLAMA_API_HOST}:${process.env.OLLAMA_API_PORT}/api/chat`, {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({
      model: OllamaModels.WIZARDLM2,
      messages: [
        { role: "system", content: "You are a helpful assistant that accurately answers the user's queries based on the given text." },
        { role: "user", content: prompt }
      ],
      // max_tokens: 120,
      temperature: 0.0,
      stream: true
    })
  });

  if (!res.ok) {
    throw new Error("Ollama API returned an error");
  }

  const stream = new ReadableStream({
    async start(controller) {
      const reader = res.body!.getReader(); // Get a readable stream reader

      try {
        while (true) {
          try {
            const { done, value } = await reader.read(); // Read from the stream
            const steam_data = decoder.decode(value)
            const new_data = JSON.parse(steam_data);
            if (done || new_data["done"]) {
              console.log("Stream complete", new_data)
              break; // Exit the loop when done
            }
            const text_data = new_data["message"]["content"];
            // parser.feed(text_data);
            const queue = encoder.encode(text_data);
            controller.enqueue(queue);
          } catch (e) {
            console.error(e);
          }
        }
      } finally {
        controller.close();
        reader.releaseLock(); // Release the lock when done
      }
    }
  });

  return stream;
};
