'use strict';

const nodemailer = require('nodemailer');

function Mail(skyfall) {
  const transports = new Map();
  const names = new Map();

  this.transports = (id) => {
    if (transports.has(id)) {
      return transports.get(id);
    } else if (names.has(id)) {
      return names.get(id);
    }
    return false;
  };

  this.configure = (options) => {
    const id = skyfall.utils.id();
    const name = options.name || options.host;

    const mailer = nodemailer.createTransport(options);

    function send(message) {
      mailer.sendMail(message).
        then((info) => {
          skyfall.events.emit({
            type: `mail:${ name }:sent`,
            data: info,
            source: id
          });
        }).
        catch((error) => {
          skyfall.events.emit({
            type: `mail:${ name }:error`,
            data: error,
            source: id
          });
        });
    }

    const transport = {
      id,
      name
    };

    transports.set(id, transport);
    names.set(name, transport);

    skyfall.utils.hidden(transport, 'send', (message) => {
      send(message);
    });

    skyfall.events.on(`mail:${ name }:send`, (event) => {
      send(event.data);
    });

    skyfall.events.emit({
      type: `mail:${ name }:configured`,
      data: transport,
      source: id
    });

    return transport;
  };
}

module.exports = {
  name: 'mail',
  install: (skyfall, options) => {
    skyfall.mail = new Mail(skyfall, options);
  }
};
