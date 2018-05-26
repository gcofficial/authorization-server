import { Route } from '../route';

export class IntroRoute extends Route{

  launch() {
    this.res.render('main', { title: 'Main' }, (err, html) => { this.res.send(html) });
  }
}