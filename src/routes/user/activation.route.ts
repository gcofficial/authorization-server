import { RoutesService } from '../../services/routes.service';
import { Route } from '../route';
import { EErrors } from '../../enums/eerrors.enum';
import { EMessages } from '../../enums/emessages.enum';
import * as util from 'util';

export class ActivationRoute extends Route{

  get key(): string {
    let key = this.req.params.activation_key || '';
    key = key.trim();
    if (key == '') {
      throw new Error(util.format(EErrors.cant_be_empty, 'Key'));
    }
    return key;
  }

  checkActivation(key) {
    return this.app.db
      .collection('users')
      .findOne({ activation_key: key })
      .then(
        user => {
          if (user == null) {
            throw new Error(EErrors.invalid_activation_key);
          }
          return user;
        }
      )
  }

  activation(user) {
    return this.app.db
      .collection('users')
      .update({ _id: user._id }, { $unset: { activation_key: 1 } })
      .then(result => ({ msg: EMessages.activation_success, user: user }) );
  }

  launch() {
    return new Promise(
      (resolve, reject) => {
        resolve(this.key);
      }
    )
    .then(key => this.checkActivation(key))
    .then(user => this.activation(user))
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