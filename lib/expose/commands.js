'use strict';

module.exports = (server, options) => ({
    value: {
        default: {
            command: async (srv, args) => {

                const [carrier, number, text] = args;

                if (!carrier || !number || !text) {
                    throw new Error('carrier, number, and text are required');
                }

                const { textService } = srv.services();
                await textService.sendText({ carrier, number, text });
            }
        }
    }
});
