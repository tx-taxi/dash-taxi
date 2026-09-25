'use strict';
// Demonstrated provider mismatch: Insight calculates negative vin-vout fees for type9 withdrawals.
const assert=require('node:assert/strict'),{fee,atomic}=require('./dash-provider.cjs');
const payload='01e337000000000000be00000055d32600826439dac4acedbc5ade65964344b27f699e0f02a531a42f16000000000000008bb76d7a870a49f3facb83918db3b477f5f8db53054d6a00c4a9baa1656d8bc5bd1fd6088e2c5ac5b0d50be2406bae4b1162490cfb133365c280fdc256f6de60f71b515c9b581a2ec17429a895881b82afd7b8afbb56997117efa24964e03ada';
assert.equal(fee({type:9,extraPayload:payload,fees:-7.57361126}),190);
assert.equal(fee({type:9,extraPayload:'',fees:-7.57361126}),null);
assert.equal(atomic(-7.57361126),-757361126);
assert.equal(atomic(0.00000001),1);
console.log('Observed Dash withdrawal fee mismatch and precision checks pass');
