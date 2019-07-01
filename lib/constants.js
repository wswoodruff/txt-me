'use strict';

// As per docs: https://www.twilio.com/docs/sms/send-messages?code-sample=code-send-an-sms-with-a-statuscallback-url-2&code-language=Node.js&code-sdk-version=3.x
exports.STATUSES = {
    QUEUED: 'queued',
    FAILED: 'failed',
    SENT: 'sent',
    DELIVERED: 'delivered',
    UNDELIVERED: 'undelivered'
};
