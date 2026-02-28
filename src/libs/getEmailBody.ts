export const getEmailBody = (
  inviterName: string,
  groupName: string,
  groupId: string,
) => {
  //    console.log(initials("shyam sharma")); // SS
  const initials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation</title>
</head>
<body style="margin:0; padding:0; background:#f3f4f6; font-family:Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f4f6; padding:20px 0;">
    <tr>
      <td align="center">

        <!-- Main Container -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:672px; background:#ffffff;">
          <tr>
            <td style="padding:32px;">

              <!-- Logo -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom:32px;">
                    <img src="https://ik.imagekit.io/4s9mwjzck/Group%205.png" alt="Just DM" height="48" style="display:block;">
                  </td>
                </tr>
              </table>

              <!-- Card -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e5e7eb; border-radius:12px;">
                
                <!-- Top Bar -->
                <tr>
                  <td style="height:6px; background:#3b82f6; font-size:0; line-height:0;">&nbsp;</td>
                </tr>

                <tr>
                  <td align="center" style="padding:24px;">

                    <!-- Avatar -->
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center"
                          style="width:96px; height:96px; background:#3b82f6; color:#ffffff;
                          font-size:32px; font-weight:600; border-radius:50%;
                          text-align:center; line-height:96px;">
                          ${initials(inviterName)}
                        </td>
                      </tr>
                    </table>

                    <!-- Title -->
                    <div style="font-size:22px; font-weight:600; color:#111827; margin:20px 0 10px;">
                      ${inviterName} invited you to join
                    </div>

                    <!-- Group Pill -->
                    <table cellpadding="0" cellspacing="0" border="0" style="margin:10px auto 20px;">
                      <tr>
                        <td style="background:#eff6ff; border:1px solid #bfdbfe; padding:10px 18px; border-radius:999px;">
                          <span style="color:#1d4ed8; font-weight:600; font-size:16px;">
                            ● ${groupName}
                          </span>
                        </td>
                      </tr>
                    </table>

                    <!-- Description -->
                    <div style="color:#4b5563; font-size:14px; line-height:1.6; max-width:420px; margin:0 auto 24px;">
                      You've been invited to join the Tech group. Accept this invitation to start messaging and collaborating with the team.
                    </div>

                    <!-- Button -->
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center">
                          <a href="http://localhost:3000/invite/${groupId}"
                            target="_blank"
                            style="background:#3b82f6; color:#ffffff; text-decoration:none;
                            padding:14px 36px; border-radius:10px; font-weight:600;
                            display:inline-block;">
                            Join Group
                          </a>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

              <!-- Security Notice -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;">
                <tr>
                  <td style="background:#fffbeb; border:1px solid #fde68a; border-radius:10px; padding:16px;">
                    <div style="font-size:14px; font-weight:600; color:#92400e; margin-bottom:4px;">
                      ⚠️ Security Notice
                    </div>
                    <div style="font-size:12px; color:#78350f; line-height:1.5;">
                      Only accept invitations from people you know and trust. If you don't recognize the sender, you can safely ignore this message.
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Footer -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;">
                <tr>
                  <td align="center" style="border-top:1px solid #e5e7eb; padding-top:20px; font-size:12px; color:#9ca3af;">
                    © 2026 Just DM
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>
    `;
};
