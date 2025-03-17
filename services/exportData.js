import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import XLSX from 'xlsx';

export const exportToPDF = async (orders) => {
  const html = `
    <h1>Expense Tracker</h1>
    <table border="1">
      <tr>
        <th>Realtor</th><th>Address</th><th>Charge (₹)</th><th>Editor Pay (₹)</th><th>Delivery Date</th>
      </tr>
      ${orders
        .map(
          (order) => `
        <tr>
          <td>${order.realtorName}</td>
          <td>${order.address}</td>
          <td>${order.charge}</td>
          <td>${order.editorPayment}</td>
          <td>${order.deliveryDate}</td>
        </tr>`
        )
        .join('')}
    </table>
  `;
  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri);
};

export const exportToExcel = async (orders) => {
  const ws = XLSX.utils.json_to_sheet(orders);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Orders');
  const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
  const uri = FileSystem.documentDirectory + 'orders.xlsx';
  await FileSystem.writeAsStringAsync(uri, wbout, {
    encoding: FileSystem.EncodingType.Base64,
  });
  await Sharing.shareAsync(uri);
};
