# Ṣọ́ra on button phones (USSD and SMS)

## Why
Many people scammers target, especially older parents in smaller towns, use basic phones. A web app
can't reach them. USSD and SMS work on any GSM phone, need no data bundle, and work on 2G.

## How it works
Both channels call the same `analyze()` pipeline as the web app.

### USSD: `POST /api/channels/ussd`
Africa's Talking sends form fields `sessionId, serviceCode, phoneNumber, text`, where `text` is every
input so far joined by `*`. We reply `CON …` to continue or `END …` to finish.

```
*384*7672#            (demo code)
 ├─ 1 English · 2 Pidgin · 3 Yoruba · 4 Hausa · 5 Igbo
 │   ├─ 1 Check a message → type key words → END verdict + reason + action
 │   ├─ 2 Common scams → 1–5 → END short warning + action
 │   └─ 3 Check by SMS → END "Forward the SMS to <number>, start with YO/HA/IG/PCM"
```
- Screens are capped at 182 characters.
- Sessions time out after about 20 s, so the model gets 8 s and the rules answer if it's slower.
- A `*` inside the typed message is kept (everything after the menu choices is re-joined).

### SMS: `POST /api/channels/sms`
Africa's Talking posts `from, to, text, date, id`. The first word picks the language
(`EN`, `PCM`/`PIDGIN`, `YO`/`YORUBA`, `HA`/`HAUSA`, `IG`/`IGBO`), defaulting to English. `HELP` returns
instructions. The reply is sent through the AT messaging API when `AT_API_KEY` is set, and is also
returned in the response body.

### GSM-7
One character outside the GSM-7 alphabet (such as ẹ, ọ, ṣ or ɗ) switches the whole SMS to UCS-2:
70 characters per part instead of 160, and many basic phones show boxes. Phone replies are therefore
folded to plain letters (`toGsm` in `lib/sora/channels.ts`) and kept within 2 SMS segments. The web app
keeps full orthography.

## Going live
1. Create an [Africa's Talking](https://account.africastalking.com) account and test in the **sandbox**
   (`AT_USERNAME=sandbox`) with their simulator.
2. Request a USSD code (shared codes like `*384*XXXX#` are cheaper) and a short code or long number for SMS.
   These are paid and go through telco approval.
3. Set callback URLs: USSD → `https://<your-app>/api/channels/ussd`, incoming SMS →
   `https://<your-app>/api/channels/sms`.
4. Set `AT_USERNAME`, `AT_API_KEY`, `AT_SENDER_ID` (optional) and `SORA_SMS_NUMBER` in Vercel.

**Cost note:** USSD sessions and reply SMS are billed per session and message. A sustainable launch needs
a sponsor (bank, telco or NGO) or reverse billing.
