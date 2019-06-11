'use strict';

module.exports = (srv, options) => ({
    plugins: {
        plugin: require('email-me'),
        options
    }
});
