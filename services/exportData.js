import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as XLSX from 'xlsx';

export const exportToPDF = async (orders) => {
  try {
    const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .header { text-align: center; margin-bottom: 20px; }
            .total { margin-top: 20px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Expense Tracker Report</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Realtor Name</th>
                <th>Address</th>
                <th>Charge Amount</th>
                <th>Editor Payment</th>
                <th>Delivery Date</th>
                <th>Email</th>
                <th>Contact</th>
              </tr>
            </thead>
            <tbody>
              ${orders.map(order => `
                <tr>
                  <td>${order.realtorName}</td>
                  <td>${order.address}</td>
                  <td>₹${order.chargeAmount}</td>
                  <td>₹${order.editorPayment}</td>
                  <td>${order.deliveryDate}</td>
                  <td>${order.email}</td>
                  <td>${order.contactNo}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total">
            <p>Total Charge Amount: ₹${orders.reduce((sum, order) => sum + order.chargeAmount, 0)}</p>
            <p>Total Editor Payment: ₹${orders.reduce((sum, order) => sum + order.editorPayment, 0)}</p>
            <p>Net Profit: ₹${orders.reduce((sum, order) => sum + (order.chargeAmount - order.editorPayment), 0)}</p>
          </div>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri);
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw error;
  }
};

export const exportToExcel = async (orders) => {
  try {
    const ws = XLSX.utils.json_to_sheet(orders.map(order => ({
      'Realtor Name': order.realtorName,
      'Address': order.address,
      'Charge Amount': order.chargeAmount,
      'Editor Payment': order.editorPayment,
      'Delivery Date': order.deliveryDate,
      'Email': order.email,
      'Contact': order.contactNo,
    })));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Orders');

    const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
    const uri = `${FileSystem.documentDirectory}orders.xlsx`;
    
    await FileSystem.writeAsStringAsync(uri, wbout, {
      encoding: FileSystem.EncodingType.Base64,
    });

    await Sharing.shareAsync(uri);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw error;
  }
};
