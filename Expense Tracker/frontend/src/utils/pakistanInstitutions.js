/**
 * Catalog of major Pakistani Banks, Digital Wallets, and Default Starter Accounts
 */

export const PAKISTAN_BANKS = [
  { id: 'ubl', name: 'UBL (United Bank Limited)', shortName: 'UBL', color: '#005BAC', network: 'VISA' },
  { id: 'hbl', name: 'HBL (Habib Bank Limited)', shortName: 'HBL', color: '#008450', network: 'VISA' },
  { id: 'meezan', name: 'Meezan Bank', shortName: 'Meezan', color: '#157347', network: 'PayPak' },
  { id: 'mcb', name: 'MCB Bank Limited', shortName: 'MCB', color: '#E67E22', network: 'Mastercard' },
  { id: 'abl', name: 'Allied Bank Limited (ABL)', shortName: 'ABL', color: '#004B87', network: 'PayPak' },
  { id: 'alfalah', name: 'Bank Alfalah', shortName: 'Alfalah', color: '#C41230', network: 'VISA' },
  { id: 'scb', name: 'Standard Chartered Pakistan', shortName: 'SCB', color: '#008037', network: 'VISA' },
  { id: 'askari', name: 'Askari Bank', shortName: 'Askari', color: '#003865', network: 'Mastercard' },
  { id: 'faysal', name: 'Faysal Bank', shortName: 'Faysal', color: '#8A1538', network: 'PayPak' },
  { id: 'bop', name: 'Bank of Punjab (BOP)', shortName: 'BOP', color: '#D97706', network: 'Mastercard' },
  { id: 'soneri', name: 'Soneri Bank', shortName: 'Soneri', color: '#D9381E', network: 'VISA' },
  { id: 'js', name: 'JS Bank', shortName: 'JS Bank', color: '#004880', network: 'VISA' },
  { id: 'dib', name: 'Dubai Islamic Bank', shortName: 'DIB', color: '#8B6F47', network: 'VISA' },
  { id: 'hmb', name: 'Habib Metropolitan Bank', shortName: 'HabibMetro', color: '#005A36', network: 'VISA' },
  { id: 'custom_bank', name: 'Other Bank (Custom Manual Entry)', shortName: 'Other Bank', color: '#4A3B32', network: 'VISA' },
];

export const PAKISTAN_WALLETS = [
  { id: 'nayapay', name: 'NayaPay', shortName: 'NayaPay', color: '#FF6B00', network: 'VISA' },
  { id: 'sadapay', name: 'SadaPay', shortName: 'SadaPay', color: '#00A389', network: 'Mastercard' },
  { id: 'jazzcash', name: 'JazzCash', shortName: 'JazzCash', color: '#ED1C24', network: 'Mastercard' },
  { id: 'easypaisa', name: 'Easypaisa', shortName: 'Easypaisa', color: '#00B140', network: 'UnionPay' },
  { id: 'upaisa', name: 'UPaisa', shortName: 'UPaisa', color: '#F7941D', network: 'PayPak' },
  { id: 'zindigi', name: 'Zindigi (JS Bank)', shortName: 'Zindigi', color: '#7B2CBF', network: 'Mastercard' },
  { id: 'raast', name: 'Raast ID', shortName: 'Raast', color: '#2E7D32', network: 'Raast' },
  { id: 'custom_wallet', name: 'Other Wallet (Custom Manual Entry)', shortName: 'Other Wallet', color: '#4A3B32', network: 'Wallet' },
];

export const DEFAULT_ACCOUNTS = [];

/**
 * Get visual icon badge text or short initials
 */
export const getAccountBadge = (account) => {
  if (!account) return 'ACC';
  if (account.type === 'wallet') {
    if (account.institutionId === 'nayapay') return 'NP';
    if (account.institutionId === 'sadapay') return 'SP';
    if (account.institutionId === 'jazzcash') return 'JC';
    if (account.institutionId === 'easypaisa') return 'EP';
    if (account.institutionId === 'upaisa') return 'UP';
    if (account.institutionId === 'zindigi') return 'ZD';
    if (account.institutionId === 'raast') return 'RT';
    return 'W';
  }
  // Banks
  if (account.name) {
    const letters = account.name.replace(/[^A-Za-z]/g, '');
    return letters.slice(0, 3).toUpperCase() || 'BNK';
  }
  return 'BNK';
};
