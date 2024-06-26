import { SearchQuery, Source } from "@/types";
import { IconArrowRight, IconBolt, IconSearch } from "@tabler/icons-react";
import { FC, KeyboardEvent, useEffect, useRef, useState } from "react";

interface SearchProps {
  onSearch: (searchResult: SearchQuery) => void;
  onAnswerUpdate: (answer: string) => void;
  onDone: (done: boolean) => void;
}

export const Search: FC<SearchProps> = ({ onSearch, onAnswerUpdate, onDone }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleSearch = async () => {
    if (!query) {
      alert("Please enter a query");
      return;
    }

    setLoading(true);
    const sources = await fetchSources();
    await handleStream(sources, query);
  };

  const fetchSources = async () => {
    const response = await fetch("/api/sources", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      setLoading(false);
      throw new Error(response.statusText);
    }

    const { sources }: { sources: Source[] } = await response.json();

    return sources;
  };

  const handleStream = async (sources: Source[], query: string) => {
    try {
      const prompt = `${sources.map((source, idx) => `Source [${idx + 1}]:\n${source.text}`).join("\n\n")}

Based on the information provided above, answer the following question. Ensure your response is original, and accurate. Include citations from the sources inline with each relevant piece of information, using the format [1], [2], etc. Cite immediately after each fact, not just at the end of sentences or paragraphs.

Give the answer in points

Question: ${query}`;

      const response = await fetch("/api/answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        setLoading(false);
        throw new Error(response.statusText);
      }

      setLoading(false);
      onSearch({ query, sourceLinks: sources.map((source) => source.url) });

      const data = response.body;

      if (!data) {
        return;
      }

      const reader = data.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);
        onAnswerUpdate(chunkValue);
      }

      onDone(true);
    } catch (err) {
      onAnswerUpdate("Error");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <>
      {loading ? (
        <div className="flex items-center justify-center pt-64 sm:pt-72 flex-col">
          <div className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <div className="mt-8 text-2xl">Getting answer...</div>
        </div>
      ) : (
        <div className="mx-auto flex h-full w-full max-w-[750px] flex-col items-center space-y-6 px-3 pt-32 sm:pt-64">
          <div className="flex items-center">
            <IconBolt size={36} />
            <div className="ml-1 text-center text-4xl">AI Search</div>
          </div>

          <div className="relative w-full">
            <IconSearch className="text=[#D4D4D8] absolute top-3 w-10 left-1 h-6 rounded-full opacity-50 sm:left-3 sm:top-4 sm:h-8" />

            <input
              ref={inputRef}
              className="h-12 w-full rounded-full border border-zinc-600 bg-[#2A2A31] pr-12 pl-11 focus:border-zinc-800 focus:bg-[#18181C] focus:outline-none focus:ring-2 focus:ring-zinc-800 sm:h-16 sm:py-2 sm:pr-16 sm:pl-16 sm:text-lg"
              type="text"
              placeholder="Ask anything..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />

            <button>
              <IconArrowRight
                onClick={handleSearch}
                className="absolute right-2 top-2.5 h-7 w-7 rounded-full bg-blue-500 p-1 hover:cursor-pointer hover:bg-blue-600 sm:right-3 sm:top-3 sm:h-10 sm:w-10"
              />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
