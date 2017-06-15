import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as multer from 'multer';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as crypt from 'crypto';

const
  https = require('https'),
  request = require('request');

let app = express();
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json({ verify: verifyRequestSignature }));

let upload = multer();


/*
 * Be sure to setup your config values before running this code. You can
 * set them using environment variables or modifying the config file in /config.
 *
 */

// App Secret can be retrieved from the App Dashboard
const APP_SECRET = process.env.FB_APP_SECRET;

// Arbitrary value used to validate a webhook
const VALIDATION_TOKEN = process.env.FB_VERIFY_TOKEN;

// Generate a page access token for your page from the App Dashboard
const PAGE_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;

// // URL where the app is running (include protocol). Used to point to scripts and
// // assets located at this address.
// const SERVER_URL = (process.env.SERVER_URL) ?
//   (process.env.SERVER_URL) :
//   config.get('serverURL');

if (!(APP_SECRET && VALIDATION_TOKEN && PAGE_ACCESS_TOKEN)) {
  console.error('Missing config values');
  process.exit(1);
}


// // // // // fb webhook


/*
 * Use your own validation token. Check that the token used in the Webhook
 * setup is the same token used here.
 *
 */
app.get('/webhook', (request, response) => {
  if (request.query['hub.mode'] === 'subscribe' &&
    request.query['hub.verify_token'] === VALIDATION_TOKEN) {
    console.log('Validating webhook');
    response.status(200).send(request.query['hub.challenge']);
  } else {
    console.error('Failed validation. Make sure the validation tokens match.');
    response.sendStatus(403);
  }
});


/*
 * All callbacks for Messenger are POST-ed. They will be sent to the same
 * webhook. Be sure to subscribe your app to your page to receive callbacks
 * for your page.
 * https://developers.facebook.com/docs/messenger-platform/product-overview/setup#subscribe_app
 *
 */
app.post('/webhook', (req, res) => {
  let data = req.body;

  // Make sure this is a page subscription
  if (data.object === 'page') {
    // Iterate over each entry
    // There may be multiple if batched
    data.entry.forEach(function(pageEntry: any) {
      let pageID = pageEntry.id;
      let timeOfEvent = pageEntry.time;

      // Iterate over each messaging event
      pageEntry.messaging.forEach(function(messagingEvent: any) {
        // if (messagingEvent.optin) {
        //   receivedAuthentication(messagingEvent);
        // } else
        if (messagingEvent.message) {
          receivedMessage(messagingEvent);
          // }
          // else if (messagingEvent.delivery) {
          //   receivedDeliveryConfirmation(messagingEvent);
          // } else if (messagingEvent.postback) {
          //   receivedPostback(messagingEvent);
          // } else if (messagingEvent.read) {
          //   receivedMessageRead(messagingEvent);
          // } else if (messagingEvent.account_linking) {
          //   receivedAccountLink(messagingEvent);
        } else {
          console.log('Webhook received unknown messagingEvent: ', messagingEvent);
        }
      });
    });

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know you've
    // successfully received the callback. Otherwise, the request will time out.
    res.sendStatus(200);
  }
});

/*
 * Message Event
 *
 * This event is called when a message is sent to your page. The 'message'
 * object format can vary depending on the kind of message that was received.
 * Read more at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-received
 *
 * For this example, we're going to echo any text that we get. If we get some
 * special keywords ('button', 'generic', 'receipt'), then we'll send back
 * examples of those bubbles to illustrate the special message bubbles we've
 * created. If we receive a message with an attachment (image, video, audio),
 * then we'll simply confirm that we've received the attachment.
 *
 */
function receivedMessage(event: any) {
  let senderID = event.sender.id;
  let recipientID = event.recipient.id;
  let timeOfMessage = event.timestamp;
  let message = event.message;

  console.log("Received message for user %d and page %d at %d with message:",
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  let isEcho = message.is_echo;
  let messageId = message.mid;
  let appId = message.app_id;
  let metadata = message.metadata;

  // You may get a text or attachment but not both
  let messageText = message.text;
  let messageAttachments = message.attachments;
  let quickReply = message.quick_reply;

  if (isEcho) {
    // Just logging message echoes to console
    console.log('Received echo for message %s and app %d with metadata %s',
      messageId, appId, metadata);
    return;
  } else if (quickReply) {
    let quickReplyPayload = quickReply.payload;
    console.log('Quick reply for message %s with payload %s',
      messageId, quickReplyPayload);

    sendTextMessage(senderID, 'Quick reply tapped');
    return;
  }

  if (messageText) {

    // If we receive a text message, check to see if it matches any special
    // keywords and send back the corresponding example. Otherwise, just echo
    // the text we received.
    switch (messageText) {
      // case 'image':
      //   sendImageMessage(senderID);
      //   break;

      // case 'gif':
      //   sendGifMessage(senderID);
      //   break;

      // case 'audio':
      //   sendAudioMessage(senderID);
      //   break;

      // case 'video':
      //   sendVideoMessage(senderID);
      //   break;

      // case 'file':
      //   sendFileMessage(senderID);
      //   break;

      // case 'button':
      //   sendButtonMessage(senderID);
      //   break;

      // case 'generic':
      //   sendGenericMessage(senderID);
      //   break;

      // case 'receipt':
      //   sendReceiptMessage(senderID);
      //   break;

      // case 'quick reply':
      //   sendQuickReply(senderID);
      //   break;

      // case 'read receipt':
      //   sendReadReceipt(senderID);
      //   break;

      // case 'typing on':
      //   sendTypingOn(senderID);
      //   break;

      // case 'typing off':
      //   sendTypingOff(senderID);
      //   break;

      // case 'account linking':
      //   sendAccountLinking(senderID);
      //   break;

      default:
        sendTextMessage(senderID, messageText);
    }
  } else if (messageAttachments) {
    sendTextMessage(senderID, 'Message with attachment received');
  }
}





// // // // // foo



/*
 * Send a text message using the Send API.
 *
 */
const sendTextMessage = (recipientId: string, messageText: string) => {
  let messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText,
      metadata: 'DEVELOPER_DEFINED_METADATA'
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a button message using the Send API.
 *
 */
const sendButtonMessage = (recipientId: string) => {
  let messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'button',
          text: 'This is test text',
          buttons: [{
            type: 'web_url',
            url: 'https://www.oculus.com/en-us/rift/',
            title: 'Open Web URL'
          }, {
            type: 'postback',
            title: 'Trigger Postback',
            payload: 'DEVELOPER_DEFINED_PAYLOAD'
          }, {
            type: 'phone_number',
            title: 'Call Phone Number',
            payload: '+16505551234'
          }]
        }
      }
    }
  };

  callSendAPI(messageData);
}


/*
 * Call the Send API. The message data goes in the body. If successful, we'll
 * get the message id in a response
 *
 */
const callSendAPI = (messageData: any) => {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData

  }, function(error: any, response: any, body: any) {
    if (!error && response.statusCode === 200) {
      let recipientId = body.recipient_id;
      let messageId = body.message_id;

      if (messageId) {
        console.log('Successfully sent message with id %s to recipient %s',
          messageId, recipientId);
      } else {
        console.log('Successfully called Send API for recipient %s',
          recipientId);
      }
    } else {
      console.error('Failed calling Send API', response.statusCode, response.statusMessage, body.error);
    }
  });
}


/*
 * Verify that the callback came from Facebook. Using the App Secret from
 * the App Dashboard, we can verify the signature that is sent with each
 * callback in the x-hub-signature field, located in the header.
 *
 * https://developers.facebook.com/docs/graph-api/webhooks#setup
 *
 */
function verifyRequestSignature(req: any, res: any, buf: any): void {
  let signature = req.headers['x-hub-signature'];

  if (!signature) {
    // For testing, let's log an error. In production, you should throw an
    // error.
    console.error(`Couldn't validate the signature.`);
  } else {
    let [method, signatureHash] = signature.split('=');

    let expectedHash = crypt.createHmac('sha1', APP_SECRET)
      .update(buf)
      .digest('hex');

    if (signatureHash != expectedHash) {
      throw new Error(`Couldn't validate the request signature.`);
    }
  }
}


// // // // // foo

app.get('/', (request, response) => {
  response.send('Hello World!');
});

app.get('/api/sayhello/:name', (request, response) => {
  let name = request.params.name;

  if (!isNaN(name)) {
    response
      .status(400)
      .send('No string as name');
  } else {
    response.json({
      'message': name
    });
  }
});

app.post('/api/sayhello', upload.array(), (request, response) => {
  let name = request.body.name;

  if (!isNaN(name)) {
    response
      .status(400)
      .send('No string as name');
  } else {
    console.log('Hello ' + name);
  }

  response.send('POST request to homepage');
});

app.post('/api/config', upload.array(), (request, response) => {
  // Get document, or throw exception on error
  try {
    let doc = yaml.safeLoad(fs.readFileSync('./config/fsms.yml', 'utf8'));
    console.log(doc);
  } catch (e) {
    console.log(e);
  }
});

app.listen(3000);
