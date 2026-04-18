const FROM = 'AMS Derive <noreply@amsderive.in>';

function esc(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function shell(content) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>AMS Derive 2026</title></head><body style="margin:0;padding:0;background:#0a0a0a;font-family:Georgia,'Times New Roman',serif;"><table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#0a0a0a;padding:40px 16px;"><tr><td align="center"><table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;background:#111111;border:1px solid rgba(212,175,55,0.2);border-radius:2px;"><tr><td style="padding:24px 36px 20px;border-bottom:1px solid rgba(212,175,55,0.12);"><img src="https://amsderive.in/AMS_DERIVE_TEXT.svg" alt="AMS DERIVE" width="180" style="display:block;width:180px;height:auto;border:0;" /><p style="margin:6px 0 0;font-family:'Courier New',monospace;font-size:10px;color:#6b6560;letter-spacing:2px;text-transform:uppercase;">2026</p></td></tr><tr><td style="padding:32px 36px;">${content}</td></tr><tr><td style="padding:16px 36px;border-top:1px solid rgba(212,175,55,0.1);"><p style="margin:0;font-family:'Courier New',monospace;font-size:10px;color:#333333;letter-spacing:1px;text-transform:uppercase;">AMS Derive 2026 &middot; Algorithms &amp; Mathematics Society &middot; India</p><p style="margin:6px 0 0;font-family:'Courier New',monospace;font-size:10px;color:#2a2a2a;">This is an automated message. Please do not reply.</p></td></tr></table></td></tr></table></body></html>`;
}

export function registrationConfirmationEmail({ fullName, codeforcesHandle, university }) {
  const name = esc(fullName || 'there');
  const handle = esc(codeforcesHandle || '—');
  const uni = esc(university || '—');

  const content = `<h1 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#f0ede6;font-family:Georgia,serif;">Registration Confirmed</h1><p style="margin:0 0 16px;font-size:15px;color:#c8c4bc;line-height:1.7;font-family:Georgia,serif;">Hi ${name},</p><p style="margin:0 0 24px;font-size:15px;color:#c8c4bc;line-height:1.7;font-family:Georgia,serif;">Your registration for <strong style="color:#f0ede6;">AMS Derive 2026</strong> has been received. Our team will review all submissions and notify you of the outcome via email.</p><table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#0a0a0a;border:1px solid rgba(212,175,55,0.15);border-radius:2px;margin-bottom:24px;"><tr><td style="padding:16px 20px;"><p style="margin:0 0 10px;font-family:'Courier New',monospace;font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#6b6560;">Your Details</p><p style="margin:0 0 7px;font-family:'Courier New',monospace;font-size:13px;color:#f0ede6;"><span style="color:#6b6560;">CF Handle&nbsp;&nbsp;</span>${handle}</p><p style="margin:0;font-family:'Courier New',monospace;font-size:13px;color:#f0ede6;"><span style="color:#6b6560;">University&nbsp;</span>${uni}</p></td></tr></table><p style="margin:0;font-size:13px;color:#6b6560;line-height:1.6;font-family:Georgia,serif;">Results will be communicated after the registration window closes. Keep an eye on your inbox.</p>`;

  return {
    from: FROM,
    subject: 'Your AMS Derive 2026 registration is confirmed',
    html: shell(content),
  };
}

export function statusUpdateEmail({ fullName, status }) {
  const name = esc(fullName || 'there');
  const isApproved = status === 'approved';

  const content = isApproved
    ? `<h1 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#f0ede6;font-family:Georgia,serif;">Congratulations, ${name}.</h1><p style="margin:0 0 24px;font-family:'Courier New',monospace;font-size:11px;color:#22c55e;letter-spacing:2px;text-transform:uppercase;">&#10003; Successfully Approved</p><p style="margin:0 0 24px;font-size:15px;color:#c8c4bc;line-height:1.7;font-family:Georgia,serif;">You&rsquo;ve been successfully approved for <strong style="color:#f0ede6;">AMS Derive 2026</strong> registration. You are now a confirmed participant in one of India&rsquo;s most rigorous mathematics competitions.</p><p style="margin:0 0 12px;font-family:'Courier New',monospace;font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#6b6560;">Competition Timeline</p><table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#0a0a0a;border:1px solid rgba(212,175,55,0.15);border-radius:2px;margin-bottom:8px;"><tr><td style="padding:16px 20px;border-bottom:1px solid rgba(212,175,55,0.08);"><p style="margin:0 0 5px;font-family:'Courier New',monospace;font-size:11px;color:#D4AF37;letter-spacing:1px;text-transform:uppercase;">Round 1 &mdash; PRIOR</p><p style="margin:0 0 3px;font-family:'Courier New',monospace;font-size:13px;color:#f0ede6;">23 May 2026 &nbsp;&middot;&nbsp; 2:00 PM &ndash; 5:00 PM IST</p><p style="margin:0;font-family:'Courier New',monospace;font-size:11px;color:#6b6560;">Online &middot; Codeforces</p></td></tr><tr><td style="padding:14px 20px;"><p style="margin:0 0 5px;font-family:'Courier New',monospace;font-size:11px;color:#444;letter-spacing:1px;text-transform:uppercase;">Further Rounds &mdash; POSTERIOR &middot; CONVERGENCE</p><p style="margin:0;font-family:'Courier New',monospace;font-size:11px;color:#3a3a3a;">Dates to be announced</p></td></tr></table><p style="margin:0 0 20px;font-size:13px;color:#6b6560;line-height:1.6;font-family:Georgia,serif;">Contest links, guidelines, and updates will be shared in the community. Join now to stay in the loop.</p><table cellpadding="0" cellspacing="0" role="presentation"><tr><td style="border-radius:4px;background:#25D366;"><a href="https://chat.whatsapp.com/D3OxCs0L1V8IodpRVzG6cw" target="_blank" style="display:inline-block;padding:13px 28px;font-family:'Courier New',monospace;font-size:12px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:1px;text-transform:uppercase;">&#x1F4AC; Join WhatsApp Community</a></td></tr></table>`
    : `<h1 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#f0ede6;font-family:Georgia,serif;">A Note on Your Application</h1><p style="margin:0 0 16px;font-size:15px;color:#c8c4bc;line-height:1.7;font-family:Georgia,serif;">Dear ${name},</p><p style="margin:0 0 24px;font-size:15px;color:#c8c4bc;line-height:1.7;font-family:Georgia,serif;">Thank you for your interest in <strong style="color:#f0ede6;">AMS Derive 2026</strong>. After a thorough review of all submissions, we regret to inform you that we are unable to extend an invitation to you for this edition of the competition.</p><p style="margin:0;font-size:13px;color:#6b6560;line-height:1.6;font-family:Georgia,serif;">We genuinely appreciate the effort you put into your application and encourage you to stay engaged with the AMS community for future opportunities.</p>`;

  return {
    from: FROM,
    subject: isApproved ? 'Your registration for AMS Derive 2026 has been approved' : 'Regarding your AMS Derive 2026 application',
    html: shell(content),
  };
}

export function broadcastEmail({ subject, body }) {
  const safeBody = (body || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');

  const content = `<div style="font-size:15px;color:#c8c4bc;line-height:1.8;font-family:Georgia,serif;">${safeBody}</div>`;

  return {
    from: FROM,
    subject: subject || 'Message from AMS Derive',
    html: shell(content),
  };
}
