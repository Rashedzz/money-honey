/**
 * Android SMS Parser module for Bangladesh Banking SMS formats.
 */

export interface ParsedSMSTransaction {
  type: 'credit' | 'debit';
  amount: number;
  accountNumber: string | null;   // last 4 digits if found
  balance: number | null;          // balance after transaction
  bankName: string | null;
  referenceNumber: string | null;
  rawMessage: string;
  parsedAt: Date;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Helper to extract transaction amount from SMS text.
 * @param text SMS body
 */
export function extractAmount(text: string): number | null {
  const regex = /(?:BDT|Tk\.?|৳|Tk)\s*,?([\d,]+(?:\.\d+)?)/i;
  const match = text.match(regex);
  if (match && match[1]) {
    const rawNum = match[1].replace(/,/g, '');
    const num = parseFloat(rawNum);
    return isNaN(num) ? null : num;
  }
  return null;
}

/**
 * Helper to extract available balance from SMS text.
 * @param text SMS body
 */
export function extractBalance(text: string): number | null {
  const regex = /(?:Avail\.? Bal(?:ance)?|Balance(?: is)?|A\/C Bal|Bal):?\s*(?:BDT|Tk\.?|৳)?\s*([\d,]+(?:\.\d+)?)/i;
  const match = text.match(regex);
  if (match && match[1]) {
    const rawNum = match[1].replace(/,/g, '');
    const num = parseFloat(rawNum);
    return isNaN(num) ? null : num;
  }
  return null;
}

/**
 * Helper to extract the last 4 digits of the account number.
 * @param text SMS body
 */
export function extractAccountNumber(text: string): string | null {
  const regex = /(?:A\/C(?:\s*No)?|Account(?:\s*ending)?|Acct).{0,5}?(\d{4})\b/i;
  const match = text.match(regex);
  if (match && match[1]) {
    return match[1];
  }
  return null;
}

/**
 * Parses a bank SMS to extract transaction details.
 * 
 * @param smsBody - Raw text of the incoming SMS.
 * @returns A ParsedSMSTransaction object or null if it's not recognized as a bank SMS.
 */
export function parseBankSMS(smsBody: string): ParsedSMSTransaction | null {
  const lowerText = smsBody.toLowerCase();
  
  // Identify if it's a credit or debit
  const isCredit = /(credited|credit|deposited|received|added to)/.test(lowerText);
  const isDebit = /(debited|debit|withdrawn|transferred|paid|atm|pos|purchase)/.test(lowerText);
  
  if (!isCredit && !isDebit) {
    return null; // Not recognized as a transaction SMS
  }

  const type = isCredit ? 'credit' : 'debit';
  const amount = extractAmount(smsBody);
  
  if (amount === null) {
    return null; // Without an amount, it's not useful
  }

  const balance = extractBalance(smsBody);
  const accountNumber = extractAccountNumber(smsBody);
  
  // Optional: Extract bank name if standard Bangladesh banks are mentioned
  let bankName: string | null = null;
  const banks = ['brac', 'dbbl', 'city', 'ebl', 'mtb', 'ibbl', 'scb', 'dhaka bank', 'prime bank'];
  for (const bank of banks) {
    if (lowerText.includes(bank)) {
      bankName = bank.toUpperCase();
      break;
    }
  }

  // Calculate confidence based on extracted fields
  let fieldsFound = 1; // Amount found
  if (balance !== null) fieldsFound++;
  if (accountNumber !== null) fieldsFound++;
  if (bankName !== null) fieldsFound++;

  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (fieldsFound >= 3) confidence = 'high';
  else if (fieldsFound === 2) confidence = 'medium';

  return {
    type,
    amount,
    accountNumber,
    balance,
    bankName,
    referenceNumber: null, // Harder to reliably extract without specific bank format knowledge
    rawMessage: smsBody,
    parsedAt: new Date(),
    confidence
  };
}

/**
 * Sets up a listener for incoming SMS on Android.
 * Note: Requires `react-native-sms` or similar native module.
 * 
 * @param callback - Function to execute when a parsed transaction is found.
 * @returns A cleanup function to remove the listener.
 */
export function setupSMSListener(callback: (transaction: ParsedSMSTransaction) => void): () => void {
  // Mock implementation for the native listener requirement.
  // In a real Expo/RN project, this would use a NativeEventEmitter or specific library.
  
  console.log('setupSMSListener: Setting up native listener (Requires react-native-sms on Android)');
  
  // If running on iOS or without native module linked, log warning
  // if (Platform.OS === 'ios') {
  //   console.warn('SMS listening is not supported on iOS.');
  //   return () => {};
  // }
  
  // Dummy event listener attachment
  // const subscription = SMSModule.addListener('onSMSReceived', (message) => {
  //   const parsed = parseBankSMS(message.body);
  //   if (parsed) callback(parsed);
  // });

  return () => {
    // subscription.remove();
    console.log('setupSMSListener: Removed listener');
  };
}
