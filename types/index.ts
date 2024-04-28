export enum OpenAIModel {
  DAVINCI_TURBO = "wizardlm2:latest"
}

export type Source = {
  url: string;
  text: string;
};

export type SearchQuery = {
  query: string;
  sourceLinks: string[];
};
