import { escapeHtml } from "@/lib/signature/format";

export function installMail(opts: { firstName: string; hotelName: string; pageUrl: string }) {
  const name = escapeHtml(opts.firstName);
  const hotel = escapeHtml(opts.hotelName);
  const url = escapeHtml(opts.pageUrl);
  const subject = `${opts.hotelName} | Yeni e-posta imzan hazır / Your new email signature`;

  const html = `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0; padding:0; background:#f4f5f7;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:640px; margin:0 auto; font-family:Aptos,'Segoe UI',Arial,sans-serif; color:#333333;">
  <tr><td style="padding:32px 24px 8px 24px; font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#468D98;">Barceló Hotel Group Türkiye</td></tr>
  <tr><td style="padding:0 24px; font-size:22px; font-weight:700; line-height:30px;">Merhaba ${name}, yeni imzan hazır.</td></tr>
  <tr><td style="padding:12px 24px 0 24px; font-size:14px; line-height:22px; color:#4A4A4A;">
    ${hotel} için standart e-posta imzan oluşturuldu. Aşağıdaki bağlantıya tıkla, <strong>İmzayı Kopyala</strong> düğmesine bas ve Outlook imza ayarlarına yapıştır. İki dakika sürer.
  </td></tr>
  <tr><td style="padding:20px 24px;">
    <a href="${url}" style="display:inline-block; background:#1E4140; color:#ffffff; text-decoration:none; font-weight:700; font-size:14px; padding:12px 22px; border-radius:6px;">İmzamı aç / Open my signature</a>
  </td></tr>
  <tr><td style="padding:0 24px; font-size:13px; line-height:20px; color:#4A4A4A;">
    <strong>Outlook adımları:</strong> Ayarlar &gt; Hesaplar &gt; İmzalar &gt; Yeni imza &gt; Yapıştır (Ctrl+V) &gt; Yeni iletiler ve yanıtlar için varsayılan yap &gt; Kaydet.
  </td></tr>
  <tr><td style="padding:16px 24px 0 24px; font-size:13px; line-height:20px; color:#4A4A4A;">
    Ekli <em>.htm</em> dosyası aynı imzanın kopyasıdır; klasik Outlook kullananlar için yedek.
  </td></tr>
  <tr><td style="padding:24px 24px 0 24px; font-size:14px; line-height:22px; color:#4A4A4A; border-top:1px solid #e3e6ea; margin-top:16px;">
    <br>Hi ${name}, your ${hotel} email signature is ready. Open the link above, click <strong>Copy Signature</strong>, then paste it in Outlook &gt; Settings &gt; Accounts &gt; Signatures. The banner area updates automatically with our campaigns, so you only do this once.
  </td></tr>
  <tr><td style="padding:24px; font-size:12px; line-height:18px; color:#8C8E8F;">
    Bilgilerinde bir hata görürsen bu e-postayı yanıtla. Pazarlama / Marketing, Barceló Hotel Group Türkiye.
  </td></tr>
</table>
</body></html>`;

  const text = `Merhaba ${opts.firstName},

${opts.hotelName} için yeni e-posta imzan hazır. Bağlantıyı aç, "İmzayı Kopyala" düğmesine bas, Outlook > Ayarlar > Hesaplar > İmzalar bölümüne yapıştır ve varsayılan yap.

${opts.pageUrl}

Hi ${opts.firstName}, your ${opts.hotelName} email signature is ready. Open the link, click "Copy Signature", paste it in Outlook > Settings > Accounts > Signatures and set it as default. The banner updates automatically with our campaigns.

Pazarlama / Marketing, Barceló Hotel Group Türkiye`;

  return { subject, html, text };
}
