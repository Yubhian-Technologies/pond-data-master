import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ADC from "@/assets/ADC.jpg";
import AV from "@/assets/AV.jpg";

interface TestItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface InvoiceState {
  farmerName: string;
  formattedDate: string;
  village: string;
  mobile: string;
  tests: {
    [type: string]: TestItem[];
  };
  total: number;
  paymentMode: "cash" | "qr" | "neft";
}

interface InvoiceTemplateProps {
  state?: InvoiceState;
}

const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ state: propsState }) => {
  const location = useLocation();
  const state = propsState ?? (location.state as InvoiceState);
  const Navigate=useNavigate();

  if (!state) return <p>No invoice data available</p>;

  const numberToWords = (num: number): string => {
    const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven",
      "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen",
      "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    if (num === 0) return "Zero Rupees Only";

    const inWords = (n: number) => {
      let str = "";
      if (n > 99) {
        str += a[Math.floor(n / 100)] + " Hundred ";
        n %= 100;
      }
      if (n > 19) {
        str += b[Math.floor(n / 10)] + " ";
        n %= 10;
      }
      if (n > 0) str += a[n] + " ";
      return str.trim();
    };

    const integerPart = Math.floor(num);
    const decimalPart = Math.round((num - integerPart) * 100);
    let n = integerPart;
    const crore = Math.floor(n / 10000000); n %= 10000000;
    const lakh = Math.floor(n / 100000); n %= 100000;
    const thousand = Math.floor(n / 1000); n %= 1000;

    let result = "";
    if (crore) result += inWords(crore) + " Crore ";
    if (lakh) result += inWords(lakh) + " Lakh ";
    if (thousand) result += inWords(thousand) + " Thousand ";
    if (n) result += inWords(n) + " ";
    result = result.trim() + " Rupees";

    if (decimalPart) {
      result += " and " + inWords(decimalPart) + " Paise";
    }

    return result + " Only";
  };

  const tick = (mode: "cash" | "qr" | "neft") => (state.paymentMode === mode ? "☑" : "☐");

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Buttons - visible on screen, hidden when printing */}
      <div className="mb-6 print:hidden flex justify-end gap-4 px-4">
        <button
          onClick={() => Navigate('/samples')}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium"
        >
          ← Back
        </button>
        <button
          onClick={handlePrint}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
        >
          🖨️ Print Invoice
        </button>
      </div>

      {/* Printable Invoice - ONLY this part will print */}
      <div
        id="printable-invoice"
        className="bg-white mx-auto"
        style={{
          width: "210mm",
          minHeight: "297mm",
          padding: "20mm",
          boxSizing: "border-box",
          fontFamily: "Arial, sans-serif",
          color: "#000",
          background: "#fff",
        }}
      >
        {/* HEADER */}
        <header className="flex items-center justify-between border-b pb-4">
          <img src={ADC} alt="ADC Logo" style={{ width: "100px" }} />
          <div className="text-center">
            <h2 style={{ fontSize: "18px", fontWeight: "bold" }}>వాటర్‌బేస్ ఆక్వా డయాగ్నస్టిక్ సెంటర్</h2>
            <h3 style={{ fontSize: "16px", fontWeight: "600" }}>WATERBASE AQUA DIAGNOSTIC CENTER</h3>
            <p style={{ fontSize: "12px" }}>
              # Flat No:1B, Sriravi Plaza, Ramalingapuram, Nellore - 524 003, Andhra Pradesh<br />
              Phone: +91 76088 88001 | E-mail: adcl@waterbaseindia.com
            </p>
          </div>
          <img src={AV} alt="TWL Logo" style={{ width: "80px" }} />
        </header>

        {/* INVOICE META */}
        <section style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", borderBottom: "1px solid #000", paddingBottom: "5px" }}>
          <p style={{ fontWeight: "bold" }}>TWL ADC BVRM 202 / 202</p>
          <p style={{ fontWeight: "bold" }}>INVOICE NO: ADCBVRM</p>
        </section>

        {/* FARMER DETAILS */}
        <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", fontSize: "12px", marginTop: "10px", borderBottom: "1px solid #000", paddingBottom: "5px" }}>
          <p><strong>Farmer Name :</strong> {state.farmerName}</p>
          <p><strong>Date :</strong> {state.formattedDate}</p>
          <p><strong>Village / City :</strong> {state.village}</p>
          <p><strong>Mobile No :</strong> {state.mobile}</p>
          <p><strong>No of Sample Types :</strong> {Object.keys(state.tests).length}</p>
        </section>

        {/* DYNAMIC TEST TABLES */}
        {Object.entries(state.tests).map(([type, items]) => (
          <section key={type} style={{ marginTop: "15px", pageBreakInside: "avoid" }}>
            <h3 style={{ fontWeight: "600", textAlign: "center", background: "#f0f0f0", padding: "2px", fontSize: "12px", textTransform: "uppercase" }}>
              {type} ANALYSIS
            </h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr>
                  <th style={{ border: "1px solid #000", padding: "2px" }}>S. No.</th>
                  <th style={{ border: "1px solid #000", padding: "2px" }}>Descriptions</th>
                  <th style={{ border: "1px solid #000", padding: "2px" }}>No. of samples</th>
                  <th style={{ border: "1px solid #000", padding: "2px" }}>Unit Price (₹)</th>
                  <th style={{ border: "1px solid #000", padding: "2px" }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ border: "1px solid #000", padding: "2px", textAlign: "center" }}>{idx + 1}</td>
                    <td style={{ border: "1px solid #000", padding: "2px" }}>{item.name}</td>
                    <td style={{ border: "1px solid #000", padding: "2px", textAlign: "center" }}>{item.quantity}</td>
                    <td style={{ border: "1px solid #000", padding: "2px", textAlign: "center" }}>{item.price}</td>
                    <td style={{ border: "1px solid #000", padding: "2px", textAlign: "center" }}>{item.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}

        {/* TOTALS & PAYMENT */}
        <section style={{ marginTop: "15px", pageBreakInside: "avoid" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <tbody>
              <tr>
                <td style={{ border: "1px solid #000", padding: "2px", fontWeight: "600" }}>TOTAL BEFORE TAX (₹)</td>
                <td style={{ border: "1px solid #000", padding: "2px", textAlign: "right" }}>{state.total}</td>
              </tr>
            </tbody>
          </table>

          <div style={{ marginTop: "10px" }}>
            <h4 style={{ fontWeight: "600", fontSize: "12px", marginBottom: "2px" }}>MODE OF PAYMENT</h4>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <tbody>
                <tr>
                  <td style={{ border: "1px solid #000", padding: "2px" }}>CASH {tick("cash")}</td>
                  <td style={{ border: "1px solid #000", padding: "2px" }}>SGST/UGST 9%</td>
                </tr>
                <tr>
                  <td style={{ border: "1px solid #000", padding: "2px" }}>QR SCAN {tick("qr")}</td>
                  <td style={{ border: "1px solid #000", padding: "2px" }}>CGST 9%</td>
                </tr>
                <tr>
                  <td style={{ border: "1px solid #000", padding: "2px" }}>NEFT/RTGS {tick("neft")}</td>
                  <td style={{ border: "1px solid #000", padding: "2px" }}>IGST 18%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p style={{ marginTop: "8px", fontWeight: "600", fontSize: "12px" }}>
            TOTAL AMOUNT (₹): {state.total}
          </p>

          <p style={{ marginTop: "2px", fontSize: "12px" }}>
            <strong>Total in Words:</strong> {numberToWords(state.total)}
          </p>
        </section>

        {/* SIGNATURE */}
        <footer style={{ marginTop: "30px", textAlign: "right", fontSize: "12px", fontWeight: "600" }}>
          <p>Authorised Signature</p>
          <p>For Waterbase Aqua Diagnostic Center</p>
        </footer>
      </div>

      {/* CRITICAL PRINT STYLES - This fixes the blank page issue */}
      <style >{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-invoice,
          #printable-invoice * {
            visibility: visible;
          }
          #printable-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>
    </>
  );
};

export default InvoiceTemplate;