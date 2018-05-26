import { Route } from '../route';
import * as svg_captcha from 'svg-captcha';


export class CaptchaRoute extends Route{

  static get SHOW_CAPTCHA_LEVEL() {
    return 3;
  }

  get email(): string {
    let email = this.req.body.email || '';
    return email;
  }

  get today(): string {
    return (new Date()).toISOString().substr(0, 10);
  }

  launch() {
    this.app.db
      .collection('users')
      .findOne({ email: this.email })
      .then(
        user => {
          if(user) {
            user.wrong_login = user.wrong_login || {};
            if (!user.wrong_login[this.today]) {
              user.wrong_login[this.today] = 0;
            }
            if (user.wrong_login[this.today] >= CaptchaRoute.SHOW_CAPTCHA_LEVEL) {
              let captcha = svg_captcha.create();
              return this.app.db
                .collection('users')
                .update(
                  { email: this.email }, 
                  { "$set": { captcha_text: captcha.text} }
                )
                .then(res => captcha);
            }
          }
          return { data: 0 };
        }
      )
      .then(captcha => this.res.status(200).json(captcha.data))
      .catch(
        err => {
          console.error(err);
          this.res.status(412).json({
            message: err.message,
            stack: err.stack
          });
        }
      );
  }
}