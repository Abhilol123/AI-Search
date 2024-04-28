import { OllamaModels, Source } from "@/types";
import { Readability } from "@mozilla/readability";
import * as cheerio from "cheerio";
import { JSDOM } from "jsdom";
import type { NextApiRequest, NextApiResponse } from "next";
import { cleanSourceText } from "../../utils/sources";

type Data = {
  sources: Source[];
};

const searchHandler = async (req: NextApiRequest, res: NextApiResponse<Data>) => {
  try {
    const { query, model } = req.body as {
      query: string;
      model: OllamaModels;
    };

    console.log(`Search Query: ${query}`)

    const sourceCount = 4;

    // GET LINKS
    let response;
    try {
      response = await fetch(`https://www.google.com/search?q=${query}`);
    } catch (err) {
      console.log(err)
      res.status(500).json({ sources: [] });
      return;
    }
    const html = await response.text();
    const $ = cheerio.load(html);
    const linkTags = $("a");

    let links: string[] = [];

    linkTags.each((i, link) => {
      const href = $(link).attr("href");

      if (href && href.startsWith("/url?q=")) {
        const cleanedHref = href.replace("/url?q=", "").split("&")[0];

        if (!links.includes(cleanedHref)) {
          links.push(cleanedHref);

        }
      }
    });

    const filteredLinks = links.filter((link, idx) => {
      const excludeList = ["google", "facebook", "twitter", "instagram", "youtube", "tiktok"];
      const includeList = ["https://"]
      return excludeList.every((site) => !link.includes(site)) && includeList.some((site) => link.includes(site));
    });

    console.log(`Filtered links: ${filteredLinks.length}:`, filteredLinks)

    const finalLinks = filteredLinks.slice(0, sourceCount);

    console.log(`Final links: ${finalLinks.length}:`, finalLinks)

    // SCRAPE TEXT FROM LINKS
    const sources = (await Promise.all(
      finalLinks.map(async (link) => {
        try {
          const response = await fetch(link);
          const html = await response.text();
          const dom = new JSDOM(html);
          const doc = dom.window.document;
          const parsed = new Readability(doc).parse();

          if (parsed) {
            let sourceText = cleanSourceText(parsed.textContent);

            return { url: link, text: sourceText };
          }
          return undefined;
        } catch (err) {
          console.log(err);
          return undefined;
        }
      })
    )) as Source[];

    const filteredSources = sources.filter((source) => source !== undefined);

    for (const source of filteredSources) {
      source.text = source.text.slice(0, 10000);
    }

    res.status(200).json({ sources: filteredSources });
  } catch (err) {
    console.log(err);
    res.status(500).json({ sources: [] });
  }
};

export default searchHandler;
