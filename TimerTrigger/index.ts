import { AzureFunction, Context } from "@azure/functions";
import * as httpm from 'typed-rest-client/HttpClient';

const client: httpm.HttpClient = new httpm.HttpClient('alert-batch', [], {
  headers: {
    'content-type': 'application/json',
    'X-Api-Key': process.env.MACKREL_API_KEY
  }
});

const timerTrigger: AzureFunction = async function (context: Context, myTimer: any): Promise<void> {
  await sendCheckedcountToMackerel();
  context.done();
};

const sendCheckedcountToMackerel = async () => {
  const checkedCount = await openAlerts();
  console.log(new Date().toLocaleString(), checkedCount)
  await sendToMackerel(checkedCount)
}


const openAlerts = async (): Promise<number> => {
  const res: httpm.HttpClientResponse = await client.get('https://api.mackerelio.com/api/v0/alerts');
  let body: string = await res.readBody();
  const openAlert = JSON.parse(await body);
  return openAlert.alerts.length;
}

const sendToMackerel = async (checkedCount: number) => {
  const body = JSON.stringify([{ name: "openAlerts", time: Math.floor(new Date().getTime() / 1000), value: checkedCount }])
  await client.post('https://api.mackerelio.com/api/v0/services/app/tsdb', body);
}


export default timerTrigger;
