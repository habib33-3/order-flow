import { Injectable } from "@nestjs/common";

import { BaseMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";

import { env } from "../env/env";
import { LLM_MAX_RETRIES, LLM_TIMEOUT_MS } from "./llm.constants";

@Injectable()
export class LlmService {
    private readonly model: ChatOpenAI;

    constructor() {
        this.model = new ChatOpenAI({
            apiKey: env.OPENROUTER_API_KEY,
            model: env.OPENROUTER_MODEL,
            temperature: 0.2,
            timeout: LLM_TIMEOUT_MS,
            maxRetries: LLM_MAX_RETRIES,
            configuration: {
                baseURL: "https://openrouter.ai/api/v1",
            },
        });
    }

    getModel() {
        return this.model;
    }

    async invoke(input: string | BaseMessage[]) {
        return this.model.invoke(input);
    }
}
