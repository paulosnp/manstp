import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const invitationSchema = z.object({
  email: z.string().email(),
  role: z.enum(['coordenador', 'visualizador']),
  nome: z.string().optional(),
});

// Gerar token seguro
function generateSecureToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
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
      throw new Error('Apenas coordenadores podem enviar convites');
    }

    // Validar dados do convite
    const body = await req.json();
    const validation = invitationSchema.safeParse(body);
    
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Dados inválidos', details: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email, role, nome } = validation.data;

    // Verificar se o email já está cadastrado
    const { data: existingUser, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Erro ao listar usuários:', listError);
      throw new Error('Erro ao verificar usuários existentes');
    }
    
    const emailExists = existingUser?.users?.some(u => u.email?.toLowerCase() === email.toLowerCase());

    if (emailExists) {
      return new Response(
        JSON.stringify({ error: 'Este email já está cadastrado no sistema' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se já existe convite pendente para este email
    const { data: existingInvitation, error: inviteCheckError } = await supabaseAdmin
      .from('invitations')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .maybeSingle();

    if (inviteCheckError) {
      console.error('Erro ao verificar convites:', inviteCheckError);
      throw new Error('Erro ao verificar convites pendentes');
    }

    if (existingInvitation) {
      return new Response(
        JSON.stringify({ error: 'Já existe um convite pendente para este email' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Gerar token único
    const inviteToken = generateSecureToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expira em 7 dias

    // Criar convite no banco
    const { error: insertError } = await supabaseAdmin
      .from('invitations')
      .insert({
        email: email.toLowerCase(),
        token: inviteToken,
        invited_by: currentUser.id,
        role,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error('Erro ao criar convite:', insertError);
      throw new Error(`Erro ao criar convite: ${insertError.message}`);
    }

    // Enviar email via Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY não configurada');
      throw new Error('Configuração de email não encontrada');
    }
    
    const resend = new Resend(resendApiKey);
    
    // Construir URL do convite de forma mais robusta
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
    const appUrl = projectRef ? `https://${projectRef}.lovable.app` : 'https://lovable.app';
    const inviteUrl = `${appUrl}/auth?invite=${inviteToken}`;
    
    console.log('URL do convite:', inviteUrl);

    const { error: emailError } = await resend.emails.send({
      from: 'GESTOR ESCOLAR <onboarding@resend.dev>',
      to: [email],
      subject: 'Convite para GESTOR ESCOLAR',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; background: #667eea; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
              .info { background: white; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #667eea; }
              .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎓 Convite para GESTOR ESCOLAR</h1>
              </div>
              <div class="content">
                <p>Olá${nome ? ` <strong>${nome}</strong>` : ''},</p>
                
                <p>Você foi convidado(a) a fazer parte do <strong>GESTOR ESCOLAR</strong> como <strong>${role === 'coordenador' ? 'Coordenador' : 'Visualizador'}</strong>.</p>
                
                <div class="info">
                  <p><strong>📧 Email:</strong> ${email}</p>
                  <p><strong>👤 Perfil:</strong> ${role === 'coordenador' ? 'Coordenador (acesso total)' : 'Visualizador (somente leitura)'}</p>
                  <p><strong>⏰ Validade:</strong> 7 dias</p>
                </div>

                <p style="text-align: center;">
                  <a href="${inviteUrl}" class="button">Aceitar Convite e Criar Conta</a>
                </p>

                <p style="font-size: 12px; color: #6b7280;">
                  Ou copie e cole este link no navegador:<br>
                  <code style="background: #e5e7eb; padding: 5px 10px; border-radius: 4px; display: inline-block; margin-top: 5px;">${inviteUrl}</code>
                </p>

                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                  <p style="font-size: 13px; color: #6b7280;">
                    <strong>⚠️ Importante:</strong>
                  </p>
                  <ul style="font-size: 13px; color: #6b7280;">
                    <li>Este convite é válido por <strong>7 dias</strong></li>
                    <li>Pode ser usado <strong>apenas uma vez</strong></li>
                    <li>Se você não solicitou este convite, ignore este email</li>
                  </ul>
                </div>
              </div>
              <div class="footer">
                <p>GESTOR ESCOLAR - Sistema de Gestão Educacional</p>
                <p>Este é um email automático, por favor não responda.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (emailError) {
      console.error('Erro ao enviar email:', emailError);
      
      // Deletar convite se o email falhar
      await supabaseAdmin
        .from('invitations')
        .delete()
        .eq('token', inviteToken);
      
      throw new Error(`Erro ao enviar email: ${emailError.message || 'Verifique se o domínio está validado no Resend'}`);
    }

    console.log(`Convite enviado com sucesso para ${email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Convite enviado com sucesso',
        expires_at: expiresAt.toISOString() 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Erro na função send-invitation:', error);
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
