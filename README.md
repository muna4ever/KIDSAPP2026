# Kids Cartoon App

A fun, simple web app that lets users upload a screenshot or photo, extracts its content, and transforms it into a funny, educational cartoon video for kids. Deployable on Netlify!

## Features

- **Image Upload:** Upload any screenshot or photo.
- **OCR Extraction:** Automatically extracts text from the image using Tesseract.js.
- **AI Story Generation:** Turns the extracted text into a funny, educational children's story using DeepAI or OpenAI.
- **Animated Slides:** Displays the story as cartoon-style slides with simple SVG animations and text-to-speech narration.
- **Video Creation:** Exports the story as a cartoon slideshow video using ffmpeg.wasm.
- **Download/Playback:** Download or play the generated video in-browser.
- **Netlify Ready:** Simple, serverless deployment.

## Technologies Used

- [React](https://react.dev/)
- [Tesseract.js](https://tesseract.projectnaptha.com/) (OCR)
- [@ffmpeg/ffmpeg](https://github.com/ffmpegwasm/ffmpeg.wasm) (client-side video export)
- [DeepAI Text Generation API](https://deepai.org/machine-learning-model/text-generator) (or OpenAI API)
- Web Speech API (browser TTS)
- SVG for simple cartoon character animation

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/kids-cartoon-app.git
cd kids-cartoon-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up your API key

- Copy `.env.example` to `.env`
- Add your DeepAI (or OpenAI) API key

```
REACT_APP_DEEPAI_API_KEY=your_deepai_api_key_here
```

### 4. Run locally

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## Deploying to Netlify

1. Push your code to GitHub (make sure `package.json` is in the root).
2. Connect your repo to Netlify.
3. Set the environment variable `REACT_APP_DEEPAI_API_KEY` in Netlify Site Settings.
4. Build command: `npm run build`
5. Publish directory: `build`
6. Click "Deploy!"

---

## Usage

1. Upload an image (photo or screenshot).
2. Click "Extract Text" to perform OCR.
3. Generate a story from the extracted text.
4. View the animated story slides with voiceover.
5. Export the cartoon video and download or share it!

---

## Customization

- You can replace the story generation API with OpenAI or any other text generation service.
- Improve or swap out the cartoon SVG in `src/App.js` for richer animations or Lottie files.
- Adjust video export settings or add background music using ffmpeg.wasm.

---

## License

MIT

---

## Credits

- Cartoon SVG inspired by open source illustrations.
- Built with ❤️ for kids, parents, and educators.
