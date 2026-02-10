import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { quiz_id, user_name, answers, time_taken_seconds } = await req.json();

    if (!quiz_id || !user_name || !answers) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get quiz and questions
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .select("*, questions(*)")
      .eq("id", quiz_id)
      .eq("status", "published")
      .single();

    if (quizError || !quiz) {
      return new Response(JSON.stringify({ error: "Quiz not found or not published" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate score
    const questions = quiz.questions || [];
    let correctCount = 0;
    let wrongCount = 0;

    const userAnswers = questions.map((q: any) => {
      const userAnswer = answers[q.id] || null;
      const isCorrect = userAnswer === q.correct_option;
      if (userAnswer) {
        if (isCorrect) correctCount++;
        else wrongCount++;
      }
      return {
        question_id: q.id,
        selected_option: userAnswer,
        is_correct: isCorrect,
      };
    });

    const score = correctCount * quiz.marks_per_question;
    const totalMarks = questions.length * quiz.marks_per_question;

    // Create attempt
    const { data: attempt, error: attemptError } = await supabase
      .from("quiz_attempts")
      .insert({
        quiz_id,
        user_name,
        score,
        total_marks: totalMarks,
        correct_count: correctCount,
        wrong_count: wrongCount,
        time_taken_seconds: time_taken_seconds || null,
      })
      .select()
      .single();

    if (attemptError) throw attemptError;

    // Insert user answers
    const answersToInsert = userAnswers.map((a: any) => ({
      ...a,
      attempt_id: attempt.id,
    }));

    const { error: ansError } = await supabase.from("user_answers").insert(answersToInsert);
    if (ansError) throw ansError;

    // Return result with question details
    const result = {
      attempt_id: attempt.id,
      user_name,
      quiz_title: quiz.title,
      score,
      total_marks: totalMarks,
      correct_count: correctCount,
      wrong_count: wrongCount,
      time_taken_seconds,
      details: questions.map((q: any) => {
        const ua = userAnswers.find((a: any) => a.question_id === q.id);
        return {
          question_text: q.question_text,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          correct_option: q.correct_option,
          selected_option: ua?.selected_option || null,
          is_correct: ua?.is_correct || false,
        };
      }),
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("submit-quiz error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Submission failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
