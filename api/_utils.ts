// Shared backend utils for Vercel Serverless Functions

export const getTodoistToken = (): string | undefined => {
  let token = process.env.TODOIST_API_TOKEN;
  if (!token) return undefined;
  
  token = token.trim();
  
  // Clean off accidental surrounding quotes if copy-pasted with them
  if (token.startsWith('"') && token.endsWith('"')) {
    token = token.slice(1, -1).trim();
  }
  if (token.startsWith("'") && token.endsWith("'")) {
    token = token.slice(1, -1).trim();
  }
  
  const lowers = token.toLowerCase();
  if (
    lowers === "" ||
    lowers === "my_todoist_api_token" ||
    lowers === "your_todoist_api_token" ||
    lowers === "your_token_here" ||
    lowers === "placeholder" ||
    lowers === "null" ||
    lowers === "undefined"
  ) {
    return undefined;
  }
  return token;
};

export const parseAndCheckTodoistResponseText = (
  text: string,
  status: number
): { errorMsg: string } | null => {
  const lowers = text.toLowerCase();
  
  // Check if it's a plain text API deprecation/warning message, regardless of status code 
  const trimmed = text.trim();
  const isPlainDeprecationMsg = 
    (lowers.includes("deprecated") || lowers.includes("v8") || lowers.includes("prefix") || status === 410) &&
    (!trimmed.startsWith("[") && !trimmed.startsWith("{"));

  if (isPlainDeprecationMsg) {
    return {
      errorMsg: "The Todoist API version being requested is deprecated or outdated. Please contact support or update the source endpoints to the modern REST API v2."
    };
  }

  if (status >= 200 && status < 300) {
    return null;
  }
  
  if (
    lowers.includes("deprecated") || 
    lowers.includes("v8") || 
    lowers.includes("prefix") ||
    status === 410
  ) {
    return {
      errorMsg: "The Todoist API version being requested is deprecated or outdated. Please contact support or update the source endpoints to the modern REST API v2."
    };
  }

  if (
    status === 401 || 
    status === 403 ||
    lowers.includes("invalid") ||
    lowers.includes("unauthorized") ||
    lowers.includes("token")
  ) {
    return {
      errorMsg: "Your Todoist API token appears to be invalid, expired, or misconfigured. Please ensure you configured the raw Developer API Token (found in Todoist Settings -> Integrations -> Developer tab -> API Token) as TODOIST_API_TOKEN in the environment panel."
    };
  }

  return null;
};
