"""
Be-Free — Professional HTML Email Templates
All CSS is intentionally inlined for maximum compatibility with email clients
(Gmail, Outlook, Apple Mail, mobile, etc.)
"""
from datetime import datetime


# ── Brand colours ──────────────────────────────────────────────────────────────
PRIMARY   = "#6366F1"   # Indigo
PRIMARY_D = "#4F46E5"   # Indigo dark (hover)
ACCENT    = "#8B5CF6"   # Violet
BG        = "#F8FAFC"   # Light grey background
CARD_BG   = "#FFFFFF"
TEXT_MAIN = "#1E293B"   # Slate 800
TEXT_SEC  = "#64748B"   # Slate 500
TEXT_MUTED= "#94A3B8"   # Slate 400
BORDER    = "#E2E8F0"   # Slate 200
SUCCESS   = "#10B981"   # Emerald


def _base_template(content: str, preview_text: str = "") -> str:
    """Wrap content in the Be-Free branded base email layout."""
    year = datetime.now().year
    return f"""<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Be-Free E-commerce</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    body {{ margin:0; padding:0; background:{BG}; font-family:'Inter',Arial,sans-serif; -webkit-text-size-adjust:100%; }}
    img {{ border:0; display:block; }}
    a {{ color:{PRIMARY}; text-decoration:none; }}
    @media only screen and (max-width:600px) {{
      .email-wrapper {{ padding:16px !important; }}
      .email-card {{ padding:28px 20px !important; border-radius:16px !important; }}
      .hero-section {{ padding:28px 20px !important; border-radius:16px 16px 0 0 !important; }}
      .btn-cta {{ display:block !important; text-align:center !important; }}
      .message-bubble {{ padding:16px !important; }}
      .meta-row {{ flex-direction:column !important; gap:6px !important; }}
    }}
  </style>
</head>
<body style="margin:0;padding:0;background:{BG};font-family:'Inter',Arial,sans-serif;">

  <!-- Preview text (hidden) -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">{preview_text}&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;</div>

  <!-- Email wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:{BG};padding:40px 0;">
    <tr>
      <td align="center" class="email-wrapper" style="padding:0 16px;">
        <table role="presentation" width="100%" style="max-width:600px;" cellpadding="0" cellspacing="0">

          <!-- Logo / Header -->
          <tr>
            <td align="center" style="padding:0 0 24px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,{PRIMARY} 0%,{ACCENT} 100%);border-radius:16px;padding:14px 28px;display:inline-block;">
                    <span style="color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.5px;">Be-Free</span>
                    <span style="color:rgba(255,255,255,0.65);font-size:14px;font-weight:500;margin-left:6px;">E-commerce</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td style="background:{CARD_BG};border-radius:24px;box-shadow:0 4px 24px rgba(0,0,0,0.07);overflow:hidden;">
              {content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 0 8px 0;text-align:center;">
              <p style="margin:0 0 8px 0;font-size:13px;color:{TEXT_MUTED};">
                Be-Free E-commerce · Plateforme de formation
              </p>
              <p style="margin:0;font-size:12px;color:{TEXT_MUTED};">
                Cet e-mail a été envoyé automatiquement. Merci de ne pas y répondre directement.<br/>
                © {year} Be-Free. Tous droits réservés.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>"""


def _avatar_initials(name: str) -> str:
    """Return up to 2 initials from a name."""
    parts = name.strip().split()
    if len(parts) >= 2:
        return (parts[0][0] + parts[-1][0]).upper()
    return name[:2].upper() if name else "?"


def new_message_email(
    receiver_first_name: str,
    sender_name: str,
    sender_role: str,        # "Étudiant" | "Formateur" | "Admin"
    subject: str,
    body: str,
    platform_url: str = "http://localhost:5173",
) -> tuple[str, str]:
    """
    Returns (subject_line, html_body) for a new-message notification email.
    """
    initials    = _avatar_initials(sender_name)
    preview     = f"{sender_name} vous a envoyé un message : {subject}"
    short_body  = body[:320] + ("…" if len(body) > 320 else "")
    subject_line = f"💬 Nouveau message de {sender_name}"
    messages_url = f"{platform_url}/messages"

    content = f"""
      <!-- Hero gradient strip -->
      <div class="hero-section" style="
          background:linear-gradient(135deg,{PRIMARY} 0%,{ACCENT} 100%);
          padding:40px 40px;
          border-radius:24px 24px 0 0;
          text-align:center;
      ">
        <div style="
            width:64px;height:64px;background:rgba(255,255,255,0.2);
            border-radius:20px;margin:0 auto 20px auto;
            display:flex;align-items:center;justify-content:center;
            font-size:32px;line-height:64px;
        ">
          💬
        </div>
        <h1 style="margin:0 0 12px 0;font-size:28px;font-weight:800;color:#fff;line-height:1.2;letter-spacing:-0.5px;">
          Nouveau message
        </h1>
        <p style="margin:0;font-size:16px;color:rgba(255,255,255,0.85);font-weight:500;">
          Vous avez reçu un message de {sender_name}
        </p>
      </div>

      <!-- Card body -->
      <div class="email-card" style="padding:40px;">

        <!-- Greeting -->
        <p style="margin:0 0 28px 0;font-size:17px;color:{TEXT_MAIN};line-height:1.6;">
          Bonjour <strong>{receiver_first_name}</strong>,
        </p>

        <!-- Sender info -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px;">
          <tr>
            <td style="width:52px;vertical-align:top;">
              <div style="
                  width:48px;height:48px;border-radius:16px;
                  background:linear-gradient(135deg,{PRIMARY} 0%,{ACCENT} 100%);
                  display:flex;align-items:center;justify-content:center;
                  font-size:18px;font-weight:800;color:#fff;
                  text-align:center;line-height:48px;
                  box-shadow:0 4px 12px rgba(99,102,241,0.2);
              ">{initials}</div>
            </td>
            <td style="padding-left:16px;vertical-align:middle;">
              <p style="margin:0 0 4px 0;font-size:17px;font-weight:800;color:{TEXT_MAIN};letter-spacing:-0.3px;">{sender_name}</p>
              <p style="margin:0;font-size:14px;font-weight:500;color:{TEXT_SEC};">{sender_role} · Be-Free</p>
            </td>
          </tr>
        </table>

        <!-- Subject pill -->
        <div style="
            display:inline-block;
            background:{BG};
            border:1px solid {BORDER};
            color:{TEXT_MAIN};
            font-size:14px;font-weight:700;
            padding:8px 16px;border-radius:8px;
            margin-bottom:20px;
        ">
          <span style="color:{PRIMARY};margin-right:6px;">Sujet :</span> {subject}
        </div>

        <!-- Message bubble -->
        <div class="message-bubble" style="
            background:rgba(99,102,241,0.04);
            border:1px solid rgba(99,102,241,0.15);
            border-left:4px solid {PRIMARY};
            border-radius:16px;
            padding:24px 28px;
            margin-bottom:32px;
        ">
          <p style="margin:0;font-size:16px;color:{TEXT_MAIN};line-height:1.75;white-space:pre-line;">{short_body}</p>
        </div>

        <!-- Divider -->
        <hr style="border:none;border-top:1px solid {BORDER};margin:0 0 24px 0;" />

        <!-- Info note -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:{BG};padding:16px 20px;border-radius:12px;border:1px dashed {BORDER};">
          <tr>
            <td style="width:24px;vertical-align:top;padding-top:2px;">
              <span style="font-size:18px;">✉️</span>
            </td>
            <td style="padding-left:12px;">
              <p style="margin:0 0 4px 0;font-size:14px;font-weight:700;color:{TEXT_MAIN};">
                Répondez directement à cet e-mail
              </p>
              <p style="margin:0;font-size:13px;color:{TEXT_SEC};line-height:1.5;">
                Pour répondre à <strong>{sender_name}</strong>, il vous suffit de cliquer sur "Répondre" dans votre boîte mail. Votre réponse lui sera envoyée directement.
              </p>
            </td>
          </tr>
        </table>

      </div>
    """

    return subject_line, _base_template(content, preview)


def payment_confirmation_email(
    receiver_first_name: str,
    amount: float,
    method: str,
    reference: str,
    paid_total: float,
    total_due: float,
    platform_url: str = "http://localhost:5173",
) -> tuple[str, str]:
    """
    Returns (subject_line, html_body) for a payment confirmation email.
    """
    remaining   = max(0.0, total_due - paid_total)
    percent     = min(100, round((paid_total / total_due) * 100)) if total_due else 0
    preview     = f"Votre paiement de {amount:,.0f} € a bien été enregistré."
    subject_line = f"✅ Paiement confirmé — {amount:,.0f} €"

    bar_width = f"{percent}%"
    bar_color = SUCCESS if percent >= 100 else PRIMARY

    content = f"""
      <!-- Hero -->
      <div class="hero-section" style="
          background:linear-gradient(135deg,{SUCCESS} 0%,#059669 100%);
          padding:36px 40px;
          border-radius:24px 24px 0 0;
      ">
        <p style="margin:0 0 12px 0;font-size:32px;line-height:1;">✅</p>
        <h1 style="margin:0 0 8px 0;font-size:26px;font-weight:800;color:#fff;line-height:1.2;">
          Paiement confirmé !
        </h1>
        <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.8);">
          Votre règlement a bien été enregistré sur la plateforme.
        </p>
      </div>

      <!-- Body -->
      <div class="email-card" style="padding:36px 40px;">

        <p style="margin:0 0 24px 0;font-size:16px;color:{TEXT_MAIN};line-height:1.6;">
          Bonjour <strong>{receiver_first_name}</strong>,
        </p>

        <!-- Amount block -->
        <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:16px;padding:24px;margin-bottom:24px;text-align:center;">
          <p style="margin:0 0 4px 0;font-size:13px;font-weight:600;color:#16A34A;text-transform:uppercase;letter-spacing:1px;">Montant réglé</p>
          <p style="margin:0;font-size:40px;font-weight:800;color:#15803D;line-height:1.1;">{amount:,.0f} <span style="font-size:22px;">€</span></p>
          <p style="margin:6px 0 0 0;font-size:13px;color:#4ADE80;">via {method}</p>
        </div>

        <!-- Details table -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border:1px solid {BORDER};border-radius:12px;overflow:hidden;">
          <tr style="background:{BG};">
            <td style="padding:12px 18px;font-size:13px;color:{TEXT_SEC};font-weight:600;border-bottom:1px solid {BORDER};">Référence</td>
            <td style="padding:12px 18px;font-size:13px;color:{TEXT_MAIN};font-weight:700;border-bottom:1px solid {BORDER};text-align:right;">{reference}</td>
          </tr>
          <tr>
            <td style="padding:12px 18px;font-size:13px;color:{TEXT_SEC};font-weight:600;border-bottom:1px solid {BORDER};">Total payé</td>
            <td style="padding:12px 18px;font-size:13px;color:{TEXT_MAIN};font-weight:700;border-bottom:1px solid {BORDER};text-align:right;">{paid_total:,.0f} €</td>
          </tr>
          <tr style="background:{BG};">
            <td style="padding:12px 18px;font-size:13px;color:{TEXT_SEC};font-weight:600;">Reste à payer</td>
            <td style="padding:12px 18px;font-size:13px;color:{'#15803D' if remaining == 0 else TEXT_MAIN};font-weight:700;text-align:right;">{'✅ Soldé' if remaining == 0 else f'{remaining:,.0f} €'}</td>
          </tr>
        </table>

        <!-- Progress bar -->
        <p style="margin:0 0 8px 0;font-size:13px;font-weight:600;color:{TEXT_SEC};">Progression du paiement</p>
        <div style="background:{BORDER};border-radius:999px;height:12px;overflow:hidden;margin-bottom:6px;">
          <div style="background:linear-gradient(90deg,{bar_color},{'#34D399' if percent >= 100 else ACCENT});height:12px;border-radius:999px;width:{bar_width};transition:width .5s;"></div>
        </div>
        <p style="margin:0 0 28px 0;font-size:13px;color:{TEXT_SEC};text-align:right;">{percent}% réglé</p>

        <!-- CTA -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
          <tr>
            <td align="center">
              <a href="{platform_url}/payments" style="
                  display:inline-block;
                  background:linear-gradient(135deg,{PRIMARY} 0%,{ACCENT} 100%);
                  color:#fff;font-size:15px;font-weight:700;
                  padding:14px 40px;border-radius:12px;text-decoration:none;
                  box-shadow:0 4px 16px rgba(99,102,241,0.3);
              ">Voir mon historique de paiements →</a>
            </td>
          </tr>
        </table>

        <hr style="border:none;border-top:1px solid {BORDER};margin:0 0 20px 0;" />
        <p style="margin:0;font-size:13px;color:{TEXT_SEC};line-height:1.6;text-align:center;">
          En cas de question, contactez votre formateur ou l'équipe Be-Free.
        </p>

      </div>
    """

    return subject_line, _base_template(content, preview)


def welcome_account_email(
    receiver_first_name: str,
    username: str,
    password: str = "Befree2026",
    platform_url: str = "http://localhost:5173",
) -> tuple[str, str]:
    """
    Returns (subject_line, html_body) for a welcome email with credentials.
    """
    preview = f"Bienvenue {receiver_first_name} ! Vos accès à la plateforme Be-Free."
    subject_line = "🚀 Bienvenue chez Be-Free — Vos accès"

    content = f"""
      <!-- Hero -->
      <div class="hero-section" style="
          background:linear-gradient(135deg,{PRIMARY} 0%,{ACCENT} 100%);
          padding:40px 40px;
          border-radius:24px 24px 0 0;
          text-align:center;
      ">
        <p style="margin:0 0 12px 0;font-size:32px;line-height:1;">🚀</p>
        <h1 style="margin:0 0 8px 0;font-size:26px;font-weight:800;color:#fff;line-height:1.2;">
          Bienvenue chez Be-Free !
        </h1>
        <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.85);">
          Votre inscription est confirmée. Prêt à lancer votre business ?
        </p>
      </div>

      <!-- Body -->
      <div class="email-card" style="padding:40px;">

        <p style="margin:0 0 24px 0;font-size:17px;color:{TEXT_MAIN};line-height:1.6;">
          Bonjour <strong>{receiver_first_name}</strong>,
        </p>

        <p style="margin:0 0 24px 0;font-size:16px;color:{TEXT_SEC};line-height:1.6;">
          Nous sommes ravis de vous compter parmi nos membres. Voici vos identifiants pour vous connecter à votre espace personnel :
        </p>

        <!-- Credentials card -->
        <div style="background:{BG};border:1px solid {BORDER};border-radius:16px;padding:24px;margin-bottom:32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-bottom:16px;">
                <p style="margin:0 0 4px 0;font-size:13px;font-weight:600;color:{TEXT_SEC};text-transform:uppercase;">Nom d'utilisateur</p>
                <p style="margin:0;font-size:18px;font-weight:700;color:{PRIMARY};">{username}</p>
              </td>
            </tr>
            <tr>
              <td>
                <p style="margin:0 0 4px 0;font-size:13px;font-weight:600;color:{TEXT_SEC};text-transform:uppercase;">Mot de passe temporaire</p>
                <p style="margin:0;font-size:18px;font-weight:700;color:{TEXT_MAIN};">{password}</p>
              </td>
            </tr>
          </table>
        </div>

        <!-- CTA -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:32px;">
          <tr>
            <td align="center">
              <a href="{platform_url}/login" style="
                  display:inline-block;
                  background:linear-gradient(135deg,{PRIMARY} 0%,{ACCENT} 100%);
                  color:#fff;font-size:16px;font-weight:700;
                  padding:16px 48px;border-radius:12px;text-decoration:none;
                  box-shadow:0 8px 20px rgba(99,102,241,0.3);
              ">Se connecter à mon espace →</a>
            </td>
          </tr>
        </table>

        <div style="background:rgba(99,102,241,0.04);border-radius:12px;padding:20px;border:1px dashed {PRIMARY};">
           <p style="margin:0;font-size:14px;color:{TEXT_SEC};line-height:1.5;">
             <strong>Conseil :</strong> Pour plus de sécurité, nous vous recommandons de modifier votre mot de passe dès votre première connexion dans les réglages de votre profil.
           </p>
        </div>

        <hr style="border:none;border-top:1px solid {BORDER};margin:32px 0 24px 0;" />
        <p style="margin:0;font-size:13px;color:{TEXT_MUTED};text-align:center;">
          À bientôt,<br/>
          L'équipe Be-Free
        </p>

      </div>
    """

    return subject_line, _base_template(content, preview)


def step_completed_email(
    receiver_first_name: str,
    step_label: str,
    platform_url: str = "http://localhost:5173",
) -> tuple[str, str]:
    """
    Returns (subject_line, html_body) for a step completion notification.
    """
    preview = f"Félicitations {receiver_first_name} ! Vous avez validé l'étape : {step_label}."
    subject_line = f"🎉 Étape validée : {step_label}"

    content = f"""
      <!-- Hero -->
      <div class="hero-section" style="
          background:linear-gradient(135deg,{SUCCESS} 0%,{PRIMARY} 100%);
          padding:40px 40px;
          border-radius:24px 24px 0 0;
          text-align:center;
      ">
        <p style="margin:0 0 12px 0;font-size:32px;line-height:1;">✨</p>
        <h1 style="margin:0 0 8px 0;font-size:26px;font-weight:800;color:#fff;line-height:1.2;">
          Bravo, {receiver_first_name} !
        </h1>
        <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.85);">
          Vous venez de franchir une nouvelle étape importante.
        </p>
      </div>

      <!-- Body -->
      <div class="email-card" style="padding:40px;">
        <p style="margin:0 0 24px 0;font-size:17px;color:{TEXT_MAIN};line-height:1.6;">
          C'est une excellente nouvelle !
        </p>

        <p style="margin:0 0 24px 0;font-size:16px;color:{TEXT_SEC};line-height:1.6;">
          Votre formateur a validé l'étape suivante de votre accompagnement :
        </p>

        <!-- Step card -->
        <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:16px;padding:24px;margin-bottom:32px;text-align:center;">
          <p style="margin:0 0 4px 0;font-size:12px;font-weight:700;color:#16A34A;text-transform:uppercase;letter-spacing:1px;">Statut Actuel</p>
          <p style="margin:0;font-size:24px;font-weight:800;color:#15803D;">✅ {step_label}</p>
        </div>

        <p style="margin:0 0 32px 0;font-size:16px;color:{TEXT_SEC};line-height:1.6;">
          Continuez sur cette lancée ! Vous pouvez dès à présent consulter la suite de votre roadmap et les prochaines actions à mener sur votre tableau de bord.
        </p>

        <!-- CTA -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:32px;">
          <tr>
            <td align="center">
              <a href="{platform_url}/dashboard" style="
                  display:inline-block;
                  background:linear-gradient(135deg,{PRIMARY} 0%,{ACCENT} 100%);
                  color:#fff;font-size:16px;font-weight:700;
                  padding:16px 48px;border-radius:12px;text-decoration:none;
                  box-shadow:0 8px 20px rgba(99,102,241,0.3);
              ">Voir ma progression →</a>
            </td>
          </tr>
        </table>

        <hr style="border:none;border-top:1px solid {BORDER};margin:32px 0 24px 0;" />
        <p style="margin:0;font-size:13px;color:{TEXT_MUTED};text-align:center;">
          À très vite pour la suite de votre succès,<br/>
          L'équipe Be-Free
        </p>
      </div>
    """

    return subject_line, _base_template(content, preview)
