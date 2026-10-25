# Ṣọ́ra on WhatsApp

Most scam messages arrive on WhatsApp, and that's where parents already are. With the bot, anyone can
**forward a suspicious message or screenshot to a Ṣọ́ra WhatsApp number** and get the verdict, steps
and red flags back in their language, plus a voice note when the voice service is running.

## How it works
`POST /api/channels/whatsapp` is a Twilio webhook ([`app/api/channels/whatsapp/route.ts`](../app/api/channels/whatsapp/route.ts)).

1. Twilio posts `From`, `Body`, `NumMedia` and `MediaUrl0`. We verify the `X-Twilio-Signature` header
   (HMAC-SHA1 with your auth token) and reject anything unsigned.
2. "hi", "hello", "bawo", "sannu", "ndewo" or an empty message → instructions.
3. A leading `YO`, `HA`, `IG` or `PCM` picks the reply language (same as SMS). Default is English.
4. Screenshots are downloaded with your Twilio credentials and read by Gemma 4.
5. Twilio waits only 15 s, so we return an empty TwiML response at once and reply through Twilio's REST
   API in the background (Next.js `after()`). Without Twilio credentials, for local testing, the reply
   comes back directly as TwiML.
6. Unlike SMS, WhatsApp shows Unicode, so replies keep full tone marks.
7. If `VOICE_SERVICE_URL` is set, a second message carries an MP3 voice note served from a signed link
   that expires after an hour (`GET /api/voice?...`).

## Set up the free Twilio sandbox (about 10 minutes)
1. Sign up at [twilio.com](https://www.twilio.com/try-twilio) (free trial).
2. Console → **Messaging → Try it out → Send a WhatsApp message**. Join the sandbox from your phone by
   sending the code shown (e.g. `join <two-words>`) to **+1 415 523 8886**.
3. In **Sandbox settings**, set *When a message comes in* to
   `https://<your-app>.vercel.app/api/channels/whatsapp` (method `POST`).
4. Add these to Vercel (Production) and redeploy:
   ```
   TWILIO_ACCOUNT_SID=AC...
   TWILIO_AUTH_TOKEN=...
   TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
   ```
5. Send the sandbox number a suspicious message. Anyone who wants to try it (judges, family) must
   first send the `join` code from their own phone.

## Going to production
The sandbox is for testing only. A real Ṣọ́ra number needs a WhatsApp Business sender approved by Meta
through Twilio (or the Meta Cloud API directly), a business profile, and message templates for any
message sent more than 24 hours after the user's last message. Ṣọ́ra only ever replies within that
window, so templates aren't needed for normal use.

## Test locally
```bash
curl -X POST localhost:3000/api/channels/whatsapp \
  --data-urlencode "From=whatsapp:+2348000000001" \
  --data-urlencode "Body=YO Pay N3,500 registration fee to claim your FG grant" \
  --data-urlencode "NumMedia=0"
```
