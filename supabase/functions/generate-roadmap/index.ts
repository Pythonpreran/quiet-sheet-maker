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
    
    const prompt = `Generate a detailed 6-week execution roadmap for this startup idea:

Title: ${idea.title}
Problem: ${idea.problem}
Solution: ${idea.solution}
Target User: ${idea.target_user}
Tech Stack: ${idea.tech_stack?.join(', ') || 'Not specified'}
Stage: ${idea.stage}

Create a 6-week roadmap where each week has:
- Title: A clear theme for the week
- Description: What to focus on
- Projects: 2-3 specific projects/tasks to complete
- KPIs: 2-3 measurable key performance indicators
- Required Skills: Technical or business skills needed
- Milestones: Key deliverables for the week

Make it actionable and realistic for a student founder.

Format your response as JSON:
{
  "weeks": [
    {
      "week_number": 1,
      "title": "<string>",
      "description": "<string>",
      "projects": ["<string>", "<string>"],
      "kpis": ["<string>", "<string>"],
      "required_skills": ["<string>", "<string>"],
      "milestones": ["<string>", "<string>"]
    },
    ... (6 weeks total)
  ]
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
            content: 'You are a startup mentor helping students build MVPs. Create practical, achievable roadmaps.' 
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

    // Create roadmap
    const { data: roadmap, error: roadmapError } = await supabaseClient
      .from('roadmaps')
      .insert({
        idea_id: ideaId,
        total_weeks: 6,
      })
      .select()
      .single();

    if (roadmapError) throw roadmapError;

    // Insert roadmap items
    const roadmapItems = result.weeks.map((week: any) => ({
      roadmap_id: roadmap.id,
      week_number: week.week_number,
      title: week.title,
      description: week.description,
      projects: week.projects,
      kpis: week.kpis,
      required_skills: week.required_skills,
      milestones: week.milestones,
    }));

    const { data: items, error: itemsError } = await supabaseClient
      .from('roadmap_items')
      .insert(roadmapItems)
      .select();

    if (itemsError) throw itemsError;

    return new Response(JSON.stringify({ roadmap, items }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-roadmap function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});