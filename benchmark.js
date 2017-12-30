const kokua = require('./lib/kokua');
const log   = require('metalogger')();
const fh    = require('./test/helpers/fixture-helper');

async function run() {
  let start, end, elapsed;

  const hyperHAL = await fh.loadFixture("hal-hyper.json");
  const hyperSiren = await fh.loadFixture("siren-hyper.json");

  start = new Date().getTime();
  for (let i=0; i<10000; i++) {
    kokua(hyperHAL, kokua.mt('hal'));
  }
  end = new Date().getTime();
  elapsed = (end-start)/1000;
  console.log(`Time to convert HAL 10,000 times:  ${elapsed} ms`);

  start = new Date().getTime();
  for (let i=0; i<10000; i++) {
    kokua(hyperSiren, kokua.mt('hal'));
  }
  end = new Date().getTime();
  elapsed = (end-start)/1000;
  console.log(`Time to convert Siren 10,000 times:  ${elapsed} ms`);
}

run();
