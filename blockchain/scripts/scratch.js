const hre = require('hardhat');
async function run() {
  const provider = hre.ethers.provider;
  const t1 = await provider.getTransaction('0x69292fead010944eeafbce5fa44d6aa654a15435adfd47932ff593a79458bbea');
  console.log('Service TX block:', t1?.blockNumber);
  const t2 = await provider.getTransaction('0xd5527a39c968a326e2f16fc30f1a4413efa8f841718679028374b599d394074d');
  console.log('Accident TX block:', t2?.blockNumber);
  
  const contract = await hre.ethers.getContractAt('AutoTrust', '0xEAc8314781DDA7cA18Ad30FefCC788c57f6c04F8');
  const reg = (await contract.queryFilter(contract.filters.VehicleRegistered(), 11849545, 11849549)).filter(e=>e.args[0]==='MH04XY5678');
  const srv = (await contract.queryFilter(contract.filters.ServiceAdded(), 11849575, 11849579)).filter(e=>e.args[0]==='MH04XY5678');
  const acc = (await contract.queryFilter(contract.filters.AccidentAdded(), 11849715, 11849719)).filter(e=>e.args[0]==='MH04XY5678');
  const own = (await contract.queryFilter(contract.filters.OwnershipTransferred(), 11849732, 11849736)).filter(e=>e.args[0]==='MH04XY5678');
  
  console.log('Registration:', reg.length ? reg[0].transactionHash : 'Not found');
  console.log('Service:', srv.length ? srv[0].transactionHash : 'Not found');
  console.log('Accident:', acc.length ? acc[0].transactionHash : 'Not found');
  console.log('Ownership:', own.length ? own[0].transactionHash : 'Not found');
}
run();
