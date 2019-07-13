# API Reference

## hpal commands

### default
`hpal run txt-me <to> <message|mms-url> [mms-url]`

Run the default command to send a text message and/or mms url to a number 

### list-available-numbers
`hpal run txt-me:list-available-numbers [area-code|default-area-code]`

Run with an optional area code to see a list of available numbers from Twilio

### purchase-number
`hpal run txt-me:purchase-number <number>`

Run with a number you've copied from `list-available-numbers` and things will work out well for you

### purchase-random-from-area-code
`hpal run txt-me:purchase-random-from-area-code <area-code|default-area-code>`

Run to purchase a random number from an area code or use the default

### list-purchased-numbers
`hpal run txt-me:list-purchased-numbers`

Run to list numbers on your account

### sse-test
`hpal run txt-me:sse-test`

Run this to test the SSE connection with your `statusServerUrl`

This function begins a watch session with a test id and sends status updates for that id ('sent' then 'delivered')

## txtMeTwilioService

### getDefaultOrRandomNumber()

If an env var is set for a default purchased number, it is used. Otherwise a random purchased number is used

### listAvailableNumbers(areaCode)

Same behavior as hpal command

### purchaseNumber(number)

Same behavior as hpal command

### listPurchasedNumbers()

Same behavior as hpal command

### text({ from, to, body, mediaUrl, statusListenerId })

Pretty much the same as the hpal command.
Here, `statusListenerId` and `from` are exposed.
If you do pass a `statusListenerId`, make sure you pass that id when you listen on SSE.
