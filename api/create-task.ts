import { getTodoistToken, parseAndCheckTodoistResponseText } from "./_utils.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST instead." });
  }

  const token = getTodoistToken();
  if (!token) {
    return res.status(400).json({ 
      error: "TODOIST_API_TOKEN is not configured. Please set your real Todoist API Token in the environment variables to sync changes." 
    });
  }

  const { content, description, priority } = req.body || {};
  if (!content) {
    return res.status(400).json({ error: "Content field is required to create a task." });
  }

  try {
    const response = await fetch("https://api.todoist.com/api/v1/tasks", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        content,
        description: description || "",
        priority: priority || 1
      })
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
      return res.status(response.status).json({ error: `Todoist API Error: ${text || "Unable to create task"}` });
    }

    try {
      const t = JSON.parse(text);
      const mappedTask = {
        id: t.id,
        content: t.content,
        description: t.description || "",
        is_completed: t.is_completed || t.checked || false,
        priority: t.priority || 1,
        url: t.url || "https://todoist.com"
      };
      return res.status(200).json(mappedTask);
    } catch {
      return res.status(500).json({ error: "Todoist Parse Error: Failed to decode created task details." });
    }
  } catch (err: any) {
    console.error("Error in /api/create-task:", err);
    return res.status(500).json({ error: err?.message || "Internal server error" });
  }
}
