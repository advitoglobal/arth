/**
 * SMS adapter. Until Prem sets ARTH_SMS_VENDOR, OTP is shown once on the login screen.
 * Plug: implement sendOtp and set ARTH_SMS_VENDOR=live.
 */
export async function sendOtp(phone: string, code: string): Promise<{ delivered: boolean; demoCode: string }> {
  if (!process.env.ARTH_SMS_VENDOR?.trim()) {
    return { delivered: false, demoCode: code };
  }
  // Live vendor is wired here later. Fail closed if misconfigured.
  throw new Error("SMS vendor is set but the adapter is not implemented. Unset ARTH_SMS_VENDOR until Prem finishes the account.");
}
