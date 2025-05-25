import { getTwitterSearch } from '@/rapidapi'
import { logger } from '@/utils/logger'
import { extractTickerAndName } from './utils/validation'
import { generateTweetImageAndUpload, tweetToImage } from './tweetToImage'

interface SearchConfigState {
  query: string
  lastTweetId: string | null
  isFirstRequest: boolean
}

type SearchConfigType = {
  [K in 'hakkoFun' | 'launchcoin']: SearchConfigState
}

const searchConfig: SearchConfigType = {
  hakkoFun: {
    query: '@hakkoFun',
    lastTweetId: null,
    isFirstRequest: true
  },
  launchcoin: {
    query: '@launchcoin',
    lastTweetId: null,
    isFirstRequest: true
  }
}

type searchType = 'hakkoFun' | 'launchcoin'

function updateSearchState(type: searchType, tweetId: string) {
  const state = searchConfig[type]
  // Twitter returns tweets in descending order, so first tweet has highest ID
  state.lastTweetId = tweetId
  state.isFirstRequest = false
}

export const searchLatestTweets = async (type: searchType) => {
  if (!searchConfig[type]) {
    throw new Error(`Invalid search type: ${type}`)
  }

  const args: string[] = []

  // Only add since_id if not the first request
  if (!searchConfig[type].isFirstRequest && searchConfig[type].lastTweetId) {
    args.push(`since_id:${searchConfig[type].lastTweetId}`)
  }

  // Always exclude retweets to avoid duplicates
  // args.push('-filter:retweets')

  const query = searchConfig[type].query
  
  const tweets = await getTwitterSearch([query], args, 'Latest')

  // Update state if we found tweets
  if (tweets.length > 0) {
    updateSearchState(type, tweets[0].id)
  }

  return tweets
}


export async function pollForNewTweets() {
  // Initialize timeout with a default value (in milliseconds)
  let timeout = 5000
  const MIN_TIMEOUT = 2000 // Don't go below 2 seconds
  const MAX_TIMEOUT = 60000 * 10 // Don't go above 10 minutes

  while (true) {
    try {
      const tweets = await searchLatestTweets('launchcoin')
      
      const coinsTweets = tweets.map(tweet => ({
        ...tweet,
        coin: extractTickerAndName(tweet.text)
      })).filter(tweet => tweet.coin.ticker !== '')
      
      for (const coinTweet of coinsTweets) {
        const { ticker, name, description } = coinTweet.coin
        let imageUrl = coinTweet.medias?.[0]

        if (!imageUrl) {
          imageUrl = await generateTweetImageAndUpload(coinTweet)
        }

        console.log({
          ticker,
          name,
          description,
          imageUrl
        })
      }

      const count = tweets.length

      // Adjust timeout based on response size
      if (count >= 20) {
        // High activity - reduce timeout
        timeout = Math.max(MIN_TIMEOUT, timeout * 0.7)
        logger().info(`High activity (${count} tweets), reducing polling interval to ${timeout}ms`)
      } else if (count < 8) {
        // Low activity - increase timeout significantly
        timeout = Math.min(MAX_TIMEOUT, timeout * 1.5)
        logger().info(`Low activity (${count} tweets), increasing polling interval to ${timeout}ms`)
      } else if (count < 15) {
        // Moderate-low activity - increase timeout slightly
        timeout = Math.min(MAX_TIMEOUT, timeout * 1.1)
        logger().info(
          `Moderate-low activity (${count} tweets), slightly increasing polling interval to ${timeout}ms`
        )
      } else {
        // Moderate-high activity (15-20 tweets) - keep timeout the same
        logger().info(
          `Moderate activity (${count} tweets), maintaining polling interval at ${timeout}ms`
        )
      }

      // Wait for the calculated timeout
      await new Promise((resolve) => setTimeout(resolve, timeout))
    } catch (error) {
      // In case of error, use a longer timeout to avoid hammering the API
      logger().error(error, 'Error in polling for tweets')
      timeout = MAX_TIMEOUT
      await new Promise((resolve) => setTimeout(resolve, timeout))
    }
  }
}


pollForNewTweets()