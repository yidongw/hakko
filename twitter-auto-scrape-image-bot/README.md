# Twitter Auto Scrape & Image Bot

## Project Overview

This project is an automated tool built with Node.js (Bun runtime) for scraping, analyzing, and generating images from Twitter content. Its core functionality is to periodically poll specified Twitter accounts, extract cryptocurrency information in a specific format, convert tweet content into images, upload them to ImgBB, and output structured data.

## Features

- **Tweet Scraping**:  
  Periodically fetches the latest tweets from specified accounts (e.g., @hakkoFun, @launchcoin) via Twitter APIs on RapidAPI. Supports incremental fetching to avoid duplicate processing.

- **Content Parsing**:  
  Automatically recognizes the "$TICKER + Name" format in tweets, extracting the ticker, name, and original description.

- **Tweet-to-Image**:  
  Uses Puppeteer to launch a headless browser and render tweet content as high-resolution, Twitter-styled images.

- **Image Upload**:  
  Automatically uploads generated images to ImgBB and retrieves the image URL.

- **Logging & Robustness**:  
  Integrated with Pino for logging, supporting different outputs for development and production. API requests have timeout and retry mechanisms for better reliability.

- **Automated Polling & Adaptivity**:  
  Polling intervals are dynamically adjusted based on tweet activity, balancing real-time performance and API usage.

## Tech Stack

- [Bun](https://bun.sh/): High-performance Node.js-compatible runtime
- [Puppeteer](https://pptr.dev/): Web rendering and screenshotting
- [Pino](https://getpino.io/): High-performance logging
- [valibot](https://valibot.dev/): Configuration and environment variable validation
- [RapidAPI](https://rapidapi.com/): Twitter data access
- [ImgBB](https://imgbb.com/): Image hosting and link service

## Dependencies

- puppeteer
- pino / pino-pretty
- valibot
- @types/bun

## Quick Start

1. **Install dependencies**

   ```bash
   bun install
   ```

2. **Configure environment variables**

   All configuration is managed in `src/config.ts` and supports automatic loading from a `.env` file. Required variables:

   ```
   RAPIDAPI_KEY=your_rapidapi_key
   IMGBB_KEY=your_imgbb_key
   LOG_LEVEL=info
   ENV=development
   ```

3. **Run the project**

   ```bash
   bun run start
   ```

4. **Automation Workflow**

   - The polling process starts automatically.
   - Each cycle: fetch latest tweets → parse coin info → if no image, generate and upload one → output ticker, name, description, image link, etc. → dynamically adjust next polling interval.

## Use Cases

- Automated information scraping and content distribution in crypto, finance, and similar fields.
- Scenarios requiring structured, visualized, and automatically uploaded social media content.

---

Feel free to open an issue or pull request if you have questions or suggestions!

---

Let me know if you need further customization or more detailed usage instructions!
