import React, { useEffect, useRef, useState } from "react";

// @ts-ignore – using remote ESM module
import * as webllm from "https://esm.run/@mlc-ai/web-llm";

const ChatBox: React.FC = () => {
  const [engine] = useState(() => new webllm.MLCEngine());
  const [models] = useState(() => webllm.prebuiltAppConfig.model_list.map((m:any) => m.model_id));
  const [selectedModel, setSelectedModel] = useState("Llama-3-8B-Instruct-q4f32_1-MLC-1k");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "system",
      content: `Hi how can I help you?`,
    },
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState("");
  const chatBoxRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  };

  const handleModelInit = async () => {
    setStatus("Initializing model...");
    engine.setInitProgressCallback((report: any) => {
      setStatus(report.text);
    });
    await engine.reload(selectedModel, { temperature: 1.0, top_p: 1 });
    setStatus("Ready!");
  };

  const sendMessage = async () => {
    if (!input.trim() || isGenerating) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages([...newMessages, { role: "assistant", content: "typing..." }]);
    setInput("");
    setIsGenerating(true);

    try {
      let curMessage = "";
      const completion = await engine.chat.completions.create({
        stream: true,
        messages: newMessages,
      });

      for await (const chunk of completion) {
        const delta = chunk.choices[0].delta.content;
        if (delta) {
          curMessage += delta;
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: "assistant", content: curMessage };
            return updated;
          });
          scrollToBottom();
        }
      }

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: curMessage };
        return updated;
      });

    } catch (err) {
      console.error("Generation failed", err);
    }

    setIsGenerating(false);
  };

  return (
    <div style={{ maxWidth: 600, margin: "auto", fontFamily: "sans-serif" }}>
      <h2>🧠 WebLLM Chat</h2>

      <label>
        <b>Model:</b>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          disabled={isGenerating}
        >
          {models.map((m:any) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <button onClick={handleModelInit} disabled={isGenerating}>
          Load Model
        </button>
      </label>

      <div style={{ fontSize: "0.9rem", marginBottom: "1rem", color: "#555" }}>{status}</div>

      <div
        id="chat-box"
        ref={chatBoxRef}
        style={{
          border: "1px solid #ccc",
          height: 300,
          overflowY: "auto",
          padding: "0.5rem",
          marginBottom: "1rem",
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              textAlign: msg.role === "user" ? "right" : "left",
              margin: "0.5rem 0",
            }}
          >
            <strong>{msg.role === "user" ? "You" : "AI"}:</strong> {msg.content}
          </div>
        ))}
      </div>

      <textarea
        
        style={{ width: "100%", resize: "none" }}
        placeholder="Type your question..."
        value={input}
        onChange={(e:any) => {
            setInput(e.target.value)
        }}
        onKeyDown={(e:any)=>{
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault(); // prevent newline
                sendMessage();
              }
        }}
      ></textarea>

      <button
        onClick={sendMessage}
        disabled={isGenerating || status !== "Ready!"}
        style={{ marginTop: "0.5rem", width: "100%" }}
      >
        {isGenerating ? "Generating..." : "Send"}
      </button>
    </div>
  );
};

export default ChatBox;
