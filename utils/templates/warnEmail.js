const mjml2html = require('mjml');
const transporter = require('../email');

const warnEmail = async (
  type,
  totalWarn,
  warnReason,
  title,
  username,
  userEmail
) => {
  const mjmlContent = `
    <mjml>
    <mj-head>
      <mj-title>Warning Issued</mj-title>
      <mj-preview>Your ${type} has been removed</mj-preview>
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
                Your ${type} has been removed
              </mj-text>
              <mj-text color="#637381" font-size="16px">
                Hi ${username},
              </mj-text>
              <mj-text color="#637381" font-size="16px">
                We're notifying you that you have been issued a warning and your ${type} has been removed due to violation of Terms of Service. If you have been issued a warning for 3 times or more, your account will be suspended without the posibility of appeal.
              </mj-text>
              <mj-text color="#637381" font-size="16px">
                  <p style="padding-bottom: 20px"><strong>Total warns:</strong><span> ${totalWarn}</span></p>
                  <p style="padding-bottom: 20px"><strong>Reason:</strong> ${warnReason}</p>
                  <p style="padding-bottom: 20px"><strong>Item:</strong> ${title}</p>
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
      subject: `Your product has been removed`,
      html: html,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:');
    console.log(info.response);
  } catch (error) {
    console.log('Error occurred:');
    console.log(error.message);
  }

  // // Convert MJML to HTML
  // mjml2html(mjmlContent, { minify: true })
  //   .then(({ html }) => {
  //     const mailOptions = {
  //       from: process.env.EMAIL_USER,
  //       to: userEmail,
  //       subject: `Your ${type} has been removed`,
  //       html: html,
  //     };

  //     // Send email
  //     transporter.sendMail(mailOptions, (error, info) => {
  //       if (error) {
  //         console.log('Error occurred:');
  //         console.log(error.message);
  //       } else {
  //         console.log('Email sent:');
  //         console.log(info.response);
  //       }
  //     });
  //   })
  //   .catch((error) => {
  //     console.log('MJML conversion error:');
  //     console.log(error);
  //   });
};

module.exports = warnEmail;
