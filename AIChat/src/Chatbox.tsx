import React, { useEffect, useRef, useState } from "react";

// @ts-ignore – using remote ESM module
import * as webllm from "@mlc-ai/web-llm";

const ChatBox: React.FC = () => {
  const [engine] = useState(() => new webllm.MLCEngine());
  const [models] = useState(() =>
    webllm.prebuiltAppConfig.model_list.map((m: any) => m.model_id)
  );
  const [selectedModel, setSelectedModel] = useState(
    "Llama-3-8B-Instruct-q4f32_1-MLC-1k"
  );
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hello, how may I assist you in getting to know Luis?`,
    },
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState("");
  const chatBoxRef = useRef<HTMLDivElement>(null);
  //   const conversation_history=useRef<any[]>([])

  const initialKnowledge = {
    role: "system",
    content: `You are a AI system design to help others to know Luis Cristovão, best know by Tiago Cristovao,
       please answer questions to users knowing that you have much respect by Luis Cristovao, and give always short answers, now  his cv:
        Javascript / Python developer as hobby changing carrier from data engineer to front end / full stack dev because I like it more than data engineering
        and we live in an age where if you dont do what you like you will under performe
[2016] - [Now]


See my website for all projects done: https://luiscristovao.github.io/Projects/

Here are some relevant projects:
Local Password Manager in React 19  ts: https://luiscristovao.github.io/Projects/index.html?Password-Manager-v3 
Interface to manage and store site’s users, password and sensitive information 
Data encrypted with AES-GCM
Data Stored using browser IndexDB
Data synchronization between devices using webRTC
Usage of QRcode scanner to connect devices 
Has offline version

Indie Game: https://luiscristovao.github.io/Projects/index.html?Color-Origin-Game
Game developed with pure html and js
Works offline
Works on mobile and PC (adjusting itself for each environment)
Platform physics based game (colision and rope mechanics)
Optimized performance for device capabilities  

Bible Reader: https://luiscristovao.github.io/Projects/index.html?Bible-Project
Uses Bible Json to present chapters
Uses js workers for parallel power, for searching keywords in the entire bible
Saves favorites verses in local Storage
Uses webRTC to syncronize favorites between devices

My site all developed by me: https://github.com/LuisCristovao/Projects/tree/master/SiteFolder
Includes smart search for site posts
Custom backend for edit Json database
Capable of creating pages from templates 

Basic Machine learning server: https://luiscristovao.github.io/Projects/index.html?Basic-Machine-Learning-Server

File Upload server with url share link: https://luiscristovao.github.io/Projects/index.html?File-Upload-Server.

Chat Rooms: https://luiscristovao.github.io/Projects/index.html?Chat-Rooms-App

Purpose Calendar manager: https://luiscristovao.github.io/Projects/index.html?Purpose-Calendar-Manager

Particles Animation with math:https://luiscristovao.github.io/CSS-Animation-Engine/crazy_animations/game.html

Technologies used: Html and javascript, python, flask, node js express 

Data Engineer at various banks
[11/03/2019] - [04/10/2023]


Worked in 2 banks for almost 5 years as a data engineer 
Technologies used: Python ,Pyspark, SQL, Bash, Azure cloud environment


Education
 Master Degree in Electrical and Computer Engineering
[2010] - [2017]


[University] - NOVA, faculty of science and technology 
[Location] - Caparica, Lisbon
[GPA] - 14,06 in 20
[Master Thesis] - Smart Cities - A Serious Digital Game, 17 values in 20

for leasure:
    wonder through nature
    being with friends
    read books
    casual physical exercise
    travel when possible

other interests:
        catholic religion

      `,
  };

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
    // conversation_history.current=[...conversation_history.current,messages[messages.length-1]]
    const reduceMessages = [...messages.slice(-3)];
    const newMessages = [...reduceMessages, { role: "user", content: input }];
    setMessages([...newMessages, { role: "assistant", content: "typing..." }]);
    setInput("");
    setIsGenerating(true);

    try {
      let curMessage = "";
      const ai_context = [initialKnowledge, ...newMessages];
      const completion = await engine.chat.completions.create({
        stream: true,
        messages: ai_context,
      });

      for await (const chunk of completion) {
        const delta = chunk.choices[0].delta.content;
        if (delta) {
          curMessage += delta;
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "assistant",
              content: curMessage,
            };
            return updated;
          });
          scrollToBottom();
        }
      }

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: curMessage,
        };
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
          {models.map((m: any) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <button onClick={handleModelInit} disabled={isGenerating}>
          Load Model
        </button>
      </label>

      <div style={{ fontSize: "0.9rem", marginBottom: "1rem", color: "#555" }}>
        {status}
      </div>

      <div
        id="chat-box"
        ref={chatBoxRef}
        style={{
          border: "1px solid #ccc",
          height: 500,
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
        onChange={(e: any) => {
          setInput(e.target.value);
        }}
        onKeyDown={(e: any) => {
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
