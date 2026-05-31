import { getTodoistToken, parseAndCheckTodoistResponseText } from "./_utils";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST instead." });
  }

  const token = getTodoistToken();
  if (!token) {
    return res.status(400).json({ 
      error: "TODOIST_API_TOKEN is not configured. Please set your real Todoist API Token in the environment variables to sync changes." 
    });
  }

  const { id } = req.body || {};
  if (!id) {
    return res.status(400).json({ error: "Task ID is required for marking it complete." });
  }

  try {
    const response = await fetch(`https://api.todoist.com/rest/v2/tasks/${id}/close`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    let text = "";
    try {
      text = await response.text();
    } catch (e) {
      text = "";
    }

    const checkErr = parseAndCheckTodoistResponseText(text, response.status);
    if (checkErr) {
      return res.status(400).json({ error: `Todoist API Error: ${checkErr.errorMsg}` });
    }

    if (!response.ok) {
      return res.status(response.status).json({ error: `Todoist API Error: ${text || "Unable to complete task"}` });
    }

    return res.status(200).json({ success: true, message: `Task ${id} completed successfully.` });
  } catch (err: any) {
    console.error("Error in /api/complete-task:", err);
    return res.status(500).json({ error: err?.message || "Internal server error" });
  }
}
