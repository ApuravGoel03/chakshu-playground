import { useState, useEffect, useRef } from 'react'
import './App.css'
import STT from './components/STT'
import { TextField, Typography, Box } from '@mui/material';
import Links from './api_data/links.json'
import Options from './api_data/options.json'
import Content from './api_data/content.json'

function App() {

  const [messages, setMessages] = useState([]); // Holds the chat messages
  const [options, setOptions] = useState([]); // Holds the options for user commands
  const [voices, setVoices] = useState([]);
  const [phases, setPhases] = useState('QUERY')
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [links, setLinks] = useState([])
  const [selectedArticle, setSelectedArticle] = useState({})
  const [selectedopt, setSelectedOpt] = useState(0)
  const synthRef = useRef(window.speechSynthesis); 

  useEffect(() => {
    const populateVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
        console.log('Available voices:', availableVoices);
    };

    // Populate voices on component mount
    populateVoices();
    if(synthRef.current.speaking) synthRef.current.cancel()
    // Add event listener for voice changes
    window.speechSynthesis.onvoiceschanged = populateVoices;

    // Clean up the event listener on component unmount
    return () => {
        window.speechSynthesis.onvoiceschanged = null;
    };
  }, []); // Empty dependency array to run only once
  useEffect(() =>{
    const handleKeydown = (event) => {
      if (event.ctrlKey) {
          event.preventDefault();
          // Pause/Resume speech synthesis
          if (synthRef.current.speaking) {
              if (synthRef.current.paused) {
                  synthRef.current.resume();
              } else {
                  synthRef.current.pause();
              }
          }
      }
    };
    document.addEventListener('keydown', handleKeydown);

    return () => {
      document.removeEventListener('keydown', handleKeydown);
    };
  },[isSpeaking])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if(event.key === 'Enter' || event.key === 'Space' || event.ctrlKey) return
      console.log('link ke ander useffect')
      if(synthRef.current.speaking) synthRef.current.cancel()
      const key = parseInt(event.key, 10); // Convert the key to an integer
      console.log(event.key)
      addMessage(key,'user')
      if (!isNaN(key) && key >= 1 && key <= links.length) {
        setSelectedArticle(links[key - 1])
        callLinkAPI(selectedArticle)
      }
      else{
        speak(`Press the correct link`)
      }
    };

    if(phases === 'LINK_SELECTION') window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [links, phases]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if(event.key === 'Enter' || event.key === 'Space' || event.ctrlKey) return
      console.log('option ke ander vale useeffect')
      if(synthRef.current.speaking) synthRef.current.cancel()
      const key = parseInt(event.key, 10); // Convert the key to an integer
      addMessage(key,'user')
      if (!isNaN(key) && key >= 1 && key <= options.length) {
        setSelectedOpt(key)
        callOptionAPI(key)
      }
      else{
        speak(`Press the correct option`)
      }
    };

    if(phases === 'OPTION_SELECTION') window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [options]);

  const handleSubmit = (speech) =>{
    console.log("Function called with ",speech)
    addMessage(speech, 'user');
    processSpeechInput(speech);
  }
  const processSpeechInput = (speechText) => {
    if (speechText.trim() === '') return; // Ignore empty input
    if (phases === 'QUERY') {
      callQueryAPI(speechText);
      setPhases('LINK_SELECTION')
    } 
    // else if (phases === 'LINK_SELECTION') {
    //     callLinkAPI(speechText);
    // } else if (phases === 'OPTION_SELECTION') {
    //     callOptionAPI(speechText);
    // } else {
    //   resetToInitialState();
    // }
  };

  const addMessage = (text, sender) => {
    setMessages((prevMessages) => [...prevMessages, { text, sender }]);
  };

  const callQueryAPI = (query) => {
    // Api calling here for links fetching based on query

    speak(Links.message);
    Links.results.map((result,index) =>{
      if(index < 4){
        setLinks((links) => [...links, {result}])
        speak(`Option ${index + 1}:\nTitle : ${result.title}\nShort Description : ${result.short_description}`)
      }
    })
    //while(synthRef.current.speaking);
    
  };

  const callLinkAPI = (article) => {
    // Api calling here for telling the user options available

    
    setPhases('OPTION_SELECTION')
    speak(Options.message)
    Options.options.map((option,index) => {
      setOptions((options) => [...options, option])
      console.log(phases)
      speak(`Press ${index + 1} for ${option}`)
    })
    //while(synthRef.current.speaking);
    
  };

  const callOptionAPI = (option) => {
    // Api calling here to get the content based on selected article and option
    
    console.log(phases)
    console.log(option)
    if(option === 1){
      speak(Content[0].short_description)
    }
    else if(option === 2){
      speak(Content[1].summary)
    }
    else if(option === 3){
      let word = ""
      Content[2].text.map((s) => {
        word += s
      })
      speak(word)
    }
    else if(option === 4){
      speak(Content[3].image_captions)
    }
    else if(option === 5){
      speak(Content[4].references)
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
    console.log(utterance)
    // Event listeners for speech
    utterance.onstart = () => console.log('Speech has started');
    utterance.onend = () => console.log('Speech has ended')
    utterance.onerror = (event) => console.error('Speech synthesis error:', event.error);
    utterance.onpause = () => console.log("paused")

    setIsSpeaking(true)
    synthRef.current.speak(utterance);
    addMessage(text,'system')
  };

  const isValidLinkSelection = (speechText) => {
    return options.some((opt, index) => `${index + 1}`.toLowerCase() === speechText.toLowerCase());
  };

  const isValidOption = (speechText) => {
    const validOptions = ['short description', 'summary', 'image captioning', 'full content', 'table navigation'];
    return validOptions.includes(speechText.toLowerCase());
  };

  const resetToInitialState = () => {
    setOptions([]);
    setPhases('QUERY')
  };
  return (
    <div style={{display:'flex',flexDirection:'column', justifyContent:'center', height:'100vh',margin:'0'}}>
      <div style={{color:'#3795BD',height:'15%', padding:'2px 10px 10px'}}>
        <h1>CHAKSHU</h1>
      </div>
      <main style = {{display:'flex', flexDirection:'column', alignItems:'center',justifyContent:'center',height:'65%', padding: '10px'}}>
      <Box
        sx={{
          padding: '30px',
          height: '90%',
          width:'80%',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          marginBottom: '20px',
          marginX:'50px',
          backgroundColor:'#D1E9F6',
          borderRadius: '25px'
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
        <STT onTextSubmit={handleSubmit}/>
      </div>
    </div>
  )
}

export default App
