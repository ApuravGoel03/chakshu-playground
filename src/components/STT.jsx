// src/components/STT.js
import React, { useState, useEffect, useRef } from 'react';
import { TextField, Button } from '@mui/material';

const STT = ({onTextSubmit}) => {
    const [text, setText] = useState(''); // Store the full text
    const [isListening, setIsListening] = useState(false);
    const [recognition, setRecognition] = useState(null); // Reference to recognition instance
    const textRef = useRef(text); // Create a ref to track text
    const inputRef = useRef(null);

    // Update textRef whenever text changes
    useEffect(() => {
        textRef.current = text;
    }, [text]);   

    
    useEffect(() => {
      // Check if the browser supports the SpeechRecognition API
      if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        alert('Your browser does not support speech recognition.');
        return;
      }
  
      // Initialize the SpeechRecognition object
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
  
      recognitionInstance.continuous = true; // Keep recognizing speech until stopped
      
  
      // Try setting the language to Indian English
      try {
        recognitionInstance.lang = 'en-IN'; // Indian English
      } catch (error) {
        recognitionInstance.lang = 'en-US'; // Fallback to default English
      }
      console.log("inside")
      
      recognitionInstance.onresult = (event) => {
        console.log("result")
        // Keep track of the existing text
        let finalText = textRef.current;
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalText += transcript + ' ';
          }
        }
        setText(finalText); // Update the final text state
      };
  
      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
  
      setRecognition(recognitionInstance);
  
      // Cleanup function
      return () => {
        recognitionInstance.stop();
      };
    }, []);


    useEffect(() => {
      const handleSpacePress = (event) => {
        if (event.code === 'Space') { // Check if the pressed key is space
          event.preventDefault(); // Prevent default space bar behavior
          setIsListening((prevState) => !prevState); // Toggle listening state
          if(!isListening) setText('')
        }
      };

      document.addEventListener('keydown', handleSpacePress);

      // Cleanup: Remove event listener when component unmounts
      return () => {
        document.removeEventListener('keydown', handleSpacePress);
      };
    }, []);

    useEffect(() => {
      // Start or stop recognition based on isListening state
      if (recognition) {
        if (isListening) {
          try{
            recognition.start();
            inputRef.current.focus();
          }
          catch{
            recognition.stop();
            inputRef.current.blur();
          }
          
        } else {
          recognition.stop();
          inputRef.current.blur(); 
        }
      }
    }, [isListening, recognition]);
  
    const handleListenClick = (event) => {
        console.log('handle click called')
        setText('')
        setIsListening((prevState) => !prevState);
    };
  
    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevent newline in text area
            if (textRef.current !== '') {
              onTextSubmit(textRef.current); // Call the callback with the spoken text
              setText(''); // Clear the text after submission
              setIsListening(false)
            }
        }
    };
  
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', width:'80vw' ,textAlign: 'center', padding: '20px' , gap:'20px'}}>
      <Button 
        variant="contained" 
        color={isListening ? 'error' : 'primary'} 
        onClick={handleListenClick}
        sx={{width:'10%',':focus':{outline:'none'}}}
      >
        {isListening ? 'Stop' : 'Start'}
      </Button>
      <TextField
        inputRef={inputRef}
        multiline
        maxRows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        variant="outlined"
        fullWidth
        InputProps={{ 
          style: { 
            resize: 'none' 
          },
          readOnly: true // Makes the text box non-editable manually
        }}
        onKeyDown={handleKeyDown} // Handle Enter key for sentence confirmation/removal
        style={{
          maxHeight: '120px', // Limits the height of the text field
          overflow: 'auto', // Adds scroll for overflow content
          width:'80%'
        }}
      />
    </div>
  );
};

export default STT;
