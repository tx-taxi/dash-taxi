 'use strict';
// Aggregate only the node-observed sample; never infer next-block membership.
function pendingSummary(transactions) {
 if (!transactions.length) return [];
 const bytes = transactions.reduce((sum, tx) => sum + tx.size, 0);
 const completeFees = transactions.every(tx => Number.isFinite(tx.fee) && tx.fee >= 0 && tx.size > 0);
 const rates = completeFees ? transactions.map(tx => tx.fee / tx.size).sort((a,b) => a-b) : [];
 const middle = Math.floor(rates.length / 2);
 return [{blockSize:bytes, blockVSize:bytes, nTx:transactions.length,
  totalFees:completeFees ? transactions.reduce((sum,tx) => sum + tx.fee, 0) : null,
  medianFee:completeFees ? (rates.length % 2 ? rates[middle] : (rates[middle-1]+rates[middle])/2) : null,
  feeRange:completeFees ? [rates[0],rates.at(-1)] : [],
  transactionIds:transactions.map(tx => tx.txid)}];
}
module.exports = {pendingSummary};
