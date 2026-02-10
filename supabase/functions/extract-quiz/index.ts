import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Verify admin
  const token = req.headers.get("x-admin-token");
  if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  try {
    const decoded = atob(token);
    const [userId] = decoded.split(":");
    if (userId !== "amanuzzama") throw new Error("Invalid");
  } catch {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { pdf_text } = await req.json();

    if (!pdf_text || pdf_text.trim().length === 0) {
      return new Response(JSON.stringify({ error: "No PDF text provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are a quiz extraction AI. Extract MCQ questions from the provided text.

Rules:
- Extract ALL questions found in the text
- Each question must have exactly 4 options (A, B, C, D)
- If correct answers are indicated in the text, include them
- If correct answers are NOT found, set correct_option to null
- Return valid JSON only, no markdown

Output format:
{
  "title": "Quiz title extracted or generated from content",
  "questions": [
    {
      "question_text": "The question text",
      "option_a": "Option A text",
      "option_b": "Option B text", 
      "option_c": "Option C text",
      "option_d": "Option D text",
      "correct_option": "A" or "B" or "C" or "D" or null
    }
  ],
  "has_answers": true/false
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Extract MCQ questions from this text:\n\n${pdf_text}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_quiz",
              description: "Extract structured MCQ quiz data from text",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Quiz title" },
                  questions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        question_text: { type: "string" },
                        option_a: { type: "string" },
                        option_b: { type: "string" },
                        option_c: { type: "string" },
                        option_d: { type: "string" },
                        correct_option: { type: "string", enum: ["A", "B", "C", "D"], description: "Correct option letter, or omit if unknown" },
                      },
                      required: ["question_text", "option_a", "option_b", "option_c", "option_d"],
                      additionalProperties: false,
                    },
                  },
                  has_answers: { type: "boolean", description: "Whether correct answers were found in the text" },
                },
                required: ["title", "questions", "has_answers"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_quiz" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      throw new Error("AI extraction failed");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      throw new Error("AI did not return structured data");
    }

    const extracted = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(extracted), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-quiz error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Extraction failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
