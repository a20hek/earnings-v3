const PublicGoogleSheetsParser = require('public-google-sheets-parser');

// 1. You can pass spreadsheetId when parser instantiation
const getData = async (spreadsheetId: string, sheet_name: string) => {
  const parser = new PublicGoogleSheetsParser(spreadsheetId);
  let output = await parser.parse(spreadsheetId, sheet_name);
  return output;
};

export async function generate() {
  let [graph_req, sheet_req] = await Promise.all([
    getData('1q_QRNrcFAcmKpepck3DWA4jACt-jl6a7q3mPEvh6mis', 'Sheet1'),
    getData('1I6EEV3RTTPTI5ugX3IWvkjx39pjSym9tk4DBeoXyGys', 'Bounties Paid'),
  ]);
  let graphData = JSON.parse(graph_req[0].value);
  let sheetData = sheet_req;

  let totalEarning = 0;

  // Combine prize data
  sheetData = sheetData.map((elm: any) => {
    elm['Date Given'] = `${elm['Date Given']}`
      .replaceAll('Date', '')
      .replaceAll('(', '')
      .replaceAll(')', '');

    elm['Date Given'] = `${parseInt(elm['Date Given'].split(',')[1]) + 1}/${
      elm['Date Given'].split(',')[2]
    }/${elm['Date Given'].split(',')[0]}`;

    let first = elm['1st Prize'] ? parseInt(elm['1st Prize']) : 0;
    let second = elm['2nd Prize'] ? parseInt(elm['2nd Prize']) : 0;
    let third = elm['3rd Prize'] ? parseInt(elm['3rd Prize']) : 0;

    totalEarning =
      totalEarning +
      (elm['Total Earnings USD'] ? parseInt(elm['Total Earnings USD']) : 0);

    elm.totalTokens = first + second + third;
    return elm;
  });

  // generate Rainmake list
  let rainmakers: any = genList(sheetData, 'Rainmaker');

  // generate Sponsor list
  let sponsors: any = genList(sheetData, 'Sponsor');

  return {
    graphData,
    sheetData: false || sheetData.reverse(),
    rainmakers,
    sponsors,
    totalEarning,
  };
}

const genList = (sheetData: any, key: any) => {
  let rainMakers: { Name: string; USD: number }[] = [];

  sheetData.forEach((elm: any) => {
    let USD = elm['Total Earnings USD']
      ? parseInt(elm['Total Earnings USD'])
      : 0;
    let Name = elm[key] || 'Unknown';

    let index = rainMakers.findIndex((rm) => rm.Name === Name);
    if (index === -1) {
      rainMakers.push({ Name, USD });
    } else {
      rainMakers[index].USD += USD;
    }
    rainMakers.sort((a, b) => b.USD - a.USD);
  });
  return rainMakers;
};

export default async function handler(req: any, res: any) {
  let data = await generate();
  res.status(200).json(data);
}
