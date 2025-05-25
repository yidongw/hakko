import { logger } from './logger'

export async function loggedFetch(url: string, options?: RequestInit, defaultResponse?: any) {
  // const startTime = Date.now()
  // logger().info(`Started fetching URL: ${url}`)

  const maxRetries = 3
  let retryCount = 0

  while (true) {
    try {
      // Add timeout to fetch
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 7000) // 7 seconds timeout
      // const startTime = Date.now()
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      }).finally(() => {
        clearTimeout(timeoutId)
      })

      // const endTime = Date.now()
      // logger().info(`Completed fetching for ${url} (${endTime - startTime}ms)`)

      if (!response.ok) {
        if (response.status === 400) {
          logger().warn(`400 error for ${url}. Returning default response.`)
          return defaultResponse ?? null
        }

        const text = await response.text()
        throw new Error(`HTTP error! status: ${response.status} ${text}`)
      }

      const data = await response.json()
      return data
    } catch (error: any) {
      retryCount++
      const waitTime = Math.min(100 * Math.pow(2, retryCount), 10000) // exponential backoff with max 10s

      // Log the full error details
      logger().error(
        {
          error: {
            name: error.name,
            message: error.message,
            code: error.code,
            type: error.type,
            cause: error.cause,
            stack: error.stack
          },
          url,
          retryCount,
          maxRetries,
          waitTime
        },
        `Error fetching ${url}. Retry ${retryCount}/${maxRetries}. Waiting ${waitTime}ms`
      )

      if (retryCount >= maxRetries) {
        logger().error(`Max retries (${maxRetries}) reached for fetching ${url}. Giving up.`)
        return defaultResponse ?? null
      }

      // Wait before retry
      try {
        await new Promise((resolve) => setTimeout(resolve, waitTime))
      } catch (timeoutError) {
        logger().error(`Error during timeout between retries: ${timeoutError}`)
      }
    }
  }
}
