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

                const { sseService, txtMeTwilioService } = srv.services();

                const phoneNumber = await txtMeTwilioService.getDefaultOrRandomNumber();

                const statusListenerId = String(Math.random()).slice(2);

                const ssePromise = sseService.listen({
                    url: `${options.statusServerUrl}/status/${statusListenerId}`,
                    events: {
                        status: (evt) => {

                            try {
                                const data = JSON.parse(evt.data);
                                console.log(data.MessageStatus);
                            }
                            catch (err) {
                                console.log('err parsing evt.data');
                                console.log(err);
                            }
                        }
                    },
                    onOpen: () => console.log('SSE connection opened.'),
                    onClose: () => console.log('SSE connection closed.'),
                    onError: (err) => console.log(err)
                });

                await txtMeTwilioService.text({
                    from: phoneNumber,
                    to,
                    body: message,
                    statusListenerId
                });

                await ssePromise;
            }
        },
        mms: {
            command: async (srv, [to, message, mediaUrl]) => {

                if (!to || !message || !mediaUrl) {
                    throw new Error('"to", "message", and "mediaUrl" are required');
                }

                const { txtMeTwilioService } = srv.services();

                const phoneNumber = await txtMeTwilioService.getDefaultOrRandomNumber();

                console.log(await txtMeTwilioService.mms(phoneNumber, to, message, mediaUrl));
            }
        },
        listAvailableNumbers: {
            command: async (srv, [areaCode]) => {

                areaCode = areaCode || DEFAULT_AREA_CODE;

                const { txtMeTwilioService } = srv.services();

                console.log(await txtMeTwilioService.listAvailableNumbers(areaCode));
            }
        },
        purchaseNumber: {
            command: async (srv, [number]) => {

                if (!number) {
                    throw new Error('"number" is required');
                }

                const { txtMeTwilioService } = srv.services();

                console.log(await txtMeTwilioService.purchaseNumber(number));
            }
        },
        purchaseRandomFromAreaCode: {
            command: async (srv, [areaCode]) => {

                areaCode = areaCode || DEFAULT_AREA_CODE;

                const { txtMeTwilioService } = srv.services();

                const availableNumbers = await txtMeTwilioService.listAvailableNumbers(areaCode);

                if (!availableNumbers.length) {
                    throw new Error(`No numbers available for area code ${areaCode}`);
                }

                const { phoneNumber } = internals.sample(await txtMeTwilioService.listAvailableNumbers(areaCode));

                console.log(await txtMeTwilioService.purchaseNumber(phoneNumber));
            }
        },
        listPurchasedNumbers: {
            command: async (srv) => {

                const { txtMeTwilioService } = srv.services();

                console.log(await txtMeTwilioService.listPurchasedNumbers());
            }
        },
        sseTest: {
            command: async (srv) => {

                const { sseService } = srv.services();

                await sseService.listen({
                    url: `${options.statusServerUrl}/status/123`,
                    events: {
                        status: (evt) => console.log(evt)
                    },
                    onOpen: () => console.log('SSE connection opened.'),
                    onClose: () => console.log('SSE connection closed.'),
                    onError: (err) => console.log('Error (logging in sseTest command code)\n', err)
                });
            }
        }
    }
});

internals.sample = (arr) => arr[Math.floor(Math.random() * arr.length)];
