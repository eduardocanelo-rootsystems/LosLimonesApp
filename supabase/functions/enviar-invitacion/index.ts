import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const rol = user.app_metadata?.rol
    if (!['superadmin', 'admin'].includes(rol)) {
      return new Response(JSON.stringify({ error: 'Sin permisos' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { email, token, rolInvitado } = await req.json()
    if (!email || !token) {
      return new Response(JSON.stringify({ error: 'Faltan datos' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const appUrl    = Deno.env.get('APP_URL') ?? 'https://limonescreativos.com'
    const link      = `${appUrl}/registro?token=${token}`
    const resendKey = Deno.env.get('RESEND_API_KEY')

    if (!resendKey) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY no configurado' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const ROL_LABEL: Record<string, string> = {
      superadmin: 'Superadmin',
      admin:      'Administrador',
      socio:      'Socio',
      empleado:   'Empleado',
    }

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from:    'Los Limones Creativos <invitaciones@limonescreativos.com>',
        to:      email,
        subject: 'Invitación al sistema de gestión · Los Limones Creativos',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#111;">
            <div style="background:#1F1F1F;padding:24px 32px;border-radius:8px 8px 0 0;border-bottom:3px solid #B7FF00;">
              <p style="color:#B7FF00;font-size:20px;font-weight:bold;margin:0;">Los Limones Creativos</p>
              <p style="color:#5E5E5E;font-size:11px;margin:4px 0 0;letter-spacing:2px;text-transform:uppercase;">Sistema de gestión</p>
            </div>
            <div style="background:#F4F4F4;padding:28px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
              <p style="font-size:15px;margin:0 0 12px;">Hola,</p>
              <p style="font-size:14px;color:#374151;margin:0 0 20px;">
                Fuiste invitado/a a unirte al sistema de gestión de <strong>Los Limones Creativos</strong>
                con el rol de <strong>${ROL_LABEL[rolInvitado] ?? rolInvitado}</strong>.
              </p>
              <div style="margin:28px 0;text-align:center;">
                <a href="${link}"
                   style="background:#B7FF00;color:#1F1F1F;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:700;display:inline-block;">
                  Crear mi cuenta
                </a>
              </div>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 16px;" />
              <p style="color:#9ca3af;font-size:12px;margin:0;">
                Este enlace vence en 7 días. Si no esperabas esta invitación, podés ignorar este email.
              </p>
            </div>
          </div>
        `,
      }),
    })

    if (!emailRes.ok) {
      const err = await emailRes.text()
      console.error('Resend error:', err)
      return new Response(JSON.stringify({ error: 'Error al enviar email', detail: err }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
