
const SPREADSHEET_ID = '1uc-scY7p5JiVi3z2SMXC3imE7PDW2AXrqUT_Jz2iALU';

export async function appendLeadToSheet(accessToken: string, leadData: any) {
  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Page1!A:E:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [[
            leadData.timestamp || new Date().toISOString(),
            leadData.intent || 'Unknown',
            leadData.message || 'No message',
            leadData.distributorId || 'Direct',
            leadData.status || 'new',
            leadData.country || 'Unknown'
          ]],
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Sheets API Error:', errorData);
      throw new Error(`Failed to append to sheet: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error appending lead to sheet:', error);
    throw error;
  }
}

export async function getSheetData(accessToken: string, range: string = 'Page1!A1:Z100') {
  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch sheet data: ${response.statusText}`);
    }

    const data = await response.json();
    return data.values;
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    throw error;
  }
}
