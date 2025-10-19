import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 20 // requests per hour
const RATE_WINDOW = 60 * 60 * 1000 // 1 hour in milliseconds

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(userId)

  if (!userLimit || now > userLimit.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW })
    return true
  }

  if (userLimit.count >= RATE_LIMIT) {
    return false
  }

  userLimit.count++
  return true
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    
    const { data: { user: currentUser } } = await supabaseAdmin.auth.getUser(token);
    
    if (!currentUser) {
      throw new Error('Usuário não autenticado');
    }

    // Verificar se o usuário atual é coordenador
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', currentUser.id)
      .single();

    if (roleError || roleData?.role !== 'coordenador') {
      throw new Error('Apenas coordenadores podem atualizar usuários');
    }

    // Check rate limit
    if (!checkRateLimit(currentUser.id)) {
      return new Response(
        JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em 1 hora.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { userId, email, nome_completo } = await req.json();

    if (!userId) {
      throw new Error('ID do usuário é obrigatório');
    }

    // Atualizar email no auth.users se fornecido
    if (email) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { email }
      );

      if (authError) {
        throw new Error(`Erro ao atualizar email: ${authError.message}`);
      }
    }

    // Atualizar nome no profiles
    if (nome_completo) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ nome_completo, ...(email && { email }) })
        .eq('id', userId);

      if (profileError) {
        throw new Error(`Erro ao atualizar perfil: ${profileError.message}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
