import { IRoute } from './interfaces/iroute';
import * as Main from './routes/main/index';
import * as User from './routes/user/index';

const routes: Array<IRoute> = [
  {
    method: 'get',
    path: '/',
    response_service: Main.IntroRoute
  },
  {
    method: 'get',
    path: '/user/activation/:activation_key',
    response_service: User.ActivationRoute
  },
  {
    method: 'post',
    path: '/user/registration',
    response_service: User.RegistrationRoute
  },
  {
    method: 'post',
    path: '/user/login',
    response_service: User.LoginRoute
  },
  {
    method: 'post',
    path: '/user/captcha',
    response_service: User.CaptchaRoute
  },
];

export default routes;