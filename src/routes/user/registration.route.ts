import { RoutesService } from '../../services/routes.service';
import { Route } from '../route';
import { EErrors } from '../../enums/eerrors.enum';
import { EMagic } from '../../enums/emagic.enum';
import { IRegistrationData } from '../../interfaces/iregistration-data';
import { MailService } from '../../services/mail.service';
import emailValidation from '../../utils/email-validation.util';
import * as util from 'util';
import * as md5 from 'md5';

export class RegistrationRoute extends Route{

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

    if (pswd != this.req.body.password_repeat) {
      throw new Error(EErrors.passwords_must_mutch);
    }
    return pswd;
  }

  get password_repeat(): string {
    let pswd =  this.req.body.password_repeat || '',
      dic = /01234|12345|23456|34567|45678|56789|ABCDE|BCDEF|CDEFG|DEFGH|EFGHI|FGHIJ|GHIJK|HIJKL|IJKLM|JKLMN|KLMNO|LMNOP|MNOPQ|NOPQR|OPQRS|PQRST|QRSTU|RSTUV|STUVW|TUVWX|UVWXY|VWXYZ|abcde|bcdef|cdefg|defgh|efghi|fghij|ghijk|hijkl|ijklm|jklmn|klmno|lmnop|mnopq|nopqr|opqrs|pqrst|qrstu|rstuv|stuvw|tuvwx|uvwxy|vwxyz/;

    if (pswd.match(/[a-z]/) == null) {
      throw new Error(util.format(EErrors.password_must_contain, 'such as abc letters'));
    }

    if (pswd.match(/[A-Z]/) == null) {
      throw new Error(util.format(EErrors.password_must_contain, 'such as ABC letters'));
    }

    if (pswd.match(/[0-9]/) == null) {
      throw new Error(util.format(EErrors.password_must_contain, 'such as 123 numbers'));
    }

    if (pswd.match(/(.)\1{4,}/) !== null) {
      throw new Error(util.format(EErrors.more_than_n_same_letters, '4'));
    }

    if (pswd.match(dic) !== null) {
      throw new Error(EErrors.too_much_consecutive_letters);
    }

    return pswd;
  }

  checkEmailExists(data: IRegistrationData): Promise<IRegistrationData> {
    return this.app.db
      .collection('users')
      .findOne({ email: data.email })
      .then(
        user => {
          if (user !== null) {
            throw new Error(EErrors.email_exists);
          }
          return data;
        }
      );
  }

  limitRegistrationByIP(data: IRegistrationData): Promise<IRegistrationData> {
    return this.app.db
      .collection('users')
      .find({
        ip: this.getClientAddress(),
        created: {
          $gte: new Date(Date.now() - 60 * 60 * 1000),
          $lte: new Date(Date.now())
        }
      })
      .count()
      .then(
        count => { 
          if (count >= 5) {
            throw new Error(EErrors.too_much_registrations);
          }
          return data; 
        }
      )
  }

  addAdditionalData(data: IRegistrationData): IRegistrationData {
    data.ip = this.getClientAddress();
    data.created = new Date(Date.now());
    return data;
  }

  insert(data: IRegistrationData): any {
    return this.app.db
      .collection('users')
      .insert(data)
      .then(
        result => {
          this.res.render(
            'activation_link', 
            { link: `${ this.req.headers.origin }/#/activation/${ data.activation_key }` }, 
            (err, html) => {
              MailService.mail(data.email, 'Activation link', html);
            }
          );
          return data;
        }
      );
  }

  getClientAddress() {
    return (<any>(this.req.headers["X-Forwarded-For"] ||
      this.req.headers["x-forwarded-for"] ||
      '')).split(',')[0] || this.req.connection.remoteAddress;
  }

  launch() {
    let email: string, 
      password: string, 
      password_repeat: string, 
      activation_key: string;

    return new Promise(
      (resolve, reject) => {

        email           = this.email;
        password        = this.password;
        password_repeat = this.password_repeat;
        activation_key  = md5(email + password + EMagic.activation_key);

        resolve({
          email: email,
          password: md5(md5(password) + EMagic.password),
          activation_key: activation_key
        });
      }
    )
    .then((data: IRegistrationData) => this.checkEmailExists(data))
    .then((data: IRegistrationData) => this.limitRegistrationByIP(data))
    .then((data: IRegistrationData) => this.addAdditionalData(data))
    .then((data: IRegistrationData) => this.insert(data))
    .then(result => this.res.status(200).json(result))
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