import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Middlewares to check for token availability dynamically to avoid crash but give helpful messages
const getTodoistToken = (): string | undefined => {
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

// Helper to parse and format helpful error messages from both success and error Todoist response string bodies
const parseAndCheckTodoistResponseText = (text: string, status: number): { errorMsg: string } | null => {
  const lowers = text.toLowerCase();
  
  // Check if it's a plain text API deprecation/warning message, regardless of status code 
  // (some legacy mock proxies return 200 OK for raw text deprecation warnings)
  const trimmed = text.trim();
  const isPlainDeprecationMsg = 
    (lowers.includes("deprecated") || lowers.includes("v8") || lowers.includes("prefix") || status === 410) &&
    (!trimmed.startsWith("[") && !trimmed.startsWith("{")); // Deprecation notices are pure text/HTML, not JSON tasks arrays/objects

  if (isPlainDeprecationMsg) {
    return {
      errorMsg: "The Todoist API version being requested is deprecated or outdated. Please contact support or update the source endpoints to the modern REST API v2."
    };
  }

  // If the status code represents a successful response, and it's not a plain deprecation message, it's NOT an error.
  if (status >= 200 && status < 300) {
    return null;
  }
  
  // First, check for clear deprecation/outdated API signals
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

  // Next, check for authentication/token validity issues (401, 403, or clear authorization matches)
  if (
    status === 401 || 
    status === 403 ||
    lowers.includes("invalid") ||
    lowers.includes("unauthorized") ||
    lowers.includes("token")
  ) {
    return {
      errorMsg: "Your Todoist API token appears to be invalid, expired, or misconfigured. Please ensure you configured the raw Developer API Token (found in Todoist Settings -> Integrations -> Developer tab -> API Token) as TODOIST_API_TOKEN in the AI Studio Secrets panel. Note: Do not configure OAuth credential items (Client ID, Client Secret, Verification Token) under TODOIST_API_TOKEN."
    };
  }

  // Any other error (like a general 400 Bad Request or 404 Not Found) is a normal API operational error, 
  // not necessarily a token failure. Returning null allows the caller to show the actual API error message safely.
  return null;
};

// Check API status & configuration
app.get("/api/config-status", (req, res) => {
  const token = getTodoistToken();
  const isOk = typeof token === "string" && token.length > 0;
  res.json({
    configured: isOk,
    message: isOk 
      ? "Todoist token is configured successfully." 
      : "No Todoist API Token found. Please set TODOIST_API_TOKEN in the AI Studio Secrets panel."
  });
});

// Fetch all active tasks from Todoist
app.get("/api/get-tasks", async (req, res) => {
  const token = getTodoistToken();
  if (!token) {
    return res.status(400).json({ error: "TODOIST_API_TOKEN is not configured or is the default placeholder. Please set your real Todoist API Token in the Secrets menu to synchronize tasks." });
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
      const tasks = JSON.parse(text);
      return res.json(tasks);
    } catch {
      return res.status(500).json({ error: "Todoist Parse Error: Failed to decode JSON task payload." });
    }
  } catch (err: any) {
    console.error("Error in /api/get-tasks:", err);
    return res.status(500).json({ error: err?.message || "Internal server error" });
  }
});

// Create a new task in Todoist
app.post("/api/create-task", async (req, res) => {
  const token = getTodoistToken();
  if (!token) {
    return res.status(400).json({ error: "TODOIST_API_TOKEN is not configured or is the default placeholder. Please set your real Todoist API Token in the Secrets menu to sync changes." });
  }

  const { content, description, priority } = req.body;
  if (!content) {
    return res.status(400).json({ error: "Content field is required to create a task." });
  }

  try {
    const response = await fetch("https://api.todoist.com/rest/v2/tasks", {
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
      const task = JSON.parse(text);
      return res.json(task);
    } catch {
      return res.status(500).json({ error: "Todoist Parse Error: Failed to decode created task details." });
    }
  } catch (err: any) {
    console.error("Error in /api/create-task:", err);
    return res.status(500).json({ error: err?.message || "Internal server error" });
  }
});

// Update an existing task's priority/quadrant on Todoist
app.post("/api/update-task", async (req, res) => {
  const token = getTodoistToken();
  if (!token) {
    return res.status(400).json({ error: "TODOIST_API_TOKEN is not configured or is the default placeholder. Please set your real Todoist API Token in the Secrets menu to sync changes." });
  }

  const { id, priority, content, description } = req.body;
  if (!id) {
    return res.status(400).json({ error: "Task ID is required for updates." });
  }

  try {
    const updateBody: Record<string, any> = {};
    if (priority !== undefined) updateBody.priority = priority;
    if (content !== undefined) updateBody.content = content;
    if (description !== undefined) updateBody.description = description;

    const response = await fetch(`https://api.todoist.com/rest/v2/tasks/${id}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(updateBody)
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
      return res.status(response.status).json({ error: `Todoist API Error: ${text || "Unable to update task"}` });
    }

    try {
      const task = JSON.parse(text);
      return res.json(task);
    } catch {
      return res.status(500).json({ error: "Todoist Parse Error: Failed to decode updated task details." });
    }
  } catch (err: any) {
    console.error("Error in /api/update-task:", err);
    return res.status(500).json({ error: err?.message || "Internal server error" });
  }
});

// Complete (close) a task on Todoist
app.post("/api/complete-task", async (req, res) => {
  const token = getTodoistToken();
  if (!token) {
    return res.status(400).json({ error: "TODOIST_API_TOKEN is not configured or is the default placeholder. Please set your real Todoist API Token in the Secrets menu to sync changes." });
  }

  const { id } = req.body;
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

    return res.json({ success: true, message: `Task ${id} completed successfully.` });
  } catch (err: any) {
    console.error("Error in /api/complete-task:", err);
    return res.status(500).json({ error: err?.message || "Internal server error" });
  }
});

// Delete a task on Todoist
app.post("/api/delete-task", async (req, res) => {
  const token = getTodoistToken();
  if (!token) {
    return res.status(400).json({ error: "TODOIST_API_TOKEN is not configured or is the default placeholder. Please set your real Todoist API Token in the Secrets menu to sync changes." });
  }

  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: "Task ID is required for deletion." });
  }

  try {
    const response = await fetch(`https://api.todoist.com/rest/v2/tasks/${id}`, {
      method: "DELETE",
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
      return res.status(response.status).json({ error: `Todoist API Error: ${text || "Unable to delete task"}` });
    }

    return res.json({ success: true, message: `Task ${id} deleted successfully.` });
  } catch (err: any) {
    console.error("Error in /api/delete-task:", err);
    return res.status(500).json({ error: err?.message || "Internal server error" });
  }
});

// Start server incorporating Vite middleware for dev or standard static serving for prod
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
