import { config } from '@/config'
import { loggedFetch } from '@/utils/loggedFetch'
import { logger } from './utils/logger'

interface TweetUrl {
  display_url: string
  expanded_url: string
  url: string
}

interface TweetUserMention {
  id_str: string
  name: string
  screen_name: string
  indices: number[]
}


export interface TweetDetailV3NoteTweet {
  note_tweet_results: {
    rest_id: string
    result: {
      __typename: string
      rest_id: string
      text: string
      entity_set?: any
    }
  }
  is_expandable?: boolean
}


export interface TweetDetailV3User {
  __typename: string
  rest_id: string
  core: {
    created_at: string
    name: string
    screen_name: string
  }
  avatar: {
    image_url: string
  }
  banner: {
    image_url: string
  }
  location: {
    location: string
  }
  profile_bio: {
    description: string
    entities: {
      url?: {
        urls: {
          display_url: string
          expanded_url: string
          url: string
        }[]
      }
    }
  }
  relationship_counts: {
    followers: number
    following: number
  }
  tweet_counts: {
    tweets: number
    media_tweets: number
  }
  action_counts: {
    favorites_count: number
  }
  website: {
    url: string
  }
  legacy?: {
    profile_image_url_https?: string
    verified?: boolean
  }
  verification?: {
    is_blue_verified?: boolean
  }
}

export interface TweetDetailV3Legacy {
  bookmark_count: number
  bookmarked?: boolean
  created_at: string
  conversation_id_str: string
  display_text_range?: number[]
  entities: {
    hashtags?: any[]
    symbols?: any[]
    urls?: TweetUrl[]
    user_mentions?: TweetUserMention[]
  }
  extended_entities?: {
    media?: TweetDetailV3Media[]
  }
  favorite_count: number
  favorited?: boolean
  full_text: string
  is_quote_status: boolean
  in_reply_to_status_id_str?: string
  lang: string
  possibly_sensitive?: boolean
  possibly_sensitive_editable?: boolean
  quote_count: number
  reply_count: number
  retweet_count: number
  retweeted?: boolean
  user_id_str: string
  id_str: string
  quoted_status_id_str?: string
  quoted_status_permalink?: {
    display: string
    expanded: string
    url: string
  }
  retweeted_status_results?: {
    rest_id: string
    result: TweetDetailV3Tweet
  }
}

export interface TweetDetailV3Media {
  display_url: string
  expanded_url: string
  id_str: string // needed in db
  indices: number[] 
  media_key: string
  media_url_https: string // needed in db
  original_info: {
    focus_rects: {
      h: number
      w: number
      x: number
      y: number
    }[]
    height: number
    width: number
  }
  sizes: { // needed in db
    large: {
      h: number
      w: number
    }
  }
  type: string // video, photo, animated_gif // needed in db
  video_info: { // needed in db
    aspect_ratio: number[]
    duration_millis: number
    variants: {
      bitrate?: number
      content_type: string
      url: string
    }[]
  }
  inline_media?: { // needed in db
    index: number
    media_id: string
  }[]
}


export interface TweetDetailV3Tweet {
  __typename: string
  rest_id: string
  core: {
    user_results: {
      result: TweetDetailV3User
    }
  }
  unmention_data?: any
  edit_control?: any
  legacy?: TweetDetailV3Legacy
  note_tweet?: TweetDetailV3NoteTweet
  quoted_tweet_results?: {
    result: TweetDetailV3Tweet
  }
  retweeted_status_results?: {
    rest_id: string
    result: TweetDetailV3Tweet
  }
  view_count_info?: {
    count: string
    state: string
  }
  reply_to_user_results?: {
    rest_id: string
    result: {
      __typename: string
      rest_id: string
      core: {
        screen_name: string
      }
    }
  }
}


export interface TweetWithVisibilityResults {
  __typename: 'TweetWithVisibilityResults'
  tweet: TweetDetailV3Tweet
}

// Type guard to check if the result is TweetWithVisibilityResults
function isTweetWithVisibilityResults(
  result: TweetDetailV3Tweet | TweetWithVisibilityResults
): result is TweetWithVisibilityResults {
  return (
    (result as any).__typename === 'TweetWithVisibilityResults' &&
    (result as any).tweet !== undefined
  )
}

interface TwitterUser {
  id: string;
  name: string;
  screenName: string;
  location: string;
  description: string;
  followersCount: number;
  friendsCount: number;
  createdAt: Date;
  favouritesCount: number;
  verified: boolean;
  statusesCount: number;
  mediaCount: number;
  profileImageUrlHttps: string;
  profileBannerUrl: string;
  website: string;
}

interface NewTweet {
  id: string;
  userId: string;
  text: string;
  medias: any | null;
  isReply: boolean;
  relatedTweetId: string;
  favoriteCount: number;
  quoteCount: number;
  replyCount: number;
  retweetCount: number;
  bookmarkCount: number;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

type EnhancedTweet = NewTweet & { user: TwitterUser }

function transformTwitterResponse(twitterData: any): EnhancedTweet[] {
  const tweets: EnhancedTweet[] = []

  // Get tweets from the entries array
  const entries =
    twitterData.data?.search_by_raw_query?.search_timeline?.timeline?.instructions?.[0]?.entries ||
    []

  for (const entry of entries) {
    // Skip if not a tweet
    if (entry.content?.__typename !== 'TimelineTimelineItem') continue

    const tweetResult = entry.content?.content?.tweet_results?.result
    if (!tweetResult) {
      logger().error(entry, `Invalid response structure while fetching search`)
      continue
    }

    const tweet: TweetDetailV3Tweet = isTweetWithVisibilityResults(tweetResult) ? tweetResult.tweet : tweetResult

    if (!tweet.legacy) {
      logger().info(
        entry.content?.content?.tweet_results?.result,
        `Tweet result that does not have legacy`
      )
      continue
    }

    const legacy = tweet.legacy
    const user = tweet.core?.user_results?.result
    const view_count = Number(tweet.view_count_info?.count || '0')
    
    tweets.push({
      id: tweet.rest_id,
      userId: legacy.user_id_str,
      text: legacy.full_text,
      medias: legacy.extended_entities?.media?.map(item => item.media_url_https), // Need to extract from entities if needed
      isReply: !!legacy.in_reply_to_status_id_str,
      relatedTweetId: legacy.in_reply_to_status_id_str || '',
      favoriteCount: legacy.favorite_count,
      quoteCount: legacy.quote_count,
      replyCount: legacy.reply_count,
      retweetCount: legacy.retweet_count,
      bookmarkCount: legacy.bookmark_count,
      viewCount: view_count,
      createdAt: new Date(legacy.created_at),
      updatedAt: new Date(),
      user: {
        id: user.rest_id,
        name: user.core.name,
        screenName: user.core.screen_name,
        location: user.location?.location || '',
        description: user.profile_bio?.description || '',
        followersCount: user.relationship_counts?.followers || 0,
        friendsCount: user.relationship_counts?.following || 0,
        createdAt: new Date(user.core.created_at),
        favouritesCount: user.action_counts?.favorites_count || 0,
        verified: user.verification?.is_blue_verified || false,
        statusesCount: user.tweet_counts?.tweets || 0,
        mediaCount: user.tweet_counts?.media_tweets || 0,
        profileImageUrlHttps: user.avatar?.image_url || '',
        profileBannerUrl: user.banner?.image_url || '',
        website: user.profile_bio?.entities?.url?.urls[0]?.expanded_url || '',
      }
    })
  }

  return tweets
}


export async function getTwitterSearch(
  queries: string[],
  args: string[] = [],
  type: string = 'Top'
): Promise<EnhancedTweet[]> {
  if (queries.length > 10) {
    throw new Error(`searchTweets can only take up to 10 queries`)
  }
  // (EwZHZ6tHqLjsbDfkrTdHCTcPdq2MCiFRvXsHFtGGpump OR Ax7K9QmP4N8sRvY2LcUwDhT5BnE3FjWx) until:2025-02-03 since:2025-01-31
  // Combine queries with OR operator
  const combinedQuery = queries
    .map((q) => q.trim())
    .filter((q) => q.length > 0) // Remove empty strings
    .join(' OR ')

  const combinedArgs = args
    .map((q) => q.trim())
    .filter((q) => q.length > 0) // Remove empty strings
    .join(' ')

  const encodedQuery = encodeURIComponent(
    `(${combinedQuery})${combinedArgs ? ` ${combinedArgs}` : ''}`
  )

  const response = await loggedFetch(
    `https://twitter283.p.rapidapi.com/Search?q=${encodedQuery}&type=${type}&count=100`,
    {
      headers: {
        'x-rapidapi-host': 'twitter283.p.rapidapi.com',
        'x-rapidapi-key': config.rapidapiKey
      }
    }
  )
  const data = transformTwitterResponse(response)

  return data
}
