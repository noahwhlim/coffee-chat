/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Use a secure environment variable (without NEXT_PUBLIC_ prefix)
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const { prompt, history } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // System instructions and context for the LLM
    const systemContext = `You are a helpful and friendly virtual coffee chat partner. The user is practicing for real-world coffee chats with professionals to build networking skills.

        Your goals:
        - Simulate a natural, casual coffee chat where you play the role of a professional in the user’s target industry or company.
        - Ask engaging and thoughtful questions that someone in a coffee chat might realistically ask.
        - Give friendly, encouraging, and actionable feedback after the chat to help the user improve.
        - Adjust your tone, role, and questions based on the user’s goals (for example, an engineer at a startup, a product manager at a big tech company, a recruiter, etc.).

        Your style should be warm, supportive, and conversational — like a real coffee chat — without sounding robotic.

        Your behavior:
        - Start by briefly introducing yourself as the professional character you’re playing.
        - Let the user drive the conversation, but also contribute questions and reactions as a good listener would.
        - Respond with natural language, avoiding overly formal or stiff phrasing.
        - Offer constructive advice at the end of the session about what went well and what could improve.
        - Always respond only in plain text without any markdown or special formatting.`;

    // Prepare the conversation history
    const formattedHistory = Array.isArray(history) ? history : [];
    const messages: { role: string; content: string }[] = [];

    // If this is the very first message in the conversation
    if (formattedHistory.length === 0) {
      messages.push({ role: "user", content: `${systemContext}\n\n${prompt}` });
    } else {
      messages.push(...formattedHistory); // existing history
      messages.push({ role: "user", content: prompt }); // new user message
    }

    // console.log(messages)

    const response = await ai.models.generateContentStream({
      model: "gemini-2.0-flash",
      contents: messages.map((m) => ({ role: m.role, parts: [{ text: m.content }] })),
    });

    console.log(response)
    // messages.push({role: "system", content: response})

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

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in AI request:", error);
    return NextResponse.json(
      { error: "Internal server error dick" },
      { status: 500 }
    );
  }
}
