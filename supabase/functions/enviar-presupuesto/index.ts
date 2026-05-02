import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const FROM_EMAIL    = Deno.env.get('FROM_EMAIL') ?? 'Los Limones Creativos <onboarding@resend.dev>'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  try {
    const { email, pdfBase64, numero, nombreCliente } = await req.json()

    if (!email || !pdfBase64 || !numero) {
      return new Response(
        JSON.stringify({ error: 'Faltan campos requeridos: email, pdfBase64, numero' }),
        { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } }
      )
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [email],
        subject: `Presupuesto ${numero} — Los Limones Creativos`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
            <div style="background: #0e1014; padding: 24px 32px; border-radius: 8px 8px 0 0;">
              <p style="color: #00e5ff; font-size: 22px; font-weight: bold; margin: 0;">Los Limones Creativos</p>
              <p style="color: #6b7281; font-size: 11px; margin: 4px 0 0; letter-spacing: 2px; text-transform: uppercase;">Trabajos en altura · Fachadas</p>
            </div>
            <div style="background: #f9fafb; padding: 28px 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
              <p style="font-size: 15px; margin: 0 0 12px;">Estimado/a ${nombreCliente ?? 'cliente'},</p>
              <p style="font-size: 14px; color: #374151; margin: 0 0 20px;">
                Adjuntamos el <strong>presupuesto N° ${numero}</strong> para su revisión.
              </p>
              <p style="font-size: 14px; color: #374151; margin: 0 0 28px;">
                Ante cualquier consulta no dude en contactarnos.
              </p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0 0 20px;" />
              <p style="font-size: 12px; color: #9ca3af; margin: 0;">
                Los Limones Creativos · Trabajos en altura y fachadas · Buenos Aires
              </p>
            </div>
          </div>
        `,
        attachments: [
          {
            filename: `presupuesto-${numero}.pdf`,
            content: pdfBase64,
          },
        ],
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      const mensaje = data?.message ?? data?.name ?? JSON.stringify(data)
      return new Response(JSON.stringify({ ok: false, error: mensaje }), {
        status: 200,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ ok: true, id: data.id }), {
      status: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
