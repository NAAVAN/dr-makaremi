import type { CommerceOrder, CommerceWithdrawalRequest } from '@makaremi/shared';
import { formatEur } from './rules';

export function isTransactionalEmailConfigured(): boolean {
  return Boolean((process.env.RESEND_API_KEY || '').trim());
}

async function sendResendEmail(payload: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const apiKey = (process.env.RESEND_API_KEY || '').trim();
  if (!apiKey) return false;

  const from = (process.env.COMMERCE_FROM_EMAIL || 'Atelier Dr Hassan Makaremi <orders@makaremi.com>').trim();
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function sendWithdrawalTimestampedReceiptEmail(
  record: CommerceWithdrawalRequest
): Promise<boolean> {
  const html = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1c1917;">
      <h2>Accusé de réception horodaté — Demande de rétractation</h2>
      <p>Conformément aux articles L.221-21 et D.221-5 du Code de la consommation (Décret n° 2026-3), nous confirmons l'enregistrement de votre demande de rétractation :</p>
      <ul>
        <li><strong>Référence :</strong> ${record.referenceCode}</li>
        <li><strong>Numéro de commande :</strong> ${record.orderNumber}</li>
        <li><strong>Client :</strong> ${record.customerFullName}</li>
        <li><strong>Date et heure exactes (UTC) :</strong> ${record.confirmedAt}</li>
      </ul>
      <p>${record.legalBasisNoteFr}</p>
      <p style="font-size: 12px; color: #57534e;">Atelier & Éditions Dr Hassan Makaremi — Paris, France — contact@makaremi.com</p>
    </div>
  `;

  return sendResendEmail({
    to: record.customerEmail,
    subject: `[${record.referenceCode}] Accusé de réception horodaté — Rétractation commande ${record.orderNumber}`,
    html,
  });
}

export async function sendOrderConfirmationEmail(order: CommerceOrder): Promise<boolean> {
  const totalFormatted = formatEur(order.quote.totalCents, 'fr');
  const html = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1c1917;">
      <h2>Confirmation de commande — ${order.orderNumber}</h2>
      <p>Bonjour ${order.customer.fullName},</p>
      <p>Nous vous confirmons l'enregistrement de votre commande auprès de l'Atelier & Éditions Dr Hassan Makaremi (Paris).</p>
      <ul>
        <li><strong>Commande :</strong> ${order.orderNumber}</li>
        <li><strong>Facture :</strong> ${order.invoiceNumber}</li>
        <li><strong>Montant total TTC :</strong> ${totalFormatted}</li>
        <li><strong>Mention fiscale :</strong> ${order.quote.taxNoticeFr}</li>
      </ul>
      <p>Pour exercer votre droit légal de rétractation (14 jours pour les biens physiques éligibles), vous disposez du bouton dédié sur : https://makaremi.com/fr/legal/retractation</p>
    </div>
  `;

  return sendResendEmail({
    to: order.customer.email,
    subject: `[${order.orderNumber}] Confirmation & Facture ${order.invoiceNumber} — Dr Hassan Makaremi`,
    html,
  });
}
