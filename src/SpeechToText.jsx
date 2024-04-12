import React, { useState, useEffect, useRef } from "react";
import MonsterApiClient from "monsterapi";
import { ReactComponent as MonsterIcon } from "./assets/monster.svg";

// Add your Monsterapi Token here if you dont have please visit https://monsterapi.ai/
const client = new MonsterApiClient(process.env.REACT_APP_MONSTERAPITOKEN);

const languages = [
  { code: "none", name: "None" },
  { code: "en", name: "English" },
  { code: "af", name: "Afrikaans" },
  { code: "am", name: "Amharic" },
  // Add the rest of the languages as objects with 'code' and 'name' properties
  { code: "ar", name: "Arabic" },
  { code: "zh", name: "Chinese" },
  // Add all the other languages here following the same structure
];

function SpeechToText() {
  const [text, setText] = useState("");
  const [transcriptionFormat, setTranscriptionFormat] = useState("text");
  const [beamSize, setBeamSize] = useState(5);
  const [bestOf, setBestOf] = useState(8);
  const [numSpeakers, setNumSpeakers] = useState(2);
  const [diarize, setDiarize] = useState("false");
  const [removeSilence, setRemoveSilence] = useState("false");
  const [language, setLanguage] = useState("en");
  const [isLiveTranscribing, setIsLiveTranscribing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const processAudioBlob = async (blob) => {
    setIsProcessing(true);
    const file = new File([blob], "recorded_audio.wav", { type: blob.type });
    try {
      const uploadResponse = await client.uploadFile(file);
      const transcriptionResponse = await client.generate("whisper", {
        transcription_format: transcriptionFormat,
        beam_size: beamSize,
        best_of: bestOf,
        num_speakers: numSpeakers,
        diarize: diarize,
        remove_silence: removeSilence,
        language: language,
        file: uploadResponse,
      });
      setText((prevText) => prevText + " " + transcriptionResponse?.text);
    } catch (error) {
      console.error("Error during upload or transcription:", error);
    }
    setIsProcessing(false);
  };

  const startRecordingSegment = () => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        const chunks = [];
        mediaRecorder.ondataavailable = (event) => {
          chunks.push(event.data);
        };
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: "audio/wav" });
          processAudioBlob(blob);
        };
        mediaRecorder.start();
        // Stop recording after 5 seconds and process the audio
        setTimeout(() => {
          if (mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();
          }
        }, 5000);
      })
      .catch((error) => {
        console.error("Error accessing microphone:", error);
      });
  };

  const startLiveTranscription = () => {
    setIsLiveTranscribing(true);
    startRecordingSegment(); // Start the first segment immediately
  };

  const stopLiveTranscription = () => {
    setIsLiveTranscribing(false);
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }
    clearInterval(recordingIntervalRef.current);
  };

  useEffect(() => {
    if (isLiveTranscribing && !isProcessing) {
      // Start a new recording segment after the previous has been processed
      recordingIntervalRef.current = setInterval(() => {
        startRecordingSegment();
      }, 6000); // Slightly longer to account for processing
    }

    return () => {
      clearInterval(recordingIntervalRef.current);
    };
  }, [isLiveTranscribing, isProcessing]);

  return (
    <div className="max-w-4xl mx-auto my-10 p-5 shadow-lg bg-white rounded-lg">
      <div className="flex flex-col justify-center items-center gap-4" >
        <MonsterIcon  />
        <h1 className="text-2xl font-bold text-center mb-5">
          Speech to Text Playground
        </h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <select
          className="form-select appearance-none block w-full px-3 py-2 text-base font-normal text-gray-700 bg-white bg-clip-padding bg-no-repeat border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
          value={transcriptionFormat}
          onChange={(e) => setTranscriptionFormat(e.target.value)}
        >
          <option value="text">Text</option>
          <option value="word">Word</option>
          <option value="srt">SRT</option>
          <option value="verbose">Verbose</option>
        </select>

        <input
          type="number"
          value={beamSize}
          onChange={(e) => setBeamSize(Number(e.target.value))}
          min="1"
          max="100"
          className="form-input appearance-none block w-full px-3 py-2 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
        />

        <input
          type="number"
          value={bestOf}
          onChange={(e) => setBestOf(Number(e.target.value))}
          min="1"
          max="92233"
          className="form-input appearance-none block w-full px-3 py-2 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
        />

        <input
          type="number"
          value={numSpeakers}
          onChange={(e) => setNumSpeakers(Number(e.target.value))}
          min="2"
          max="10"
          className="form-input appearance-none block w-full px-3 py-2 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
        />

        <select
          value={diarize}
          onChange={(e) => setDiarize(e.target.value)}
          className="form-select appearance-none block w-full px-3 py-2 text-base font-normal text-gray-700 bg-white bg-clip-padding bg-no-repeat border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
        >
          <option value="false">False</option>
          <option value="true">True</option>
        </select>

        <select
          value={removeSilence}
          onChange={(e) => setRemoveSilence(e.target.value)}
          className="form-select appearance-none block w-full px-3 py-2 text-base font-normal text-gray-700 bg-white bg-clip-padding bg-no-repeat border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
        >
          <option value="false">False</option>
          <option value="true">True</option>
        </select>

        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="form-select appearance-none block w-full px-3 py-2 text-base font-normal text-gray-700 bg-white bg-clip-padding bg-no-repeat border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex justify-center gap-4 mb-5">
        <button
          onClick={startLiveTranscription}
          disabled={isLiveTranscribing}
          className="px-4 py-2 bg-blue-500 text-white font-semibold rounded hover:bg-blue-700 disabled:bg-blue-300"
        >
          Start Live Transcription
        </button>
        <button
          onClick={stopLiveTranscription}
          disabled={!isLiveTranscribing}
          className="px-4 py-2 bg-red-500 text-white font-semibold rounded hover:bg-red-700 disabled:bg-red-300"
        >
          Stop Live Transcription
        </button>

        <button
          onClick={() => setText("")}
          // disabled={!isLiveTranscribing}
          className="px-4 py-2 bg-red-300 text-white font-semibold rounded hover:bg-red-700 "
        >
          Clear
        </button>
      </div>
      <div className="mt-5">
        <p className="whitespace-pre-wrap text-gray-700 text-base">{text}</p>
      </div>

      <a
        target="__blank"
        href="https://monsterapi.ai/playground"
        className="hover:text-green-300"
      >
        Visit MonsterAPI Playground
      </a>
    </div>
  );
}

export default SpeechToText;