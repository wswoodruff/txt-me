'use strict';

const Schmervice = require('schmervice');

module.exports = class TextService extends Schmervice.Service {

    async sendText({ carrier, number, text }) {

        const { emailService } = this.server.services(true);

        let emailTo;

        switch (carrier) {

            case 'verizon':
                emailTo = `${number}@vtext.com`;
                break;

            case 'tmobile':
                emailTo = `${number}@tmomail.net`;
                break;

            case 'at&t':
            case 'att':
                emailTo = `${number}@txt.att.net`;
                break;

            case 'sprint':
                emailTo = `${number}@messaging.sprintpcs.com`;
                break;

            case 'fi':
            case 'googleFi':
                emailTo = `${number}@msg.fi.google.com`;
                break;

            case 'uscellular':
                emailTo = `${number}@email.uscc.net`;
                break;

            default:
                throw new Error('Unsupported carrier');
        }

        return await emailService.sendMail({ to: emailTo, text });
    }
};
