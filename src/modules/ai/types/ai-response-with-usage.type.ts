export interface AiUsageInfo {
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
}

export interface AiResponseWithUsage<T> {
  data: T;
  usage: AiUsageInfo;
}
