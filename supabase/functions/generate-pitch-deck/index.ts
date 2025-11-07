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

    // Fetch comprehensive data
    const { data: idea, error: ideaError } = await supabaseClient
      .from('startup_ideas')
      .select('*')
      .eq('id', ideaId)
      .single();

    if (ideaError) throw ideaError;

    const { data: validation } = await supabaseClient
      .from('idea_validations')
      .select('*')
      .eq('idea_id', ideaId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const { data: roadmap } = await supabaseClient
      .from('roadmaps')
      .select('*, roadmap_items(*)')
      .eq('idea_id', ideaId)
      .single();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
const prompt = `Create a professional pitch deck content for this startup:

Idea:
- Title: ${idea.title}
- Problem: ${idea.problem}
- Solution: ${idea.solution}
- Target User: ${idea.target_user}
- Tech Stack: ${idea.tech_stack?.join(', ') || 'Not specified'}
- Stage: ${idea.stage}

${validation ? `Validation: Overall Score ${validation.overall_score}/100` : ''}
${roadmap ? `Has a ${roadmap.total_weeks}-week roadmap` : ''}

Generate a concise 5-slide pitch deck with these slides:
1. Title Slide (compelling title, tagline, problem statement)
2. Solution (your unique approach and key features)
3. Market & Opportunity (target users, market size, competitive advantage)
4. Traction & Roadmap (current stage, key milestones, timeline)
5. The Ask (what you need, expected outcomes)

Format as JSON with slide objects:
{
  "slides": [
    {
      "title": "<string>",
      "content": "<string>",
      "notes": "<string for presenter notes>"
    }
  ]
}

Keep content concise and impactful. Each slide should have 3-5 bullet points maximum.`;

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
            content: 'You are a pitch deck expert. Create compelling, concise, investor-ready content. Keep each slide focused with 3-5 key points. Make it punchy and memorable.' 
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

    // Insert or update pitch deck
    const { data: pitchDeck, error: deckError } = await supabaseClient
      .from('pitch_decks')
      .upsert({
        idea_id: ideaId,
        content: result,
      }, {
        onConflict: 'idea_id'
      })
      .select()
      .single();

    if (deckError) throw deckError;

    return new Response(JSON.stringify(pitchDeck), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-pitch-deck function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});