const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
const MAX_SNAPSHOTS_IN_PROMPT = 10;

const buildPrompt = (endpoint, anomaly, recentSnapshots) => {
  const snapshotLines = recentSnapshots
    .slice(0, MAX_SNAPSHOTS_IN_PROMPT)
    .map((s) => {
      const time = new Date(s.timestamp).toISOString();
      return `- ${time} | status=${s.statusCode ?? "n/a"} | latency=${s.latencyMs ?? "n/a"}ms | success=${s.success} | error=${s.error ?? "none"}`;
    })
    .join("\n");

  return `You are an SRE assistant helping diagnose an API monitoring alert.

Endpoint: ${endpoint.name} (${endpoint.method} ${endpoint.url})
Anomaly type detected: ${anomaly.type}
Anomaly reason: ${anomaly.reason}

Recent health-check history for this endpoint (most recent first):
${snapshotLines}

In 3-4 short sentences, written in plain English for a developer who has never seen this data before:
1. Describe what changed in this endpoint's behavior.
2. State the most likely cause.
3. Suggest one concrete next step to investigate.

Do not repeat the raw numbers back verbatim — interpret them.`;
};

const getDiagnosis = async (endpoint, anomaly, recentSnapshots) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "your_key_here") {
    return "AI diagnosis unavailable: GEMINI_API_KEY is not configured in .env.";
  }

  const prompt = buildPrompt(endpoint, anomaly, recentSnapshots);

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Gemini API error (${response.status}):`, errorBody);
      return "AI diagnosis unavailable: the AI service returned an error. See server logs for details.";
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return text?.trim() || "AI diagnosis unavailable: empty response from the AI service.";
  } catch (err) {
    console.error("Failed to get AI diagnosis:", err.message);
    return "AI diagnosis unavailable: could not reach the AI service.";
  }
};

export default getDiagnosis;