import OpenAI from "openai";
import { RunnerResponse, Tool } from "../functions";

type MessageWithReferences = OpenAI.ChatCompletionMessageParam & {
  copilot_references: Reference[];
};

interface Reference {
  type: string;
  data: any;
  id: string;
  metadata: any;
}

export class executeModel extends Tool {
  static definition = {
    name: "execute_model",
    description: `This function sends the prompt from the user's message to the specified model.".
Example Queries (IMPORTANT: Phrasing doesn't have to match):
- using gpt-4o-mini: what is 1+1?
- using Mistral-large: what is the capital of France?
- using cohere-command-r-plus: explain this code.
  `,
    parameters: {
      type: "object",
      properties: {
        model: {
          type: "string",
          description:
            "The name of the model to execute. It is ONLY the name of the model, not the publisher or registry. For example: `gpt-4o`, or `cohere-command-r-plus`.",
        },
        instruction: {
          type: "string",
          description: "The instruction to execute.",
        },
      },
      required: ["model", "instruction"],
    },
  };

  async execute(
    messages: MessageWithReferences[],
    args: {
      model: string;
      instruction: string;
    }
  ): Promise<RunnerResponse> {
    // Check if the user included any code references in their last message
    const lastMessage = messages[messages.length - 1];
    const importantRefs = lastMessage.copilot_references.filter(
      (ref) => ref.type === "client.selection" || ref.type === "client.file"
    );

    const content = [
      `The user has chosen to use the model named ${args.model}. Begin your response with the following phrase: "The model you've selected is ${args.model}".`,
      "Do not include any additional information about the selected model in this first sentence - ONLY the name.",
    ];

    if (importantRefs.length > 0) {
      content.push(
        "The user included the following context - you may find information in this context useful for your response:",
        JSON.stringify(importantRefs)
      );
    }

    return {
      model: args.model,
      messages: [
        {
          role: "system",
          content: content.join("\n"),
        },
        { role: "user", content: args.instruction },
      ],
    };
  }
}
