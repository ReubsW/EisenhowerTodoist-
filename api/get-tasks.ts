const { getTodoistToken, parseAndCheckTodoistResponseText } = require("./_utils");

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed. Use GET instead." });
  }

  const token = getTodoistToken();
  if (!token) {
    return res.status(400).json({ 
      error: "TODOIST_API_TOKEN is not configured. Please set your real Todoist API Token in the environment variables to synchronize tasks." 
    });
  }

  try {
    const response = await fetch("https://api.todoist.com/rest/v2/tasks", {
      method: "GET",
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
      return res.status(response.status).json({ error: `Todoist API Error: ${text || "Unable to retrieve tasks"}` });
    }

    try {
      const raw = JSON.parse(text);
      const results = Array.isArray(raw) ? raw : (raw?.results || []);
      const tasks = results.map((t: any) => ({
        id: t.id,
        content: t.content,
        description: t.description || "",
        is_completed: t.is_completed || t.checked || false,
        priority: t.priority || 1,
        url: t.url || "https://todoist.com"
      }));
      return res.status(200).json(tasks);
    } catch {
      return res.status(500).json({ error: "Todoist Parse Error: Failed to decode JSON task payload." });
    }
  } catch (err: any) {
    console.error("Error in /api/get-tasks:", err);
    return res.status(500).json({ error: err?.message || "Internal server error" });
  }
}
