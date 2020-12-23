'use strict';

const Wreck = require('@hapi/wreck');

const DEFAULT_AREA_CODE = '213'; // Some California area code

const internals = {};

module.exports = (server, options) => ({
    value: {
        default: {
            description: '[to, msg, mediaUrl]',
            command: async (srv, [to, msg, mediaUrl]) => {

                await internals.sendText({
                    sse: true,
                    srv,
                    to,
                    msg,
                    mediaUrl,
                    options
                });
            }
        },
        gangTxt: {
            description: '[to, numNumbers, msg, mediaUrl]',
            command: async (srv, [to, numNumbers, msg, mediaUrl]) => {

                let numbers = await internals.listPurchasedNumbers(srv);

                numNumbers = Math.max(parseInt(numNumbers, 10), 1);

                if (numNumbers > numbers.length) {
                    console.warn(`Requested numbers are ${numNumbers} but there are only ${numbers.length} available`);
                }

                // Slice to be length 1 up to numbers.length
                numbers = numbers.slice((Math.min(Math.max(numNumbers, 0), numbers.length)) * -1);

                await Promise.all(numbers.map(({ phoneNumber }) => {

                    return internals.sendText({
                        sse: true,
                        srv,
                        to,
                        from: phoneNumber,
                        msg,
                        mediaUrl,
                        options
                    });
                }));
            }
        },
        slowSplit: {
            description: '[to, numNumbers, msg, mediaUrl]',
            command: async (srv, [to, numNumbers, msg, mediaUrl]) => {

                let numbers = await internals.listPurchasedNumbers(srv);

                numNumbers = Math.max(parseInt(numNumbers, 10), 1);

                if (numNumbers > numbers.length) {
                    console.warn(`Requested numbers are ${numNumbers} but there are only ${numbers.length} available`);
                }

                // Slice to be length 1 up to numbers.length
                numbers = numbers.slice((Math.min(Math.max(numNumbers, 0), numbers.length)) * -1);

                // Idk man just found this on Stack Overflow
                const sliceLength = Math.round(msg.length / numbers.length);
                const matchRegexp = new RegExp(`.{1,${sliceLength}}`, 'g');

                const messageSlices = msg.match(matchRegexp);

                const minWaitBetween = 10000;
                const maxWaitBetween = 20000;

                for (let i = 0; i < messageSlices.length; ++i) {

                    await internals.sendText({
                        sse: true,
                        srv,
                        to,
                        from: numbers[i].phoneNumber,
                        msg: messageSlices[i],
                        mediaUrl,
                        options
                    });

                    // Wait if it's not the last one
                    if (i < messageSlices.length - 1) {
                        await internals.awaitTimeout(Math.floor(Math.random() * maxWaitBetween) + minWaitBetween);
                    }
                }
            }
        },
        slowSplitReverse: {
            description: '[to, numNumbers, msg, mediaUrl]',
            command: async (srv, [to, numNumbers, msg, mediaUrl]) => {

                let numbers = await internals.listPurchasedNumbers(srv);

                numNumbers = Math.max(parseInt(numNumbers, 10), 1);

                if (numNumbers > numbers.length) {
                    console.warn(`Requested numbers are ${numNumbers} but there are only ${numbers.length} available`);
                }

                // Slice to be length 1 up to numbers.length
                numbers = numbers.slice((Math.min(Math.max(numNumbers, 0), numbers.length)) * -1);

                // Idk man just found this on Stack Overflow
                const sliceLength = Math.round(msg.length / numbers.length);
                const matchRegexp = new RegExp(`.{1,${sliceLength}}`, 'g');

                const messageSlices = msg.match(matchRegexp).reverse();

                const minWaitBetween = 10000;
                const maxWaitBetween = 20000;

                for (let i = 0; i < messageSlices.length; ++i) {

                    await internals.sendText({
                        sse: true,
                        srv,
                        to,
                        from: numbers[i].phoneNumber,
                        msg: messageSlices[i],
                        mediaUrl,
                        options
                    });

                    // Wait if it's not the last one
                    if (i < messageSlices.length - 1) {
                        await internals.awaitTimeout(Math.floor(Math.random() * maxWaitBetween) + minWaitBetween);
                    }
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

                const numbers = await internals.listPurchasedNumbers(srv);

                console.log('numbers', numbers);
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
                    await awaitTimeout(3000);

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

internals.listPurchasedNumbers = async (srv) => {

    const { txtMeTwilioService } = srv.services();

    return await txtMeTwilioService.listPurchasedNumbers();
};

internals.sendText = async ({ srv, to, from, msg, sse, mediaUrl, options }) => {

    if (!to || (!msg && !mediaUrl)) {
        throw new Error('"to", and ("message" or "mediaUrl") are required');
    }

    if (String(msg).startsWith('http')) {
        mediaUrl = msg;
        msg = undefined;
    }

    if (mediaUrl && !String(mediaUrl).startsWith('http')) {
        throw new Error('"mediaUrl" must be a URL');
    }

    const { sseService, txtMeTwilioService } = srv.services();

    const statusListenerId = String(Math.random()).slice(2);
    let ssePromise;

    if (sse === true && options.statusServerUrl) {

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

    const phoneNumber = from || await txtMeTwilioService.getDefaultOrRandomNumber();

    // Send the text _after_ we start listening for status updates,
    // if a statusServerUrl is available
    await txtMeTwilioService.text({
        from: phoneNumber,
        to,
        body: msg,
        mediaUrl,
        statusListenerId
    });

    if (ssePromise) {
        await ssePromise;
    }
};
