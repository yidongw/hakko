import puppeteer from 'puppeteer';
import { config } from './config';

interface TweetUser {
  id: string;
  name: string;
  screenName: string;
  profileImageUrlHttps: string;
  verified: boolean;
}

interface Tweet {
  id: string;
  userId: string;
  text: string;
  createdAt: Date;
  user: TweetUser;
}

/**
 * Creates an image of a tweet from tweet data
 * @param tweet The tweet data object
 * @returns Buffer containing the screenshot image
 */
export async function tweetToImage(tweet: Tweet): Promise<Buffer> {
  // Launch a headless browser
  const browser = await puppeteer.launch({
    headless: true,
  });
  
  try {
    // Create a new page
    const page = await browser.newPage();
    
    // Set viewport size for the tweet
    await page.setViewport({
      width: 550,
      height: 400,
      deviceScaleFactor: 2, // For higher resolution images
    });
    
    // Format the date
    const createdAt = new Date(tweet.createdAt);
    const formattedDate = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(createdAt);
    
    // Process tweet text (convert URLs to links, handle hashtags, etc.)
    // Process tweet text (convert URLs to links, handle hashtags, etc.)
    let processedText = tweet.text
      .replace(/#(\w+)/g, '<span style="color: #1DA1F2;">#$1</span>')
      .replace(/@(\w+)/g, '<span style="color: #1DA1F2;">@$1</span>')
      .replace(/\$(\w+)/g, function(match) {
        return '<span style="color: #1DA1F2;">' + match + '</span>';
      })
      .replace(/(https:\/\/t\.co\/\w+)/g, '<span style="color: #1DA1F2;">$1</span>')
      .replace(/\n/g, '<br>')


    // Create HTML content with proper styling
    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              margin: 0;
              padding: 0;
              background-color: white;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            }
            .tweet-container {
              width: 500px;
              padding: 16px;
              border: 1px solid #e1e8ed;
              border-radius: 12px;
              margin: 16px auto;
              background-color: white;
            }
            .tweet-header {
              display: flex;
              align-items: center;
              margin-bottom: 12px;
            }
            .profile-image {
              width: 48px;
              height: 48px;
              border-radius: 50%;
              margin-right: 12px;
            }
            .user-info {
              flex: 1;
            }
            .user-name {
              font-weight: bold;
              font-size: 15px;
              color: #14171a;
              margin: 0;
              display: flex;
              align-items: center;
            }
            .verified-badge {
              width: 16px;
              height: 16px;
              margin-left: 4px;
            }
            .user-handle {
              color: #657786;
              font-size: 15px;
              margin: 0;
            }
            .tweet-content {
              font-size: 16px;
              line-height: 1.4;
              color: #14171a;
              margin-bottom: 12px;
              white-space: pre-wrap;
              word-wrap: break-word;
            }
            .tweet-date {
              color: #657786;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="tweet-container">
            <div class="tweet-header">
              <img class="profile-image" src="${tweet.user.profileImageUrlHttps}" alt="${tweet.user.name}" />
              <div class="user-info">
                <p class="user-name">
                  ${tweet.user.name}
                  ${tweet.user.verified ? '<svg viewBox="0 0 22 22" aria-label="Verified account" role="img" style="width: 16px; height: 16px; margin-left: 4px; vertical-align: middle; display: inline-block;"><g><path fill="#1DA1F2" d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"></path></g></svg>' : ''}
                </p>
                <p class="user-handle">@${tweet.user.screenName}</p>
              </div>
            </div>
            <div class="tweet-content">${processedText}</div>
            <div class="tweet-date">${formattedDate}</div>
          </div>
        </body>
      </html>
    `;
    
    // Set the page content
    await page.setContent(content);
    
    // Wait for images to load
    await page.evaluate(() => {
      return new Promise((resolve) => {
        const images = document.querySelectorAll('img');
        if (images.length === 0) {
          resolve(true);
          return;
        }
        
        let loadedImages = 0;
        const onLoad = () => {
          loadedImages++;
          if (loadedImages === images.length) {
            resolve(true);
          }
        };
        
        images.forEach(img => {
          if (img.complete) {
            onLoad();
          } else {
            img.addEventListener('load', onLoad);
            img.addEventListener('error', onLoad); // Also handle error cases
          }
        });
      });
    });
    
    // Additional wait to ensure everything is rendered
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Get the tweet container element
    const tweetElement = await page.$('.tweet-container');
    
    // Take a screenshot of just the tweet
    const screenshot = await tweetElement?.screenshot({
      type: 'png',
      omitBackground: false,
    });
    
    return screenshot as Buffer;
  } finally {
    // Always close the browser
    await browser.close();
  }
}

export async function generateTweetImageAndSave(tweetData: Tweet) {
  // Convert the tweet to an image
  const imageBuffer = await tweetToImage(tweetData);
  
  // Save the image to a file
  const fs = require('fs');
  fs.writeFileSync(`./tweets/${tweetData.id}.png`, imageBuffer);
  console.log('Tweet image saved to tweet.png');
}

export async function generateTweetImageAndUpload(tweetData: Tweet) {
  // Convert the tweet to an image
  const imageBuffer = await tweetToImage(tweetData);
  
  // Upload the image to ImgBB
  const formData = new FormData();
  formData.append('image', imageBuffer.toString('base64'));
  
  try {
    const response = await fetch(
      `https://api.imgbb.com/1/upload?key=${config.imgbbKey}`,
      {
        method: 'POST',
        body: formData
      }
    );
    
    const data = await response.json();
    
    console.log(data)

    if (data.success) {
      console.log('Tweet image uploaded successfully');
      
      // Return the image URL
      return data.data.url;
    } else {
      console.error('Failed to upload image:', data);
      return null;
    }
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
}