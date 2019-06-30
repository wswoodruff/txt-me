'use strict';

const Toys = require('toys');
const EventSource = require('eventsource');

exports.sse = async ({ url, events, onOpen, onClose, onError }) => {

    if (!url || !onOpen) {
        throw new Error('"url" and "onOpen" are required');
    }

    if (String(events) !== '[object Object]') {
        throw new Error('"events" must be an object');
    }

    const es = new EventSource(url);

    const defaultErr = (err) => console.log('SSE Error:', err);

    const errFunc = onError || defaultErr;

    es.on('open', onOpen);
    es.on('error', errFunc);

    const cleanupEvents = { open: onOpen, error: errFunc };

    if (events && events.toString() === '[object Object]') {
        Object.entries(events).forEach(([eventName, func]) => {

            es.on(eventName, (evt) => {

                // Prevent open event from getting through
                if (evt.data !== 'open') {
                    func(evt);
                }
            });
            cleanupEvents[eventName] = func;
        });
    }

    try {
        // await until end
        await Toys.event(es, 'end');
    }
    catch (err) {

        errFunc(err);
    }

    es.close();

    Object.entries(cleanupEvents).forEach(([eventName, func]) => {

        es.removeEventListener(eventName, func);
    });

    if (onClose) {
        onClose();
    }
    else {
        console.log('SSE connection closed.');
    }
};
