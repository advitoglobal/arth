# Vendors Prem plugs last

Set nothing in `.env` until the account exists. The product runs on stubs.

| Env | Vendor |
|---|---|
| `ARTH_SMS_VENDOR` | SMS OTP. Unset = demo code on screen |
| `ARTH_TELEPHONY_VENDOR` | Exchange duration and recording. Unset = Dial button, unofficial points |
| `ARTH_WHATSAPP_VENDOR` | Cloud API. Unset = wa.me |
| `ARTH_PAYMENTS_VENDOR` | Invoicing |
| `ARTH_VEHICLE_LOOKUP_VENDOR` | Registration check |

Do not put API keys in git. When a vendor is live, implement the matching file in this folder and keep fail-closed.
