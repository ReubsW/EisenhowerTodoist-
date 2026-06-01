import { getTodoistToken } from "./_utils";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed. Use GET instead." });
  }

  const token = getTodoistToken();
  const isOk = typeof token === "string" && token.length > 0;
  
  return res.status(200).json({
    configured: isOk,
    message: isOk 
      ? "Todoist token is configured successfully." 
      : "No Todoist API Token found. Please set TODOIST_API_TOKEN in the environment panel."
  });
}
