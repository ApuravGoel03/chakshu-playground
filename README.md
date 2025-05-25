
<h1 align="center">🧠 Chakshu</h1>
<h3 align="center">An AI-Powered Wikipedia Screen Reader for the Blind and Visually Impaired</h3>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-React.js-blue?logo=react" />
  <img src="https://img.shields.io/badge/Type-PWA-green?logo=pwa" />
  <img src="https://img.shields.io/badge/Accessibility-Enabled-critical?logo=accessibility" />
  <!-- <img src="https://img.shields.io/badge/License-MIT-yellow.svg" /> -->
</p>

---

## 📌 Overview

**Chakshu** is an inclusive, open-source Progressive Web App (PWA) built using **React.js** to make Wikipedia accessible to the blind and visually impaired. With intelligent **voice commands**, **speech synthesis**, and **AI-driven image captioning**, Chakshu redefines how visually impaired users interact with encyclopedic knowledge.

> “A tool that listens, understands, and reads the world to those who see it differently.”

---

---
## ✨ Key Features

- 🔊 **Wake Word Detection** using `"assistant"` to initiate interaction hands-free.
- 📖 **Smart Listening Modes**: Choose from Short Description, Summary, Full Article, Image Captions, and References.
- 🧮 **Reads Complex Content**: Mathematical expressions via MathJax, chemical formulas via custom parsers.
- 🖼️ **Contextual Image Captions** powered by LLaVa-LLaMA 3.1 and WizardLM 2.
- 📦 **Offline-Ready as PWA**: Persistent speech recognition, caching, and smooth UX.
- 🧠 **Speech-to-Text & Text-to-Speech**: Fully browser-native using Web Speech API.

---

## 🛠️ Tech Stack

| Layer     | Technology                                   |
|-----------|----------------------------------------------|
| Frontend  | React.js, Vite.js, MUI, Web Speech API       |
| Backend   | Django, BeautifulSoup, Azure Container Apps  |
| AI Models | LLaVa-Llama 3.1, WizardLM 2                  |
| Database  | Supabase (MySQL)                             |
| Deployment| PWA, Azure                                   |

---

## 🧩 Architecture & Workflow

1. **Voice Activation**: App listens for the wake word `"assistant"`.
2. **Speech Recognition**: User query is captured using Web Speech API.
3. **Query Handling**: Backend fetches Wikipedia content via Google Search.
4. **Content Parsing**: Math, chemical notations, tables, and images are parsed.
5. **Speech Output**: Parsed content is spoken aloud using TTS.
6. **Interaction Modes**: Users can choose how deeply they want to explore content.

---

## 🎯 Setup Instructions

### 🚀 Run Locally

```bash
git clone https://github.com/your-username/chakshu-frontend.git
cd chakshu-frontend
npm install
npm run dev
```

### 📦 Build for Production

```bash
npm run build
```

---


## 🧪 Sample Use Case

```plaintext
🧑 User: "Assistant"
🔈 Chakshu: "Please speak your query."
🎵 *Beep sound indicating listening*

🧑 User: "Assistant Narendra Modi"
🔈 Chakshu: "Processing your request. Please wait."
🔈 Chakshu: "Select an option:"
    Option 1: Narendra Modi – Short Description
    Option 2: Narendra Modi – Summary
    Option 3: Narendra Modi – Full Article
    ...

🧑 User: "Assistant option one"
🔈 Chakshu: "Select a content mode:"
    Option 1: Short Description
    Option 2: Summary
    Option 3: Read Full Page
    Option 4: Image Captions
    Option 5: References

🧑 User: "Assistant option two"
🔈 Chakshu: "Summary is: Narendra Modi is the Prime Minister of India..."

🧑 User: "Assistant pause" ➡️ Pauses speech
🧑 User: "Assistant continue" ➡️ Resumes speech
🧑 User: "Assistant reload" ➡️ Reloads the app
```


---


## 🧠 Core Logic Functions

### 🔊 `speak(text)`

* Converts plain text into speech using `SpeechSynthesisUtterance`.
* Selects an Indian English voice if available.
* Adds the spoken text to the on-screen chat interface.

---

### 🔗 `fetchData(url)`

* Calls the backend API endpoint and returns parsed JSON.
* Handles HTTP errors (400, 401, 403, 404, 500, 503) and speaks appropriate error messages using TTS.
* Repeats the message `"Processing your request. Please wait."` every 10 seconds until response is received.

---

### 🧏‍♂️ `handlePromptListening(prompt)`

* Handles voice input that follows after the wake word (`assistant`).
* If prompt is empty, prompts user to speak their query.
* If prompt exists, removes wake word and processes it as a command.

---

### 📥 `handleSubmit(speech)`

* Triggered after capturing the user’s speech input.
* Adds user message to chat and passes it to phase-based logic handler.

---

### 🧠 `processSpeechInput(speechText)`

* Controls which function to trigger based on the current interaction `phase`:

  * `QUERY` → calls `callQueryAPI()`
  * `LINK_SELECTION` → calls `callLinkAPI()`
  * `OPTION_SELECTION` → calls `callOptionAPI()`

---

### 🌐 `callQueryAPI(query)`

* Makes a request to `/api/search/?q=<query>` on the backend.
* Fetches and speaks article links with brief descriptions.
* Populates the `links` array for later selection.

---

### 🔎 `callLinkAPI(speech)`

* Parses user’s speech for keywords like "one", "two", etc. to determine selected article.
* Calls `/api/select/?link=<link>` to get available content options (summary, captions, etc.).
* Speaks out all options with indexes for selection.

---

### 📚 `callOptionAPI(option)`

* Matches the user's spoken option (1 to 5) to specific content:

  1. **Short Description**
  2. **Summary**
  3. **Read Full Page**
  4. **Image Captions**
  5. **References**
* Calls `/api/process/?link=<article>&option=<number>` accordingly.
* Speaks back the content using TTS.


---


## 🔍 Code Highlights

- ⚙️ Dynamic `SpeechRecognition` and `SpeechSynthesis` setup using `useEffect`
- 🔄 State-driven architecture with `phases` like `QUERY`, `LINK_SELECTION`, `OPTION_SELECTION`
- 🔊 Audio feedback using `<audio>` cues and real-time voice updates
- 🧠 Context-aware API integration with real-time error handling

---

## 🧱 Modular Architecture

```
chakshu-frontend/
├── public/
├── src/
│   ├── App.jsx         # Main app logic with TTS, STT, UI
│   ├── App.css         # Styling
│   ├── assets/         # Audio cues, icons
│   └── components/     # [Optional] Modular UI components
└── README.md
```


---

## 🌐 References

- [Web Speech API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Whisper - OpenAI](https://openai.com/research/whisper)
- [MathJax](https://www.mathjax.org/)
- [Supabase](https://supabase.com/)
- [LLaVa @ Huggingface](https://huggingface.co/LLaVA)
- [WizardLM](https://huggingface.co/WizardLM)

---

> For a world where knowledge is not just seen, but heard and understood.
