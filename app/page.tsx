"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Send } from "lucide-react"

interface Message {
  role: "user" | "model";
  content: string;
}

export default function CoffeeChatHome() {
  const [aiResponse, setAiResponse] = useState(
    "Hello! I'm your AI coffee companion. Type a message below to start our conversation.",
  )
  const [userInput, setUserInput] = useState("")
  const [conversationHistory, setConversationHistory] = useState<Message[]>([])
  const [apiKey, setApiKey] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // const handleSaveApiKey = (key: string) => {
  //   setApiKey(key)
  // }

  const handleSendMessage = () => {
    if (userInput.trim() === "") return

    const currentUserMessage = userInput.trim();
    
    const req = new Request("/api/send-prompt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        prompt: currentUserMessage,
        history: conversationHistory,
        apiKey: apiKey
      }),
    })

    fetch(req)
      .then(async (res) => {
        if (!res.ok) throw new Error("Network response was not ok")
        
        // Handle streaming response
        const reader = res.body?.getReader()
        if (!reader) throw new Error("No response body")
        
        let accumulatedText = ""
        setAiResponse("") // Clear previous response
        
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          const chunk = new TextDecoder().decode(value)
          accumulatedText += chunk
          setAiResponse(accumulatedText)
        }
        
        // Update conversation history when response is complete
        setConversationHistory(prev => [
          ...prev,
          { role: "user", content: currentUserMessage },
          { role: "model", content: accumulatedText }
        ])
      })
      .catch((err) => {
        console.log(err)
        setAiResponse("Sorry, there was an error. Please try again.")
      })

    setUserInput("") // Clear the input after sending
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserInput(e.target.value)
  }

  const clearConversation = () => {
    setConversationHistory([])
    setAiResponse("Hello! I'm your AI coffee companion. Type a message below to start our conversation.")
  }

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      const scrollHeight = textareaRef.current.scrollHeight
      const lineHeight = 20 // reduced line height for mobile
      const maxHeight = lineHeight * 5 // reduced to 5 lines max for mobile
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`
    }
  }, [userInput])

  return (
    <div className="h-full w-full flex flex-col items-center justify-center">
      {/* New Chat Button */}
      {conversationHistory.length > 0 && (
        <div className="absolute top-4 right-4">
          <Button
            onClick={clearConversation}
            variant="outline"
            className="text-sm"
          >
            New Chat
          </Button>
        </div>
      )}
      
      {/* Chat Bubble positioned above coffee */}
      <div className="relative flex-shrink-0">
        {/* Speech Bubble */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-3 sm:px-6 sm:py-4 shadow-lg max-w-xs sm:max-w-sm mb-2 sm:mb-4 relative">
          <p className="text-gray-800 text-center text-sm sm:text-base leading-tight">{aiResponse}</p>
          {/* Speech bubble tail pointing down */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
            <div className="w-0 h-0 border-l-[8px] sm:border-l-[12px] border-r-[8px] sm:border-r-[12px] border-t-[8px] sm:border-t-[12px] border-l-transparent border-r-transparent border-t-white/90"></div>
          </div>
        </div>

        {/* Coffee Emoji */}
        <div className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl text-center">☕</div>
      </div>

      {/* Text Input Box - Responsive Width */}
      <div className= "p-2 flex flex-col md:flex-row gap-2 w-full h-60max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-4xl items-end flex-shrink-0">
        <textarea
          ref={textareaRef}
          placeholder="Type your message..."
          value={userInput}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          className="flex-1 w-full bg-white/80 backdrop-blur-sm border rounded-lg px-3 py-2 text-sm resize-none overflow-y-auto focus:outline-none  min-h-40 md:min-h-36 leading-5 sm:leading-6 scrollbar-hide"
          rows={1}
          style={{
            maxHeight: "100px", // reduced max height for mobile
            scrollbarWidth: "none", // Firefox
            msOverflowStyle: "none", // IE/Edge
          }}
        />
        <Button
          onClick={handleSendMessage}
          className="text-white px-3 sm:px-4 w-full md:w-9 h-9 sm:h-10 flex-shrink-0"
        >
          <Send className="w-3 h-3 sm:w-4 sm:h-4" />
        </Button>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <input
          type="text"
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
          placeholder="Enter Gemini API Key"
          className="border rounded-lg p-2 text-sm w-64 bg-white focus:outline-none"
        />
        {/* <Button
          onClick={() => console.log(apiKey)}
          variant="outline"
          className="text-xs"
        >
          Print API Key
        </Button> */}
      </div>
    </div>
  )
}
