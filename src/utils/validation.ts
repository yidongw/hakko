/**
 * Extracts ticker and name from a tweet based on the pattern "$tick + name"
 * @param text The tweet text to parse
 * @returns An object containing the ticker and name, or empty strings if not found
 */
export function extractTickerAndName(text: string): { ticker: string; name: string, description: string } {
  // Look for pattern "$ticker + name" where name has no spaces
  const regex = /\$([A-Za-z0-9]+)\s*\+\s*([A-Za-z0-9_]+)/;
  const match = text.match(regex);
  
  if (match && match.length >= 3) {
    return {
      ticker: match[1],
      name: match[2],
      description: text
    };
  }
  
  return {
    ticker: '',
    name: '',
    description: ''
  };
}