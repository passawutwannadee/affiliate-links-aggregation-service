const mjml2html = require('mjml');
const transporter = require('../email');

const verificationEmail = async (username, token, userEmail) => {
  const mjmlContent = `
  <mjml>
  <mj-head>
    <mj-title>Email Verification</mj-title>
    <mj-preview>Email Verification</mj-preview>
    <mj-attributes>
      <mj-all font-family="'Helvetica Neue', Helvetica, Arial, sans-serif"></mj-all>
      <mj-text font-weight="400" font-size="16px" color="#000000" line-height="24px" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif"></mj-text>
    </mj-attributes>
    <mj-style inline="inline">
      .body-section {
      -webkit-box-shadow: 1px 4px 11px 0px rgba(0, 0, 0, 0.15);
      -moz-box-shadow: 1px 4px 11px 0px rgba(0, 0, 0, 0.15);
      box-shadow: 1px 4px 11px 0px rgba(0, 0, 0, 0.15);
      }
    </mj-style>
    <mj-style inline="inline">
      .text-link {
      color: #5e6ebf
      }
    </mj-style>
    <mj-style inline="inline">
      .footer-link {
      color: #888888
      }
    </mj-style>

  </mj-head>
  <mj-body background-color="#E7E7E7" width="600px">
     <mj-wrapper>
      <mj-wrapper padding-top="20px" padding-bottom="20px" background-color="#ffffff" css-class="body-section">
        <mj-section background-color="#ffffff" padding-left="15px" padding-right="15px">
          <mj-column width="100%">
            <mj-text color="#212b35" font-weight="bold" font-size="20px">
              Email Verification
            </mj-text>
            <mj-text color="#637381" font-size="16px">
              Hi ${username},
            </mj-text>
            <mj-text color="#637381" font-size="16px">
              To verify your email, click <a href="${process.env.SITE_URL}/verify-email/verify?token=${token}">here</a>
            </mj-text>
          </mj-column>
        </mj-section>
      </mj-wrapper>
    </mj-wrapper>
  </mj-body>
</mjml>
`;

  try {
    // Convert MJML to HTML
    const { html } = mjml2html(mjmlContent);

    // Email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: `Email Verification`,
      html: html,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:');
    console.log(info.response);
  } catch (error) {
    return res.status(500).json({
      message: 'An error occurred while sending the verification email',
    });
  }
};

module.exports = verificationEmail;
