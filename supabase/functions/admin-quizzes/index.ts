import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

function verifyAdmin(req: Request): boolean {
  const token = req.headers.get("x-admin-token");
  if (!token) return false;
  try {
    const decoded = atob(token);
    const [userId] = decoded.split(":");
    return userId === "amanuzzama";
  } catch {
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (!verifyAdmin(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = getSupabase();
  const url = new URL(req.url);
  const path = url.pathname.split("/").pop();

  try {
    const body = req.method !== "GET" ? await req.json() : null;

    // LIST quizzes
    if (req.method === "GET" || (body && body.action === "list")) {
      const { data, error } = await supabase
        .from("quizzes")
        .select("*, questions(count)")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get attempt counts
      const quizIds = (data || []).map((q: any) => q.id);
      const { data: attempts } = await supabase
        .from("quiz_attempts")
        .select("quiz_id")
        .in("quiz_id", quizIds);

      const attemptCounts: Record<string, number> = {};
      (attempts || []).forEach((a: any) => {
        attemptCounts[a.quiz_id] = (attemptCounts[a.quiz_id] || 0) + 1;
      });

      const quizzes = (data || []).map((q: any) => ({
        ...q,
        question_count: q.questions?.[0]?.count || 0,
        attempt_count: attemptCounts[q.id] || 0,
      }));

      return new Response(JSON.stringify({ quizzes }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // CREATE quiz
    if (body?.action === "create") {
      const { title, marks_per_question, total_time_minutes, questions, status, class_level, test_type, subject } = body;

      const { data: quiz, error: quizError } = await supabase
        .from("quizzes")
        .insert({ title, marks_per_question, total_time_minutes, status: status || "draft", class_level: class_level || null, test_type: test_type || null, subject: subject || null })
        .select()
        .single();

      if (quizError) throw quizError;

      if (questions && questions.length > 0) {
        const questionsToInsert = questions.map((q: any, i: number) => ({
          quiz_id: quiz.id,
          question_text: q.question_text,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          correct_option: q.correct_option || null,
          question_order: i,
        }));

        const { error: qError } = await supabase.from("questions").insert(questionsToInsert);
        if (qError) throw qError;
      }

      return new Response(JSON.stringify({ quiz }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // UPDATE quiz
    if (body?.action === "update") {
      const { id, title, marks_per_question, total_time_minutes, status, questions, class_level, test_type, subject } = body;

      const updateData: Record<string, unknown> = { title, marks_per_question, total_time_minutes, status };
      if (class_level !== undefined) updateData.class_level = class_level || null;
      if (test_type !== undefined) updateData.test_type = test_type || null;
      if (subject !== undefined) updateData.subject = subject || null;

      const { error: quizError } = await supabase
        .from("quizzes")
        .update(updateData)
        .eq("id", id);

      if (quizError) throw quizError;

      if (questions) {
        // Delete old questions and insert new
        await supabase.from("questions").delete().eq("quiz_id", id);

        const questionsToInsert = questions.map((q: any, i: number) => ({
          quiz_id: id,
          question_text: q.question_text,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          correct_option: q.correct_option || null,
          question_order: i,
        }));

        const { error: qError } = await supabase.from("questions").insert(questionsToInsert);
        if (qError) throw qError;
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DELETE quiz
    if (body?.action === "delete") {
      const { error } = await supabase.from("quizzes").delete().eq("id", body.id);
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET single quiz with questions
    if (body?.action === "get") {
      const { data: quiz, error } = await supabase
        .from("quizzes")
        .select("*, questions(*)")
        .eq("id", body.id)
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ quiz }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET quiz attempts
    if (body?.action === "attempts") {
      const { data: attempts, error } = await supabase
        .from("quiz_attempts")
        .select("*")
        .eq("quiz_id", body.quiz_id)
        .order("submitted_at", { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify({ attempts }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET attempt detail
    if (body?.action === "attempt_detail") {
      const { data: attempt, error: aError } = await supabase
        .from("quiz_attempts")
        .select("*")
        .eq("id", body.attempt_id)
        .single();

      if (aError) throw aError;

      const { data: answers, error: ansError } = await supabase
        .from("user_answers")
        .select("*, questions(*)")
        .eq("attempt_id", body.attempt_id);

      if (ansError) throw ansError;

      return new Response(JSON.stringify({ attempt, answers }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DASHBOARD stats
    if (body?.action === "stats") {
      const { count: quizCount } = await supabase
        .from("quizzes")
        .select("*", { count: "exact", head: true });

      const { count: attemptCount } = await supabase
        .from("quiz_attempts")
        .select("*", { count: "exact", head: true });

      return new Response(JSON.stringify({ quiz_count: quizCount || 0, attempt_count: attemptCount || 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("admin-quizzes error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
