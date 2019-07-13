'use strict';

const Wreck = require('@hapi/wreck');

const DEFAULT_AREA_CODE = '213'; // Some California area code

const internals = {};

module.exports = (server, options) => ({
    value: {
        default: {
            command: async (srv, [to, message, mediaUrl]) => {

                if (!to || (!message && !mediaUrl)) {
                    throw new Error('"to", and ("message" or "mediaUrl") are required');
                }

                if (String(message).startsWith('http')) {
                    mediaUrl = message;
                    message = undefined;
                }

                if (mediaUrl && !String(mediaUrl).startsWith('http')) {
                    throw new Error('"mediaUrl" must be a URL');
                }

                const { sseService, txtMeTwilioService } = srv.services();

                const statusListenerId = String(Math.random()).slice(2);
                let ssePromise;

                if (options.statusServerUrl) {

                    ssePromise = sseService.listen({
                        url: `${options.statusServerUrl}/status/${statusListenerId}`,
                        events: {
                            status: (evt) => {

                                try {
                                    const data = JSON.parse(evt.data);
                                    console.log(data.MessageStatus);
                                }
                                catch (err) {
                                    console.log('Error parsing event.data');
                                    console.log(err);
                                }
                            }
                        },
                        onOpen: () => console.log('SSE connection opened.\n'),
                        onClose: () => console.log('\nSSE connection closed.'),
                        onError: (err) => console.log(err)
                    });
                }

                const phoneNumber = await txtMeTwilioService.getDefaultOrRandomNumber();

                // Send the text _after_ we start listening for status updates,
                // if a statusServerUrl is available
                await txtMeTwilioService.text({
                    from: phoneNumber,
                    to,
                    body: message,
                    mediaUrl,
                    statusListenerId
                });

                if (ssePromise) {
                    await ssePromise;
                }
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

                const { phoneNumber } = internals.sample(availableNumbers);

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

                if (!options.statusServerUrl) {
                    throw new Error('options.statusServerUrl is required');
                }

                const { sseService } = srv.services();
                const { awaitTimeout } = internals;

                const TEST_SESSION_ID = '123456789';

                const runTestCommands = async () => {

                    // Allow SSE listener to start
                    await awaitTimeout(1);

                    await Wreck.request('post', `${options.statusServerUrl}/status/${TEST_SESSION_ID}`, {
                        payload: JSON.stringify({
                            SmsSid: '1234567890',
                            SmsStatus: 'sent',
                            MessageStatus: 'sent',
                            To: '9876543210',
                            MessageSid: '12345678901234567890',
                            AccountSid: '12345678901234567890',
                            From: '3383727728',
                            ApiVersion: '123'
                        })
                    });

                    await awaitTimeout(3000);

                    await Wreck.request('post', `${options.statusServerUrl}/status/${TEST_SESSION_ID}`, {
                        payload: JSON.stringify({
                            SmsSid: '1234567890',
                            SmsStatus: 'delivered',
                            MessageStatus: 'delivered',
                            To: '9876543210',
                            MessageSid: '12345678901234567890',
                            AccountSid: '12345678901234567890',
                            From: '3383727728',
                            ApiVersion: '123'
                        })
                    });
                };

                runTestCommands();

                await sseService.listen({
                    url: `${options.statusServerUrl}/status/${TEST_SESSION_ID}`,
                    events: {
                        status: (evt) => console.log(evt)
                    },
                    onOpen: () => console.log('SSE connection opened.'),
                    onClose: () => console.log('SSE connection closed.'),
                    onError: (err) => console.log('Error (logging in sseTest command code)\n', err)
                });

                console.log('\nTest complete.\n');
            }
        }
    }
});

internals.sample = (arr) => arr[Math.floor(Math.random() * arr.length)];

internals.awaitTimeout = async (timeout) => {

    return await new Promise((res) => {

        setTimeout(res, timeout);
    });
};
