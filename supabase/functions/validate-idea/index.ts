import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ideaId } = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Fetch the idea
    const { data: idea, error: ideaError } = await supabaseClient
      .from('startup_ideas')
      .select('*')
      .eq('id', ideaId)
      .single();

    if (ideaError) throw ideaError;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    const prompt = `Analyze this startup idea and provide validation scores:

Title: ${idea.title}
Problem: ${idea.problem}
Solution: ${idea.solution}
Target User: ${idea.target_user}
Tech Stack: ${idea.tech_stack?.join(', ') || 'Not specified'}
Stage: ${idea.stage}

Provide scores (0-100) for:
1. Problem Clarity - How well-defined and specific is the problem?
2. Market Need - How strong is the market need for this solution?
3. Solution Feasibility - How technically and practically feasible is the solution?

Also provide:
- Risk Notes: Key risks and challenges (2-3 bullet points)
- Recommendations: Actionable suggestions to improve the idea (2-3 bullet points)

Format your response as JSON with this structure:
{
  "problem_clarity_score": <number>,
  "market_need_score": <number>,
  "solution_feasibility_score": <number>,
  "overall_score": <number>,
  "risk_notes": "<string>",
  "recommendations": "<string>"
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'You are a startup validation expert. Provide honest, constructive feedback with specific scores and actionable recommendations.' 
          },
          { role: 'user', content: prompt }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    // Insert validation into database
    const { data: validation, error: validationError } = await supabaseClient
      .from('idea_validations')
      .insert({
        idea_id: ideaId,
        problem_clarity_score: result.problem_clarity_score,
        market_need_score: result.market_need_score,
        solution_feasibility_score: result.solution_feasibility_score,
        overall_score: result.overall_score,
        risk_notes: result.risk_notes,
        recommendations: result.recommendations,
      })
      .select()
      .single();

    if (validationError) throw validationError;

    return new Response(JSON.stringify(validation), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in validate-idea function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});