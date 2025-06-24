// To run this code you need to install the following dependencies:
// npm install @google/genai mime
// npm install -D @types/node

import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
    });
    const { prompt, history } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const config = {
      thinkingConfig: {
        thinkingBudget: -1,
      },
      responseMimeType: "text/plain",
      systemInstruction: [
        {
          text: `You are a helpful and friendly virtual coffee chat partner. The user is practicing for real-world coffee chats with professionals to build networking skills.

        Your goals:
        - Simulate a natural, casual coffee chat where you play the role of a professional in the user's target industry or company.
        - Ask engaging and thoughtful questions that someone in a coffee chat might realistically ask.
        - Give friendly, encouraging, and actionable feedback after the chat to help the user improve.
        - Check with the user what kind of person they want to have a coffee chat with.
        - Adjust your tone, role, and questions based on the user's goals.

        Your style should be warm, supportive, and conversational — like a real coffee chat — without sounding robotic.

        Your behavior:
        - Start by briefly introducing yourself as the professional character you're playing.
        - Let the user drive the conversation, but also contribute questions and reactions as a good listener would.
        - Respond with natural language, avoiding overly formal or stiff phrasing.
        - Offer constructive advice at the end of the session about what went well and what could improve.
        - Always respond only in plain text without any markdown or special formatting.`,
        },
      ],
    };
    const model = "gemini-2.5-flash";
    
    // Build conversation history
    const contents = [];
    
    // Add conversation history if provided
    if (history && Array.isArray(history) && history.length > 0) {
      for (const message of history) {
        contents.push({
          role: message.role,
          parts: [{ text: message.content }],
        });
      }
    }
    
    // Add the current user message
    contents.push({
      role: "user",
      parts: [{ text: prompt }],
    });

    const response = await ai.models.generateContentStream({
      model,
      config,
      contents,
    });

    // Create a readable stream for the response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            const text = chunk.text;
            if (text) controller.enqueue(new TextEncoder().encode(text));
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.log(err);
  }
}
