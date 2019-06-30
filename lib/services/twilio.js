'use strict';

const Schmervice = require('schmervice');
const Twilio = require('twilio');

const DEFAULT_NUMBER_FILTER = (phoneNum) => phoneNum.capabilities.SMS;

// Docs: https://www.twilio.com/docs/sms/services/api

const internals = {};

module.exports = class TxtMeTwilioService extends Schmervice.Service {

    constructor(server, options) {

        super(server, options);

        if (!this.options.twilio ||
            !this.options.twilio.account) {

            throw new Error('options.twilio.account is required');
        }
    }

    async getDefaultOrRandomNumber() {

        if (this.options.twilio.account.defaultNumber) {

            return this.options.twilio.account.defaultNumber;
        }

        const { phoneNumber } = internals.sample(await this.listPurchasedNumbers());

        return phoneNumber;
    }

    async initialize() {

        const { accountSid, authToken } = this.options.twilio.account;

        this.client = await Twilio(accountSid, authToken);
    }

    async listAvailableNumbers(areaCode) {

        if (!areaCode) {
            throw Error('"areaCode" is required');
        }

        const numbers = await this.client
            .availablePhoneNumbers('US')
            .local
            .list({
                areaCode,
                voiceEnabled: true,
                smsEnabled: true,
                mmsEnabled: true
            });

        return numbers.filter(DEFAULT_NUMBER_FILTER);
    }

    // Docs: https://www.twilio.com/docs/sms/services/api/phonenumber-resource#create-a-phonenumber-resource

    async purchaseNumber(number, service) {

        const purchasedNumber = await this.client
            .incomingPhoneNumbers
            .create({ phoneNumber: number });

        return purchasedNumber;
    }

    // Docs: https://www.twilio.com/docs/phone-numbers/api/incomingphonenumber-resource?code-sample=code-list-all-incomingphonenumber-resources-for-your-account&code-language=node.js&code-sdk-version=3.x
    async listPurchasedNumbers() {

        return await this.client.incomingPhoneNumbers.list();
    }

    // Docs: https://www.twilio.com/docs/sms/send-messages
    async text({ from, to, body, statusListenerId }) {

        await this.client
            .messages
            .create({
                from,
                to,
                body,
                statusCallback: `https://wswoodruff.com/status/${statusListenerId}`
            });
    }

    async mms(from, to, body, mediaUrl) {

        if (!from || !to || !body || !mediaUrl) {
            throw new Error('"from", "to", "body", and "mediaUrl" are required');
        }

        return await this.client
            .messages
            .create({ from, to, body, mediaUrl });
    }
};

internals.sample = (arr) => arr[Math.floor(Math.random() * arr.length)];
