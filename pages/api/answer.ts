import { OllamaStream } from "@/utils/answer";

export const config = {
  runtime: "edge"
};

const handler = async (req: Request): Promise<Response> => {
  try {
    const { prompt } = (await req.json()) as {
      prompt: string;
    };

    const stream = await OllamaStream(prompt);

    return new Response(stream);
  } catch (error) {
    console.error(error);
    return new Response("Error", { status: 500 });
  }
};

export default handler;
