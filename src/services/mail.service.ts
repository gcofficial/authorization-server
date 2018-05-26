import * as mandrill  from 'node-mandrill';

export class MailService{
  public static mail(to, subject, html = ''): Promise<any> {
    let sendmail = mandrill('RsJS8MyARJ24qa0l47XlEg');

    return new Promise(
      (resolve, reject) => {
        var message = {
          "html": html,
          "subject": subject,
          "from_email": "gurievcreative@gmail.com",
          "from_name": "Testing",
          "to": [{ email: to }],
          "headers": {
            "Reply-To": "gurievcreative@gmail.com"
          },
          "track_opens": true,
          "track_clicks": true,
        };

        sendmail(
          '/messages/send',
          {"message": message, "async": false},
          (err, response) => {
            if (err) {
              return resolve(err)
            }
            return resolve(response);
          });
      }
    );
  }
}