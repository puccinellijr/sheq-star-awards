import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.0.0';
import { createTransport } from "npm:nodemailer@6.9.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// SMTP Configuration for Office365
const smtpConfig = {
  hostname: "smtp.office365.com",
  port: 587,
  username: Deno.env.get('SMTP_USERNAME') || 'alerta.rg@odfjellterminals.com.br',
  password: Deno.env.get('SMTP_PASSWORD') || 'Sov94408',
  secure: false, // STARTTLS
};

const transporter = createTransport({
  host: smtpConfig.hostname,
  port: smtpConfig.port,
  secure: smtpConfig.secure,
  auth: {
    user: smtpConfig.username,
    pass: smtpConfig.password,
  },
});

interface NotificationRequest {
  type: 'voting_start' | 'voting_reminder' | 'voting_end';
  month: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, month }: NotificationRequest = await req.json();

    // Get all gestores (users who can vote)
    const { data: gestores, error: gestoresError } = await supabase
      .from('profiles')
      .select('email, name')
      .eq('role', 'gestor');

    if (gestoresError) {
      throw new Error(`Error fetching gestores: ${gestoresError.message}`);
    }

    if (!gestores || gestores.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No gestores found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get voting period details
    const { data: period, error: periodError } = await supabase
      .from('voting_periods')
      .select('*')
      .eq('month', month)
      .single();

    if (periodError) {
      throw new Error(`Error fetching voting period: ${periodError.message}`);
    }

    const [year, monthNum] = month.split('-');
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                       'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const monthName = monthNames[parseInt(monthNum) - 1];
    const endDate = new Date(period.end_date).toLocaleDateString('pt-BR');

    let subject = '';
    let htmlContent = '';

    switch (type) {
      case 'voting_start':
        subject = `🗳️ Votação SHEQ ${monthName}/${year} - Aberta`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #1e40af; color: white; padding: 20px; text-align: center;">
              <h1>Destaque SHEQ - Odfjell Terminals</h1>
            </div>
            <div style="padding: 20px; background: #f9fafb;">
              <h2 style="color: #1e40af;">Votação Aberta - ${monthName}/${year}</h2>
              <p>Olá,</p>
              <p>A votação para o <strong>Destaque SHEQ de ${monthName}/${year}</strong> está aberta!</p>
              <p>📅 <strong>Prazo:</strong> Até ${endDate}</p>
              <p>🎯 <strong>O que fazer:</strong></p>
              <ul>
                <li>Acesse o sistema Destaque SHEQ</li>
                <li>Vote em 1 funcionário e 1 terceirizado que se destacaram em SHEQ</li>
                <li>Responda as 8 perguntas de avaliação para cada um</li>
              </ul>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${Deno.env.get('SITE_URL') || 'https://destaque-sheq.lovable.app'}" 
                   style="background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Acessar Sistema de Votação
                </a>
              </div>
              <p style="color: #6b7280; font-size: 14px;">
                Sua participação é importante para reconhecer quem se destaca em Segurança, Saúde, Meio Ambiente e Qualidade.
              </p>
            </div>
          </div>
        `;
        break;

      case 'voting_reminder':
        subject = `⏰ Lembrete: Votação SHEQ ${monthName}/${year} - Encerra em breve`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #dc2626; color: white; padding: 20px; text-align: center;">
              <h1>⏰ Lembrete Importante</h1>
            </div>
            <div style="padding: 20px; background: #f9fafb;">
              <h2 style="color: #dc2626;">Votação Encerrando - ${monthName}/${year}</h2>
              <p>Olá,</p>
              <p><strong>Últimos dias</strong> para votar no Destaque SHEQ de ${monthName}/${year}!</p>
              <p>🚨 <strong>Encerra em:</strong> ${endDate}</p>
              <p>Ainda não votou? Acesse agora e participe!</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${Deno.env.get('SITE_URL') || 'https://destaque-sheq.lovable.app'}" 
                   style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Votar Agora
                </a>
              </div>
            </div>
          </div>
        `;
        break;

      case 'voting_end':
        subject = `✅ Votação SHEQ ${monthName}/${year} - Encerrada`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #059669; color: white; padding: 20px; text-align: center;">
              <h1>Votação Encerrada</h1>
            </div>
            <div style="padding: 20px; background: #f9fafb;">
              <h2 style="color: #059669;">Resultados - ${monthName}/${year}</h2>
              <p>A votação do Destaque SHEQ de ${monthName}/${year} foi encerrada.</p>
              <p>Em breve, os vencedores serão anunciados!</p>
              <p>Obrigado pela sua participação. 🏆</p>
            </div>
          </div>
        `;
        break;
    }

    // Send emails to all gestores using Nodemailer with delay
    const results = [];
    
    for (let i = 0; i < gestores.length; i++) {
      const gestor = gestores[i];
      
      try {
        const mailOptions = {
          from: smtpConfig.username,
          to: gestor.email,
          subject,
          html: htmlContent,
        };

        await transporter.sendMail(mailOptions);
        
        console.log(`Email sent successfully to ${gestor.email}`);
        results.push({ email: gestor.email, success: true });
      } catch (error) {
        console.error(`Failed to send email to ${gestor.email}:`, error);
        results.push({ email: gestor.email, success: false, error: error.message });
      }

      // Add delay between emails (except for the last one)
      if (i < gestores.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5 second delay
      }
    }
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`Email notification sent: ${successful} successful, ${failed} failed`);

    return new Response(
      JSON.stringify({
        message: `Notifications sent: ${successful} successful, ${failed} failed`,
        results: results
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in send-notifications function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);