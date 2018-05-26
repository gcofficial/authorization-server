import { RoutesService } from '../../services/routes.service';
import { Route } from '../route';
import { EErrors } from '../../enums/eerrors.enum';
import { EMagic } from '../../enums/emagic.enum';
import { ILoginData } from '../../interfaces/ilogin-data';
import { CaptchaRoute } from './captcha.route';
import emailValidation from '../../utils/email-validation.util';
import * as util from 'util';
import * as md5 from 'md5';
import * as svg_captcha from 'svg-captcha';

export class LoginRoute extends Route{

  static get MAX_WRONG_LOGIN() {
    return 10;
  }

  get email(): string {
    let email = this.req.body.email || '';
    email = email.trim();
    if (email == '') {
      throw new Error(util.format(EErrors.cant_be_empty, 'Email'));
    }
    if (!emailValidation(email)) {
      throw new Error(EErrors.invalid_email);
    }
    return email;
  }

  get password(): string {
    let pswd = this.req.body.password || '';
    if (pswd == '') {
      throw new Error(util.format(EErrors.cant_be_empty, 'Password'));
    }
    return md5(md5(pswd) + EMagic.password);
  }

  get image_verify(): string {
    return (this.req.body.image_verify || '').trim();
  }

  get today(): string {
    return (new Date()).toISOString().substr(0, 10);
  }

  check(data: ILoginData) {
    return this.app.db
      .collection('users')
      .findOne({
        email: data.email
      })
      .then(
        user => {
          let wrong_login, wrong_login_today;
          if (user == null) {
            throw new Error(EErrors.incorrect_log_or_ps);
          }
          if (user.activation_key) {
            throw new Error(EErrors.please_activate_your_acc);
          }
          wrong_login = user.wrong_login || {};
          wrong_login_today = wrong_login[ this.today ] || 0;

          if (wrong_login_today >= LoginRoute.MAX_WRONG_LOGIN) {
            throw new Error(EErrors.frozen_account);
          }

          if (wrong_login_today >= CaptchaRoute.SHOW_CAPTCHA_LEVEL && user.captcha_text != this.image_verify) {
            throw new Error(EErrors.captcha_not_equal);
          }
          if (user.password != data.password) {
            throw new Error(EErrors.incorrect_log_or_ps);
          }
          return user;
        }
      )
  }

  increaseWrongLogin(email) {
    return this.app.db
      .collection('users')
      .findOne({ email: email })
      .then(
        user => {
          if (user) {
            user.wrong_login = user.wrong_login || {};
            if (!user.wrong_login[this.today]) {
              user.wrong_login[this.today] = 0;
            }
            user.wrong_login[this.today]++;
            this.app.db
              .collection('users')
              .update(
                { _id: user._id },
                { $set: { wrong_login: user.wrong_login } }
              )
          }
          return user;
        }
      )
  }

  launch() {
    let email: string, password: string;

    return new Promise(
      (resolve, reject) => {

        email           = this.email;
        password        = this.password;

        resolve({
          email: email,
          password: password
        });
      }
    )
    .then((data: ILoginData) => this.check(data))
    .then(result => this.res.status(200).json(result))
    .catch(
      err => {
        this.increaseWrongLogin(email);
        console.error(err);
        this.res.status(412).json({
          message: err.message,
          stack: err.stack
        });
      }
    );
  }
}