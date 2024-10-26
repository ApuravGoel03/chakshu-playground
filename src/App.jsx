import React, { useEffect, useState, useRef } from 'react';
import './App.css';

const App = () => {
  const [isListening, setIsListening] = useState(false); // Whether we are listening for a prompt after wake word
  const [response, setResponse] = useState(''); // Stores the response
  const recognitionRef = useRef(null); // Reference to store recognition instance
  const [isRecognitionActive, setIsRecognitionActive] = useState(false); // Tracks if recognition is running at all
  const [activated, setActivated] = useState(false);
  const synth = window.speechSynthesis;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  useEffect(() => {
    if (!SpeechRecognition) {
      console.error("SpeechRecognition API is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true; // Keep running continuously
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;
    
    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
      
      if (transcript.includes('okay chakshu')) {
        setIsListening(true); // Now, we are actively listening for the user's command
        handlePromptListening();
      }
    };

    recognition.onend = () => {
      console.log("recognition ended")
      setIsRecognitionActive(false); // If the recognition stops for any reason, update the state
    };

    recognition.onerror = (event) => {
      console.error('SpeechRecognition error:', event.error);
      if (event.error === 'no-speech' || event.error === 'aborted') {
        restartRecognition();
      }
    };

    // Start the recognition service initially
    startRecognition();

    return () => {
      recognition.stop(); // Clean up on unmount
    };
  }, []);

  const startRecognition = () => {
    if (!isRecognitionActive && recognitionRef.current) {
      recognitionRef.current.start();
      setIsRecognitionActive(true); // Recognition is running, listening for wake word
    }
  };

  const stopRecognition = () => {
    if (isRecognitionActive && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecognitionActive(false);
    }
  };

  const restartRecognition = () => {
    stopRecognition();
    setTimeout(() => {
      startRecognition(); // Restart recognition after brief delay
    }, 500);
  };

  const handlePromptListening = () => {
    recognitionRef.current.onresult = (event) => {
      const userCommand = event.results[event.results.length - 1][0].transcript.trim();
      if (!userCommand.toLowerCase().includes('okay chakshu')) {
        setResponse(`You said: "${userCommand}". Sample response generated.`);
        setIsListening(false); // Stop listening after receiving the command
        handleSpeakResponse();
      }
    };
  };

  const handleSpeakResponse = () => {
    const utterThis = new SpeechSynthesisUtterance(response || 'Sample response generated.');
    synth.speak(utterThis);
    setIsListening(true);
  };
  const handleActivation = () => {
    setActivated(true); // User has interacted with the page
  };


  return (
    <div className="app">
   {!activated? (
        <button onClick={handleActivation}>
          Activate Chakshu
        </button>
      ) : (
        <>
          <h1>Chakshu Assistant</h1>
          <div className="status">
            {isListening ? <p>Listening for your prompt...</p> : <p>Say "Ok Chakshu" to start.</p>}
            {response && <p>Response: {response}</p>}
          </div>
        </>
      )}

    </div>
  );
};

export default App;
