import { useState, useEffect, useRef } from 'react'
import './App.css'
import { Box } from '@mui/material';

let links = [];
let article = '';
const url = 'https://chakshu-container.ambitiousrock-b8622b04.westus2.azurecontainerapps.io'
function App() {

  const [messages, setMessages] = useState([]); // Holds the chat messages
  const [options, setOptions] = useState([]); // Holds the options for user commands
  const [voices, setVoices] = useState([]);
  const [phases, setPhases] = useState("QUERY")
  const [pause, setPause] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  //const [links, setLinks] = useState([])
  const [selectedopt, setSelectedOpt] = useState(0)
  const synthRef = useRef(window.speechSynthesis);
  const divRef = useRef(null); 
  const [isListening, setIsListening] = useState(false); // Whether we are listening for a prompt after wake word
  const [response, setResponse] = useState(''); // Stores the response
  const recognitionRef = useRef(null); // Reference to store recognition instance
  const [isRecognitionActive, setIsRecognitionActive] = useState(false); // Tracks if recognition is running at all
  const [temp, setTemp] = useState(0)
  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const isSpeakingRef = useRef(false); // Prevent repeated triggers

  
  
  const wakeword = 'assistant'
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  

  // const playAudio = async () => {
  //   if (!audioRef.current) return;

  //   return new Promise((resolve) => {
  //     audioRef.current.onended = resolve; // Resolve promise when audio ends
  //     audioRef.current.play();
  //   });
  // };
  useEffect(() => {
    audioRef.current = new Audio('/activateSound.mp3');
    audioRef.current.preload = 'auto'; // Preload the audio
    audioRef.current.crossOrigin = 'anonymous'; // Fix CORS issues if applicable

    audioRef.current.addEventListener('canplaythrough', () => {
      console.log('Audio loaded and ready to play');
    });

    audioRef.current.addEventListener('error', (e) => {
      console.error('Audio loading error:', e);
    });

    return () => {
      audioRef.current = null;
    };
  }, []);
  
  const fetchData = async (url) =>{
    speak("Processing your request. Please wait.")
    // Start interval to notify user every 10 seconds
    const intervalId = setInterval(() => {
      speak("Processing your request. Please wait.")
    }, 10000);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        switch (response.status) {
          case 400:
            throw new Error('Bad Request – The server could not understand the request.');
          case 401:
            throw new Error('Unauthorized – You need to log in.');
          case 403:
            throw new Error('Forbidden – You don’t have permission to access this.');
          case 404:
            throw new Error('Not Found – The requested resource was not found.');
          case 500:
            throw new Error('Internal Server Error – Please try again later.');
          case 503:
            throw new Error('Service Unavailable – The server is temporarily unavailable.');
          default:
            throw new Error(`Unexpected Error – Status: ${response.status}`);
        }
      }
  
      const json = await response.json();
      console.log(json);
      // Stop the interval once data is fetched
      clearInterval(intervalId);
      return json;
    } catch (error) {
      console.error(error.message);
      speak(error.message);
      // Stop the interval once data is fetched
      clearInterval(intervalId);
      throw error;
    }
  }
  const pauseSpeech = () => {
    audioRef.current.play();
    if (synthRef.current.speaking && !synthRef.current.paused) {
      console.log('Pausing speech...');
      synthRef.current.pause();
      setPause(true);
    }
  };
  
  const continueSpeech = () => {
    audioRef.current.play();
    if (synthRef.current.paused) {
      console.log('Resuming speech...');
      synthRef.current.resume();
      setPause(false);
    }
  };
  
  const reloadApp = async () => {
    audioRef.current.play();
    setTimeout(()=>{window.location.reload();},500) 
  };

  const getAudioStream = async () => {
    const baseConstraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      }
    };
  
    try {
      const stream = await navigator.mediaDevices.getUserMedia(baseConstraints);
      console.log("Stream with noise cancellation acquired.");
      return stream;
    } catch (err) {
      console.warn("Noise cancellation constraints not supported or denied. Retrying without them.", err);
  
      // Retry without noise cancellation
      const fallbackConstraints = {
        audio: true
      };
  
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
        console.log("Fallback stream acquired without noise suppression.");
        return fallbackStream;
      } catch (finalErr) {
        console.error("Failed to access microphone at all:", finalErr);
        return null;
      }
    }
  };
  
  useEffect(() => {
    const populateVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
        console.log('Available voices:', availableVoices);
    };

    // Populate voices on component mount
    populateVoices();
    window.speechSynthesis.cancel()
    // Add event listener for voice changes
    window.speechSynthesis.onvoiceschanged = populateVoices;
    // Clean up the event listener on component unmount
    return () => {
        window.speechSynthesis.onvoiceschanged = null;
    };
  }, []); // Empty dependency array to run only once

  useEffect(() => {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      console.error("SpeechRecognition API is not supported in this browser.");
      return;
    }
  
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;
  
    // Set up audio context and analyser for volume detection
    const setupAudioAnalysis = async () => {
      const stream = await getAudioStream()
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      const data = new Uint8Array(analyser.fftSize);
  
      source.connect(analyser);
  
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
  
      const detectSpeech = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const val = (data[i] - 128) / 128;
          sum += val * val;
        }
        const rms = Math.sqrt(sum / data.length);
  
        if (rms > 0.03 && !isSpeakingRef.current) {
          isSpeakingRef.current = true;
          startRecognition();
        }
  
        // Reset flag if quiet
        if (rms < 0.02) {
          isSpeakingRef.current = false;
        }
  
        requestAnimationFrame(detectSpeech);
      };
  
      detectSpeech();
    };
  
    setupAudioAnalysis();
  
    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
      console.log("Transcript:", transcript);
  
      if (transcript.includes(`${wakeword} pause`) || transcript.includes(`${wakeword} pose`)) {
        pauseSpeech();
      } else if (transcript.includes(`${wakeword} continue`) || transcript.includes(`${wakeword} resume`)) {
        continueSpeech();
      } else if (transcript.includes(`${wakeword} reload`)) {
        reloadApp();
      } else if (transcript.includes(wakeword) && temp === 0) {
        setIsListening(true);
        audioRef.current.play();
        handlePromptListening("");
      } else if (temp > 0) {
        handlePromptListening(transcript);
      }
    };
  
    recognition.onend = () => {
      console.log("Recognition ended");
      restartRecognition();
    };
  
    recognition.onerror = (event) => {
      console.error('SpeechRecognition error:', event.error);
      if (event.error === 'aborted') restartRecognition();
    };
  
    return () => {
      recognition.stop();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [temp]);
  

  useEffect(() => {
    console.log("******************",phases)
  }, [phases]);

  const startRecognition = () => {
    //if (!isRecognitionActive && recognitionRef.current) {
      // if ( recognitionRef.current) {
      recognitionRef.current.start();
      setIsRecognitionActive(true); // Recognition is running, listening for wake word
    //}
  };

  const stopRecognition = () => {
    //if (isRecognitionActive && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecognitionActive(false);
    //}
  };
  
  const restartRecognition = () => {
    console.log("reached here in restart")
    stopRecognition();
    console.log("Recognition status", isRecognitionActive)
    //if (!isRecognitionActive) {
      console.log("Restarting recognition...");
      startRecognition();
    //}
    // setTimeout(() => {
      
    // }, 500); // Small delay to prevent immediate re-triggering issues
  };


  const handlePromptListening = async (prompt) => {
    if (prompt.length === 0) {
      console.log("Listening to Prompt");
      speak("Please speak your query.")
      recognitionRef.current.onresult = async (event) => {
        let userCommand = event.results[event.results.length - 1][0].transcript.trim();
        console.log("userCommand", userCommand);
    
        if (
          ( userCommand.toLowerCase().includes(wakeword))
        ) {
          window.speechSynthesis.cancel()
          audioRef.current.play();
          let commandWords = userCommand.split(" ");
          commandWords.splice(0,1);
          userCommand = commandWords.join(" ")
          handleSubmit(userCommand);
          setResponse(`You said: "${userCommand}". Sample response generated.`);
          setIsListening(false); // Stop listening after receiving the command
        }
      };
    } else {
      let userCommand = prompt;
      console.log("userCommand", userCommand);
    
      if (
        ( userCommand.toLowerCase().includes(wakeword))
      ) {
        window.speechSynthesis.cancel()
        audioRef.current.play();
        let commandWords = userCommand.split(" ");
        commandWords.splice(0,1);
        userCommand = commandWords.join(" ")
        handleSubmit(userCommand);
        setResponse(`You said: "${userCommand}". Sample response generated.`);
        setIsListening(false); // Stop listening after receiving the command
      }
    }
    
    
  };
  

  // useEffect(() =>{
  //   const handleKeydown = (event) => {
  //     if (event.ctrlKey) {
  //         event.preventDefault();
  //         // Pause/Resume speech synthesis
  //         if (synthRef.current.speaking) {
  //           console.log("hello")
            
  //             if (pause && (synthRef.current.pending || synthRef.current.speaking)) {
  //               console.log("Played");
  //               setPause(false);
  //               synthRef.current.resume();
  //             } else {
  //               console.log("Rukja")
  //               setPause(true);
  //               synthRef.current.pause();
  //             }
             

  //             // if(!synthRef.current.paused && synthRef.current.pending) {
  //             //   //synthRef.current.resume()
  //             // }
  //         }
  //         console.log(synthRef.current);
  //     }
  //   };
  //   document.addEventListener('keydown', handleKeydown);

  //   return () => {
  //     document.removeEventListener('keydown', handleKeydown);
  //   };
  // },[isSpeaking, pause])

  // useEffect(() => {
  //   const handleKeyDown = (event) => {
  //     if(event.key === 'Enter' || event.code === 'Space' || event.ctrlKey) return
  //     console.log('link ke ander useffect')
  //     if(synthRef.current.speaking) {synthRef.current.cancel();
  //       setPause(false);
  //     }
  //     const key = parseInt(event.key, 10); // Convert the key to an integer
  //     console.log(event.key)
  //     addMessage(key,'user')
  //     if (!isNaN(key) && key >= 1 && key <= links.length) {
  //       setSelectedArticle(links[key - 1])
  //       callLinkAPI(selectedArticle)
  //     }
  //     else{
  //       speak(`Press the correct link`)
  //     }
  //   };

  //   if(phases === 'LINK_SELECTION') window.addEventListener('keydown', handleKeyDown);
  //   return () => {
  //     window.removeEventListener('keydown', handleKeyDown);
  //   };
  // }, [links, phases]);

  // useEffect(() => {
  //   const handleKeyDown = (event) => {
  //     if(event.key === 'Enter' || event.code === 'Space' || event.ctrlKey) return
  //     console.log('option ke ander vale useeffect')
  //     if(synthRef.current.speaking) {synthRef.current.cancel()
  //       setPause(false);
  //     }
  //     const key = parseInt(event.key, 10); // Convert the key to an integer
  //     addMessage(key,'user')
  //     if (!isNaN(key) && key >= 1 && key <= options.length) {
  //       setSelectedOpt(key)
  //       callOptionAPI(key)
  //     }
  //     else{
  //       speak(`Press the correct option`)
  //     }
  //   };

  //   if(phases === 'OPTION_SELECTION') window.addEventListener('keydown', handleKeyDown);
  //   return () => {
  //     window.removeEventListener('keydown', handleKeyDown);
  //   };
  // }, [options]);

  // useEffect(() => {
  //   const scrollToBottomSmoothly = () => {
  //     if (synthRef.current.speaking&& !synthRef.current.paused && divRef.current) {
  //       const targetScrollTop = divRef.current.scrollHeight;
  //       const currentScrollTop = divRef.current.scrollTop;
  //       const step = 10; // Adjust step for speed (higher values scroll faster)
  //       if (currentScrollTop < targetScrollTop) {
  //         const newScrollTop = Math.min(currentScrollTop + step, targetScrollTop);
  //         divRef.current.scrollTop = newScrollTop;
  //         setTimeout(scrollToBottomSmoothly, 20); // Adjust timeout for speed (lower values scroll faster)
  //       }
  //     }
  //   };
  //   scrollToBottomSmoothly();
  // }, [messages]);

  const handleSubmit = (speech) =>{
    console.log("Function called with ",speech)
    addMessage(speech, 'user');
    processSpeechInput(speech);
  }


  const processSpeechInput = (speechText) => {
    if (speechText.trim() === '') return; // Ignore empty input
    if (phases === "QUERY") {
      callQueryAPI(speechText);
      setPhases("LINK_SELECTION")
      console.log("............",phases);
    } 
    else if (phases === "LINK_SELECTION") {
        callLinkAPI(speechText);
    } else if (phases === "OPTION_SELECTION") {
        callOptionAPI(speechText);
    }
  };

  const addMessage = (text, sender) => {
    setMessages((prevMessages) => [...prevMessages, { text, sender }]);
  };

  const callQueryAPI = async (query) => {
    // Api calling here for links fetching based on query
    const apiUrl = `${url}//api/search/?q=${query}`
    const response = await fetchData(apiUrl)
    if(response === "Error"){
      speak("Error in fetching data")
      return
    }
    console.log("callQueryAPI ")
    speak(response.message);
    response.results.map((result,index) =>{
      links.push(result.url);
      console.log(result.url)
      speak(`Option ${index + 1}:\nTitle : ${result.title}\nShort Description : ${result.short_description}`)
    })
    console.log(links)
  };

  const callLinkAPI = async (speech) => {
    // Api calling here for telling the user options available
    var index = 0;
    
    if (speech.includes("1") || speech.includes("one") || speech.includes("won")) {
      index = 0;
    } 
    else if (speech.includes("2") || speech.includes("to") || speech.includes("two") || speech.includes("too")) {
      index = 1;
    } 
    else if (speech.includes("3") || speech.includes("three") || speech.includes("tree")) {
      index = 2;
    } 
    else if (speech.includes("4") || speech.includes("four") || speech.includes("for") ) {
      index = 3;
    } else if (speech.includes("5") || speech.includes("five")) {
      index = 4;
    }
    else if (speech.includes("6") || speech.includes("six")) {
      index = 5;
    }
    else if (speech.includes("7") || speech.includes("seven")) {
      index = 6;
    }
    else if (speech.includes("8") || speech.includes("eight")) {
      index = 7;
    }
    else if (speech.includes("9") || speech.includes("nine")) {
      index = 8;
    }
    else if (speech.includes("10") || speech.includes("ten") || speech.includes("tan")) { 
      index = 9;
    }
    else{
      speak("Can't understand. Please speak the option number!")
      return
    }
    console.log(index)
    console.log(links)
    article = links[index]
    setPhases("OPTION_SELECTION")
    const url2 = `${url}//api/select/?link=${article}`
    const response = await fetchData(url2)
    if(response === "Error"){
      speak("Error in fetching data")
      return
    }
    console.log("callLinkAPI")

    speak(response.message)
    response.options.map((option,index) => {
      setOptions((options) => [...options, option])
      console.log(phases)
      speak(`Option ${index + 1} for ${option}`)
    })
    
  };

  const callOptionAPI = async (option) => {
    // Api calling here to get the content based on selected article and option
    console.log("callOptionAPI")
    console.log(phases)
    console.log(option)

    //logic to fetch index from "one", "two / to" , "three", "won", "for"
    //for now hardcoded

    if (option.includes("1") || option.includes("one") || option.includes("won")) {
      const response = await fetchData(`${url}//api/process/?link=${article}&option=1`)
      if(response === "Error"){
        speak("Error in fetching data")
        return
      }
      speak("Short Description is ")
      speak(response.short_description);
    } 
    else if (option.includes("2") || option.includes("to") || option.includes("two") || option.includes("too")) {
      const response = await fetchData(`${url}//api/process/?link=${article}&option=2`)
      if(response === "Error"){
        speak("Error in fetching data")
        return
      }
      speak("Summary is ")
      speak(response.summary);
    } 
    else if (option.includes("3") || option.includes("three") || option.includes("tree")) {
      const response = await fetchData(`${url}//api/process/?link=${article}&option=3`)
      if(response === "Error"){
        speak("Error in fetching data")
        return
      }
      speak("Reading the whole page")
      speak(response.text);
    } 
    else if (option.includes("4") || option.includes("four") || option.includes("for") ) {
      const response = await fetchData(`${url}//api/process/?link=${article}&option=4`)
      if(response === "Error"){
        speak("Error in fetching data")
        return
      }
      speak("Image Captions are ")
      response.text.map((result,index)=>{
        speak(`Image ${index + 1} : ${result.final_caption}`)
      })
    } else if (option.includes("5") || option.includes("five")) {
      const response = await fetchData(`${url}//api/process/?link=${article}&option=5`)
      if(response === "Error"){
        speak("Error in fetching data")
        return
      }
      if(response.text.length !== 0){
        speak("References are ")
        response.text.map((ref) => {
          console.log(ref)
          speak(ref)
        })
      }
      else{
        speak("No references available")
      }
    }
    else{
      speak("Can't understand. Please speak the option number!")
    }
  };

  const speak = (text) => {
    if (!window.speechSynthesis) {
        console.error('Speech synthesis not supported in this browser.');
        return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN'; // Set language to Indian English if available

    // Use Indian English voice if available
    const indianVoice = voices.find(voice => voice.lang === 'en-IN');
    if (indianVoice) {
        utterance.voice = indianVoice;
    }

    // Debugging: Log the text being spoken
    console.log('Speaking:', text);
    // console.log(utterance)
    // Event listeners for speech
    utterance.onstart = () => {console.log('Speech has started');
      // console.log(synthRef.current);
      if(pause){
        synthRef.current.pause();
      }
      else{
        synthRef.current.resume();
      }
    }
    utterance.onend = (event) => {
      // console.log('Speech has ended', event, synthRef.current)
      if(synthRef.current.paused && (synthRef.current.pending || synthRef.current.speaking)){
        setPause(true);
      }
    
    }
    
    utterance.onerror = (event) => console.error('Speech synthesis error:', event.error);
    utterance.onpause = (event) => {console.log("paused", event)}

    setIsSpeaking(true)
    synthRef.current.speak(utterance);
    addMessage(text,'system')
    setTemp(temp+1)
  };


  // console.log("pause", pause)
  // const resetToInitialState = () => {
  //   setOptions([]);
  //   setPhases('QUERY')
  // };
  return (
    <div className="app">
        <>
          <div style={{display:'flex',flexDirection:'column', justifyContent:'center', height:'100vh',margin:'0'}}>
      <div style={{color:'#3795BD',height:'15%', padding:'2px 10px'}}>
        <h1>CHAKSHU</h1>
      </div>
      <main style = {{display:'flex', flexDirection:'column', alignItems:'center',justifyContent:'center',height:'70%', padding: '10px'}}>
      <Box
        ref = {divRef}
        sx={{
          padding: '35px',
          height: '100%',
          width:'80%',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          marginX:'50px',
          backgroundColor:'#D1E9F6'
        }}
      >
        {messages.map((message, index) => (
          <div
            key={index}
            style={{
              alignSelf: message.sender === 'user' ? 'flex-end' : 'flex-start',
              backgroundColor: message.sender === 'user' ? '#1976d2' : '#f1f1f1',
              color: message.sender === 'user' ? 'white' : 'black',
              padding: '10px',
              borderRadius: '5px',
              maxWidth: '80%',
              wordWrap: 'break-word',
              textAlign:'left'
            }}
          >
            {message.text}
          </div>
        ))}
      </Box>
      </main>
      <div style={{height:'15%',padding:'10px',margin:'0 auto'}}>
        {/* <STT onTextSubmit={handleSubmit}/> */}
          <div className="status">
            {isListening ? <p>Listening for your prompt...</p> : <p>Say {wakeword} to start.</p>}
            {response  && <p>Response: {response}</p>}
          </div>
      </div>
    </div>
        </>
    </div>
  )
}

export default App