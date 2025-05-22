import React, { useState, useEffect, useRef } from "react";
import Tesseract from "tesseract.js";
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";

const DEEPAI_API_KEY = process.env.REACT_APP_DEEPAI_API_KEY;

// Simple animated cartoon SVG
const AnimatedCartoon = () => (
  <svg width="150" height="150" viewBox="0 0 64 64">
    <circle cx="32" cy="32" r="30" fill="#ffcc80" />
    <circle cx="20" cy="25" r="5" fill="#fff" />
    <circle cx="44" cy="25" r="5" fill="#fff" />
    <circle cx="20" cy="25" r="2" fill="#000" />
    <circle cx="44" cy="25" r="2" fill="#000" />
    <path d="M20 44 Q32 55 44 44" stroke="#b71c1c" strokeWidth="3" fill="transparent" />
  </svg>
);

function splitStory(story) {
  return story.split(/(?<=[.!?])\s+/).filter(Boolean);
}

export default function App() {
  const [image, setImage] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [story, setStory] = useState("");
  const [sentences, setSentences] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const synthRef = useRef(window.speechSynthesis);

  // For video export
  const ffmpeg = useRef(createFFmpeg({ log: true }));
  const [videoUrl, setVideoUrl] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  // Upload image handler
  const handleImageUpload = (e) => {
    setImage(URL.createObjectURL(e.target.files[0]));
    setExtractedText(""); setStory(""); setSentences([]); setCurrentSlide(0); setError(""); setVideoUrl("");
  };

  // OCR
  const runOCR = () => {
    if (!image) return;
    setIsLoading(true); setExtractedText(""); setStory(""); setSentences([]); setCurrentSlide(0); setError(""); setVideoUrl("");
    Tesseract.recognize(image, "eng", { logger: (m) => console.log(m) })
      .then(({ data: { text } }) => { setExtractedText(text.trim()); setIsLoading(false); })
      .catch(() => { setError("Failed to extract text."); setIsLoading(false); });
  };

  // Story generation
  const generateStory = async () => {
    if (!extractedText) return;
    setIsLoading(true); setStory(""); setSentences([]); setCurrentSlide(0); setError(""); setVideoUrl("");
    try {
      const prompt = `Create a funny and educational children's story inspired by this text:\n\n${extractedText}`;
      const response = await fetch("https://api.deepai.org/api/text-generator", {
        method: "POST",
        headers: { "Api-Key": DEEPAI_API_KEY, "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ text: prompt }),
      });
      const data = await response.json();
      if (data.err) { setError("DeepAI error: " + data.err); }
      else { setStory(data.output.trim()); setSentences(splitStory(data.output.trim())); }
    } catch (e) { setError("Failed to generate story."); }
    setIsLoading(false);
  };

  // TTS auto-advance
  useEffect(() => {
    if (!sentences.length) return;
    const synth = synthRef.current; if (synth.speaking) synth.cancel();
    if (currentSlide >= sentences.length) return;
    const utterance = new SpeechSynthesisUtterance(sentences[currentSlide]);
    utterance.rate = 0.9;
    utterance.onend = () => { if (currentSlide < sentences.length - 1) setCurrentSlide((prev) => prev + 1); };
    synth.speak(utterance);
    return () => synth.cancel();
  }, [currentSlide, sentences]);

  // Controls
  const nextSlide = () => { if (currentSlide < sentences.length - 1) setCurrentSlide((prev) => prev + 1); };
  const prevSlide = () => { if (currentSlide > 0) setCurrentSlide((prev) => prev - 1); };

  // Export video
  const exportVideo = async () => {
    if (!sentences.length) return alert("Generate a story first!");
    setIsExporting(true); setVideoUrl("");
    const ff = ffmpeg.current;
    if (!ff.isLoaded()) await ff.load();
    // Render slides to canvas
    const canvas = document.createElement("canvas");
    canvas.width = 640; canvas.height = 480;
    const ctx = canvas.getContext("2d");
    const renderSlide = (text) => {
      ctx.fillStyle = "#FFF8DC"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#ffcc80"; ctx.beginPath(); ctx.arc(320, 150, 100, 0, 2 * Math.PI); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(270, 130, 30, 0, 2 * Math.PI); ctx.arc(370, 130, 30, 0, 2 * Math.PI); ctx.fill();
      ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(270, 130, 10, 0, 2 * Math.PI); ctx.arc(370, 130, 10, 0, 2 * Math.PI); ctx.fill();
      ctx.strokeStyle = "#b71c1c"; ctx.lineWidth = 8; ctx.beginPath(); ctx.quadraticCurveTo(320, 270, 400, 200); ctx.stroke();
      ctx.fillStyle = "#000"; ctx.font = "28px Comic Sans MS, cursive, sans-serif"; ctx.textAlign = "center";
      // Word wrap
      const words = text.split(" "); let line = ""; let y = 350; const lineHeight = 36;
      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + " ";
        const metrics = ctx.measureText(testLine);
        if (metrics.width > 600) { ctx.fillText(line, 320, y); line = words[i] + " "; y += lineHeight; }
        else { line = testLine; }
      }
      ctx.fillText(line, 320, y);
      return canvas.toDataURL("image/png");
    };
    const frames = [];
    for (let i = 0; i < sentences.length; i++) frames.push(renderSlide(sentences[i]));
    for (let i = 0; i < frames.length; i++) {
      ff.FS("writeFile", `frame${String(i).padStart(3, "0")}.png`, await fetchFile(frames[i]));
    }
    await ff.run("-framerate", "1", "-i", "frame%03d.png", "-c:v", "libx264", "-pix_fmt", "yuv420p", "output.mp4");
    const data = ff.FS("readFile", "output.mp4");
    setVideoUrl(URL.createObjectURL(new Blob([data.buffer], { type: "video/mp4" })));
    setIsExporting(false);
  };

  return (
    <div style={{ maxWidth: 720, margin: "20px auto", fontFamily: "Arial" }}>
      <h1 style={{ textAlign: "center" }}>Cartoon Video Creator for Kids 🎨📚</h1>
      <input type="file" accept="image/*" onChange={handleImageUpload} />
      <button onClick={runOCR} disabled={!image || isLoading} style={{ marginLeft: 10 }}>Extract Text</button>
      {extractedText && (
        <div style={{ marginTop: 10, padding: 10, background: "#f0f0f0", borderRadius: 6 }}>
          <strong>Extracted Text:</strong>
          <p>{extractedText}</p>
          <button onClick={generateStory} disabled={isLoading}>Generate Funny Educative Story</button>
        </div>
      )}
      {isLoading && <p>Loading... please wait.</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {story && (
        <>
          <h2 style={{ marginTop: 20, textAlign: "center" }}>Generated Story Slide {currentSlide + 1} / {sentences.length}</h2>
          <div style={{ border: "2px solid #333", borderRadius: 12, padding: 20, background: "#fff8dc", textAlign: "center", minHeight: 300 }}>
            <AnimatedCartoon />
            <p style={{ fontSize: 24, marginTop: 20, fontFamily: "'Comic Sans MS', cursive, sans-serif" }}>{sentences[currentSlide]}</p>
          </div>
          <div style={{ marginTop: 10, textAlign: "center", display: "flex", justifyContent: "center", gap: 15 }}>
            <button onClick={prevSlide} disabled={currentSlide === 0}>← Previous</button>
            <button onClick={nextSlide} disabled={currentSlide === sentences.length - 1}>Next →</button>
          </div>
          <div style={{ marginTop: 20, textAlign: "center" }}>
            <button onClick={exportVideo} disabled={isExporting}>
              {isExporting ? "Exporting Video..." : "Export Cartoon Video"}
            </button>
            {videoUrl && (
              <div style={{ marginTop: 10 }}>
                <video src={videoUrl} controls width="640" style={{ borderRadius: 10 }} />
                <p>Right-click the video to save it locally for sharing with kids!</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}