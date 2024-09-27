import { useState, useEffect } from 'react'
import './App.css'
import STT from './components/STT'
import { TextField, Typography, Box } from '@mui/material';

function App() {

  const [messages, setMessages] = useState([]); // Holds the chat messages
  const [options, setOptions] = useState([]); // Holds the options for user commands
  const [voices, setVoices] = useState([]);
  const [phases, setPhases] = useState('QUERY')

  useEffect(() => {
    const populateVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
        console.log('Available voices:', availableVoices);
    };

    // Populate voices on component mount
    populateVoices();

    // Add event listener for voice changes
    window.speechSynthesis.onvoiceschanged = populateVoices;

    // Clean up the event listener on component unmount
    return () => {
        window.speechSynthesis.onvoiceschanged = null;
    };
  }, []); // Empty dependency array to run only once

  const handleSubmit = (speech) =>{
    console.log("Function called with ",speech)
    addMessage(speech, 'user');
    processSpeechInput(speech);
  }
  const processSpeechInput = (speechText) => {
    if (speechText.trim() === '') return; // Ignore empty input
    if (phases === 'QUERY') {
      callQueryAPI(speechText);
    } else if (phases === 'LINK_SELECTION') {
        setOptions([]);
        callLinkAPI(speechText);
      
    } else if (phases === 'OPTION_SELECTION') {
        callOptionAPI(speechText);
    } else {
      resetToInitialState();
    }
  };

  const addMessage = (text, sender) => {
    setMessages((prevMessages) => [...prevMessages, { text, sender }]);
  };

  const callQueryAPI = (query) => {
    setOptions(['Link 1', 'Link 2', 'Link 3']); // Mock options
    speak(`Here are the results: Link 1, Link 2, Link 3. Please say the number of the link you want.`);
    setPhases('LINK_SELECTION')
  };

  const callLinkAPI = (linkSelection) => {
    setOptions(['short description', 'summary', 'image captioning', 'full content', 'table navigation']);
    speak(`You selected link ${linkSelection}. Here are your options: short description, summary, image captioning, full content, table navigation. Please say the option you want.`);
    setPhases('OPTION_SELECTION')
  };

  const callOptionAPI = (option) => {
    speak(`You selected the option: ${option}. Please wait for the result.`);
    setPhases('')
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

    // Event listeners for speech
    utterance.onstart = () => console.log('Speech has started');
    utterance.onend = () => console.log('Speech has ended');
    utterance.onerror = (event) => console.error('Speech synthesis error:', event.error);

    window.speechSynthesis.speak(utterance);
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
      <main style = {{height:'65%', padding: '10px'}}>
      <Box
        sx={{
          padding: '15px',
          height: '100%',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          marginBottom: '20px',
          marginX:'30px',
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
            }}
          >
            {message.text}
          </div>
        ))}
      </Box>
      </main>
      <div style={{height:'15%',padding:'10px'}}>
        <STT onTextSubmit={handleSubmit}/>
      </div>
    </div>
  )
}

export default App
