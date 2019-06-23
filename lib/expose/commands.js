'use strict';

const DEFAULT_AREA_CODE = '213'; // Some California area code

const internals = {};

module.exports = (server, options) => ({
    value: {
        default: {
            command: async (srv, [to, message]) => {

                if (!to || !message) {
                    throw new Error('"to", and "message" are required');
                }

                const { twilioService } = srv.services();

                const { phoneNumber } = internals.sample(await twilioService.listPurchasedNumbers());

                console.log(await twilioService.sendText(phoneNumber, to, message));
            }
        },
        mms: {
            command: async (srv, [to, message, mediaUrl]) => {

                if (!to || !message || !mediaUrl) {
                    throw new Error('"to", "message", and "mediaUrl" are required');
                }

                const { twilioService } = srv.services();

                const { phoneNumber } = internals.sample(await twilioService.listPurchasedNumbers());

                console.log(await twilioService.sendMms(phoneNumber.phoneNumber, to, message, mediaUrl));
            }
        },
        listAvailableNumbers: {
            command: async (srv, [areaCode]) => {

                areaCode = areaCode || DEFAULT_AREA_CODE;

                const { twilioService } = srv.services();

                console.log(await twilioService.listAvailableNumbers(areaCode));
            }
        },
        purchaseNumber: {
            command: async (srv, [number]) => {

                if (!number) {
                    throw new Error('"number" is required');
                }

                const { twilioService } = srv.services();

                console.log(await twilioService.purchaseNumber(number));
            }
        },
        listPurchasedNumbers: {
            command: async (srv) => {

                const { twilioService } = srv.services();

                console.log(await twilioService.listPurchasedNumbers());
            }
        }
    }
});

internals.sample = (arr) => arr[Math.floor(Math.random() * arr.length)];
