import { SearchQuery } from "@/types";
import { IconReload } from "@tabler/icons-react";
import { FC } from "react";

interface AnswerProps {
  searchQuery: SearchQuery;
  answer: string;
  done: boolean;
  onReset: () => void;
}

export const Answer: FC<AnswerProps> = ({ searchQuery, answer, done, onReset }) => {
  return (
    <div className="max-w-[800px] space-y-4 py-16 px-8 sm:px-24 sm:pt-16 pb-32">
      <div className="overflow-auto text-2xl sm:text-4xl">{searchQuery.query}</div>

      <div className="border-b border-zinc-800 pb-4">
        <div className="text-md text-blue-500">Answer</div>

        <div className="mt-2 overflow-auto">{replaceSourcesWithLinks(answer, searchQuery.sourceLinks, done)}</div>
      </div>

      {done && (
        <>
          <div className="border-b border-zinc-800 pb-4">
            <div className="text-md text-blue-500">Sources</div>

            {searchQuery.sourceLinks.map((source, index) => (
              <div
                key={index}
                className="mt-1 overflow-auto"
              >
                {`[${index + 1}] `}
                <a
                  className="hover:cursor-pointer hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                  href={source}
                >
                  {source.split("//")[1].split("/")[0].replace("www.", "")}
                </a>
              </div>
            ))}
          </div>

          <button
            className="flex h-10 w-52 items-center justify-center rounded-full bg-blue-500 p-2 hover:cursor-pointer hover:bg-blue-600"
            onClick={onReset}
          >
            <IconReload size={18} />
            <div className="ml-2">Ask New Question</div>
          </button>
        </>
      )}
    </div>
  );
};

const handleMarkdown = (text: string) => {
  let newText = text.split("**").map((line, index) => {
    if (index % 2 === 0) {
      return line;
    } else {
      return <strong key={index}>{line}</strong>;
    }
  });
  return newText;
}

const flattenArray = (arr: any): any => {
  let flatArray: any[] = [];
  for (let i = 0; i < arr.length; i++) {
    if (Array.isArray(arr[i])) {
      flatArray = flatArray.concat(flattenArray(arr[i]));
    } else {
      flatArray.push(arr[i]);
    }
  }
  return flatArray;
}

const handleCodeBlocks = (elements: any[]) => {
  const newElements: any[] = []; // Fixed typo in the variable name
  let i = 0;
  while (i < elements.length) {
    if (typeof elements[i] === "string" && elements[i].includes("```")) {
      // Skip the opening "```"
      i++;
      const codeBlock: any[] = [];
      // Collect elements until the closing "```" or end of array
      while (i < elements.length && !(typeof elements[i] === "string" && elements[i].includes("```"))) {
        codeBlock.push(elements[i]);
        i++;
      }
      // Skip the closing "```" if it exists
      if (i < elements.length && (typeof elements[i] === "string" && elements[i].includes("```"))) {
        i++;
      }
      newElements.push(<pre key={`${i}-codeblock`} style={{
        backgroundColor: "#3b3b3b",
        overflowX: "auto",
        borderRadius: "5px",
        padding: "0px 10px 10px 10px",
        marginTop: "10px",
      }}><code>{codeBlock}</code></pre>); // Join elements for display and wrap in <code>
    } else {
      if (typeof elements[i] === "string") {
        const codeLines = elements[i].split("`").map((line: string, index: number) => {
          if (index % 2 === 0) {
            return line;
          } else {
            return <code
              key={index}
              style={{
                color: "#8B0000",
                backgroundColor: "#808080",
                fontSize: "105%",
                borderRadius: "3px",
                padding: "2px 5px",
              }} >{line}</code>;
          }
        });
        for (const line of codeLines) {
          newElements.push(line);
        }
      } else {
        newElements.push(elements[i]);
      }
      i++;
    }
  }
  return newElements;
}

const replaceSourcesWithLinks = (answer: string, sourceLinks: string[], done: boolean) => {
  if (!done) {
    return <pre>{answer}</pre>;
  }
  let elements = answer.split(/(\[[0-9]+\])/).map((part, index) => {
    if (/\[[0-9]+\]/.test(part)) {
      const link = sourceLinks[parseInt(part.replace(/[\[\]]/g, "")) - 1];

      return (
        <a
          key={index}
          className="hover:cursor-pointer text-blue-500"
          href={link}
          target="_blank"
          rel="noopener noreferrer"
        >
          {part}
        </a>
      );
    } else {
      // Replace new lines with <br> tags
      const newLine = part.split("\n").map((line, index) => {
        return [...handleMarkdown(line),
        <br key={index} />]
      });

      return newLine;
    }
  });

  // Flatten the array
  elements = flattenArray(elements);

  const result = handleCodeBlocks(elements);

  return result;
};
