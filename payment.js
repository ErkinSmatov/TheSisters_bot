// merchantLogin: 'the_sister',
//     password1: 'PPd0I7ZyShX7B9IOLdl6',
//     password2: 'LLezyfDJfcfCbm12286O',
const crypto = require('crypto');

const merchantLogin = 'the_sisters';
const password1 = 'PPd0I7ZyShX7B9IOLdl6';
const password2 = 'LLezyfDJfcfCbm12286O';
const testMode = 1; // Используем тестовый режим

const createInvoice = ({ userId, amount, description }) => {
  const outSum = amount.toString();
  const invId = userId.toString();
  const crc = crypto.createHash('md5').update(`${merchantLogin}:${outSum}:${invId}:${password1}`).digest('hex');

  const paymentUrl = `https://auth.robokassa.ru/Merchant/Index.aspx?MerchantLogin=${merchantLogin}&OutSum=${outSum}&InvoiceID=${invId}&Description=${description}&SignatureValue=${crc}&IsTest=${testMode}`;
  
  return { paymentUrl };
};

const verifyPayment = (params) => {
  const { OutSum, InvId, SignatureValue } = params;
  const calculatedCrc = crypto.createHash('md5').update(`${OutSum}:${InvId}:${password2}`).digest('hex').toUpperCase();

  return calculatedCrc === SignatureValue.toUpperCase();
};

module.exports = { createInvoice, verifyPayment };
