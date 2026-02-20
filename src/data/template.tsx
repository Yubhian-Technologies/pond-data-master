import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/pages/firebase";

import ADC from "@/assets/ADC.jpg";
import AV from "@/assets/AV.jpg";
import html2canvas from "html2canvas"; // ← added
import { saveAs } from "file-saver"; // ← added

interface TestItem {
  name: string;
  quantity: number;
  price: number;   // original price INCLUDING GST
  total: number;   // original total INCLUDING GST (not used directly)
}

interface InvoiceState {
  invoiceId: string;
  farmerName: string;
  formattedDate: string;
  village: string;
  mobile: string;
  tests: {
    [type: string]: TestItem[];
  };
  subtotal: number;             // original subtotal INCLUDING GST
  discountPercent?: number;
  discountAmount?: number;      // discount on original incl-GST subtotal
  total: number;                // original grand total incl GST (before discount)
  paymentMode: "cash" | "qr" | "neft" | "rtgs" | "pending";
  transactionRef?: string | null;
  isPartialPayment?: boolean;
  paidAmount?: number | null;
  balanceAmount?: number;
  isZeroInvoice?: boolean;
}

interface InvoiceTemplateProps {
  state: InvoiceState | null;
  locationId: string;
}

const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ state, locationId }) => {
  const navigate = useNavigate();

  const [locationDetails, setLocationDetails] = useState({
    address: "Still loading...",
    phone: "...",
    email: "...",
    isLoading: true,
  });

  useEffect(() => {
    console.log("useEffect running → locationId =", locationId);

    if (!locationId) {
      console.log("No locationId → stopping");
      setLocationDetails(prev => ({ ...prev, isLoading: false }));
      return;
    }

    const fetchLocation = async () => {
      try {
        console.log("Starting Firestore fetch for", locationId);
        const locRef = doc(db, "locations", locationId);
        const locSnap = await getDoc(locRef);

        if (locSnap.exists()) {
          const data = locSnap.data();
          console.log("Firestore success → data:", data);
          setLocationDetails({
            address: data?.address || "No address in DB",
            phone: data?.contactNumber || data?.phone || "No phone",
            email: data?.email || "No email",
            isLoading: false,
          });
        } else {
          console.log("Document does NOT exist for", locationId);
          setLocationDetails({
            address: "Location ID not found in database",
            phone: "—",
            email: "—",
            isLoading: false,
          });
        }
      } catch (err) {
        console.error("Firestore fetch failed:", err);
        setLocationDetails({
          address: "Error: " + (err.message || "Check console"),
          phone: "—",
          email: "—",
          isLoading: false,
        });
      }
    };

    fetchLocation();
  }, [locationId]);

  // Loading guard
  if (locationDetails.isLoading || !state) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-blue-600 mb-4">
            Loading Invoice...
          </h2>
          <p className="text-gray-600">
            Please wait while we fetch the location and invoice details.
          </p>
        </div>
      </div>
    );
  }

  const isZeroInvoice = state.isZeroInvoice ?? false;

  const getFinancialYear = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    return month >= 4 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
  };

  const financialYear = getFinancialYear();

  const originalSubtotalInclGst = state.subtotal;
  const discountPercent = state.discountPercent || 0;
  const discountAmountInclGst = state.discountAmount || 0;

  const subtotalExGst = originalSubtotalInclGst / 1.18;
  const gstAmount = originalSubtotalInclGst - subtotalExGst;

  const subtotalPlusGst = subtotalExGst + gstAmount;

  const grandTotalAfterDiscount = subtotalPlusGst - discountAmountInclGst;

  const displaySubtotalExGst = isZeroInvoice ? 0 : subtotalExGst;
  const displayGstAmount = isZeroInvoice ? 0 : gstAmount;
  const displayDiscountAmount = isZeroInvoice ? 0 : discountAmountInclGst;
  const displayGrandTotal = isZeroInvoice ? 0 : grandTotalAfterDiscount;

  const numberToWords = (num: number): string => {
    const a = [
      "", "One", "Two", "Three", "Four", "Five", "Six", "Seven",
      "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen",
      "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
    ];
    const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    if (num === 0) return "Zero Rupees Only";

    const inWords = (n: number): string => {
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
    let n = integerPart;
    const crore = Math.floor(n / 10000000); n %= 10000000;
    const lakh = Math.floor(n / 100000); n %= 100000;
    const thousand = Math.floor(n / 1000); n %= 1000;

    let result = "";
    if (crore) result += inWords(crore) + " Crore ";
    if (lakh) result += inWords(lakh) + " Lakh ";
    if (thousand) result += inWords(thousand) + " Thousand ";
    if (n) result += inWords(n) + " ";
    result = result.trim() || "Zero";
    result += " Rupees";

    return result + " Only";
  };

  const getPaymentModeLabel = (mode: InvoiceState["paymentMode"]) => {
    switch (mode) {
      case "cash": return "CASH";
      case "qr": return "QR SCAN / UPI";
      case "neft": return "NEFT";
      case "rtgs": return "RTGS";
      case "pending": return "PENDING";
      default: return mode;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJpeg = async () => {
    const element = document.getElementById("printable-invoice");
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2, // better quality
        useCORS: true, // for external images (logos)
        logging: false,
      });

      canvas.toBlob((blob) => {
        if (blob) {
          saveAs(blob, `Invoice_${state.invoiceId}.jpg`);
        }
      });
    } catch (err) {
      console.error("Failed to generate JPEG:", err);
      alert("Could not download invoice as image. Please try Print instead.");
    }
  };

  return (
    <>
      <div className="mb-6 print:hidden flex justify-end gap-4 px-4">
        <button
          onClick={() => navigate('/samples')}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium"
        >
          ← Back
        </button>
        <button
          onClick={handlePrint}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
        >
          Print Invoice
        </button>
        <button
          onClick={handleDownloadJpeg}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium"
        >
          Download JPEG
        </button>
      </div>

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
        <header className="flex items-center justify-between border-b pb-4">
          <img src={ADC} alt="ADC Logo" style={{ width: "100px" }} />
          <div className="text-center">
            <h2 style={{ fontSize: "18px", fontWeight: "bold" }}>
              వాటర్బేస్ ఆక్వా డయాగ్నస్టిక్ సెంటర్
            </h2>
            <h3 style={{ fontSize: "16px", fontWeight: "600" }}>
              WATERBASE AQUA DIAGNOSTIC CENTER
            </h3>
            <p style={{ fontSize: "12px" }}>
              {locationDetails.address}<br />
              Phone: {locationDetails.phone} | E-mail: {locationDetails.email}
            </p>
            <p className="text-sm text-black">
              GSTIN: - 37AABCT0601L1ZJ
            </p>
          </div>
          <img src={AV} alt="TWL Logo" style={{ width: "80px" }} />
        </header>

        <section
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "10px",
            borderBottom: "1px solid #000",
            paddingBottom: "5px",
          }}
        >
          <p style={{ fontWeight: "bold" }}>TWL ADC {financialYear}</p>
          <p style={{ fontWeight: "bold" }}>INVOICE NO: {state.invoiceId}</p>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "4px",
            fontSize: "12px",
            marginTop: "10px",
            borderBottom: "1px solid #000",
            paddingBottom: "5px",
          }}
        >
          <p><strong>Farmer Name :</strong> {state.farmerName}</p>
          <p><strong>Date :</strong> {state.formattedDate}</p>
          <p><strong>Village / City :</strong> {state.village}</p>
          <p><strong>Mobile No :</strong> {state.mobile}</p>
          <p><strong>No of Sample Types :</strong> {Object.keys(state.tests).length}</p>
        </section>

        {Object.entries(state.tests).map(([type, items]) => (
          <section key={type} style={{ marginTop: "15px", pageBreakInside: "avoid" }}>
            <h3
              style={{
                fontWeight: "600",
                textAlign: "center",
                background: "#f0f0f0",
                padding: "4px",
                fontSize: "13px",
                textTransform: "uppercase",
              }}
            >
              {type === "pl" ? "PL" : type === "pcr" ? "PCR" : type.toUpperCase()} ANALYSIS
            </h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr>
                  <th style={{ border: "1px solid #000", padding: "4px" }}>S. No.</th>
                  <th style={{ border: "1px solid #000", padding: "4px" }}>Descriptions</th>
                  <th style={{ border: "1px solid #000", padding: "4px" }}>No. of samples</th>
                  <th style={{ border: "1px solid #000", padding: "4px" }}>Unit Price (₹)</th>
                  <th style={{ border: "1px solid #000", padding: "4px" }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const unitPriceExGst = item.price / 1.18;
                  const rowAmountExGst = item.quantity * unitPriceExGst;

                  return (
                    <tr key={idx}>
                      <td style={{ border: "1px solid #000", padding: "4px", textAlign: "center" }}>
                        {idx + 1}
                      </td>
                      <td style={{ border: "1px solid #000", padding: "4px" }}>{item.name}</td>
                      <td style={{ border: "1px solid #000", padding: "4px", textAlign: "center" }}>
                        {item.quantity}
                      </td>
                      <td style={{ border: "1px solid #000", padding: "4px", textAlign: "center" }}>
                        {unitPriceExGst.toFixed(2)}
                      </td>
                      <td style={{ border: "1px solid #000", padding: "4px", textAlign: "center" }}>
                        {rowAmountExGst.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        ))}

        <section style={{ marginTop: "20px", pageBreakInside: "avoid" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <tbody>
              <tr>
                <td style={{ border: "1px solid #000", padding: "6px", fontWeight: "600" }}>
                  Subtotal (excl. GST) (₹)
                </td>
                <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>
                  ₹{displaySubtotalExGst.toFixed(2)}
                </td>
              </tr>

              <tr>
                <td style={{ border: "1px solid #000", padding: "6px", fontWeight: "600" }}>
                  GST @ 18% (₹)
                </td>
                <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>
                  ₹{displayGstAmount.toFixed(2)}
                </td>
              </tr>

              <tr>
                <td style={{ border: "1px solid #000", padding: "6px", fontWeight: "600" }}>
                  Subtotal + GST (₹)
                </td>
                <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>
                  ₹{(displaySubtotalExGst + displayGstAmount).toFixed(2)}
                </td>
              </tr>

              {displayDiscountAmount > 0 && (
                <tr>
                  <td style={{ border: "1px solid #000", padding: "6px", fontWeight: "600" }}>
                    Less: Discount ({discountPercent}%) (₹)
                  </td>
                  <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right", color: "#dc2626" }}>
                    -₹{displayDiscountAmount.toFixed(2)}
                  </td>
                </tr>
              )}

              <tr>
                <td
                  style={{
                    border: "1px solid #000",
                    padding: "6px",
                    fontWeight: "bold",
                    background: "#f0f0f0",
                  }}
                >
                  GRAND TOTAL (incl. GST) (₹)
                </td>
                <td
                  style={{
                    border: "1px solid #000",
                    padding: "6px",
                    textAlign: "right",
                    fontWeight: "bold",
                    background: "#f0f0f0",
                  }}
                >
                  ₹{displayGrandTotal.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>

          <p style={{ marginTop: "12px", fontSize: "12px", fontWeight: "600" }}>
            Amount in Words: <strong>{numberToWords(displayGrandTotal)}</strong>
          </p>

          {!isZeroInvoice && (
            <div
              style={{
                marginTop: "15px",
                display: "flex",
                justifyContent: "space-between",
                fontSize: "12px",
              }}
            >
              <div>
                <p>
                  <strong>Mode of Payment: </strong>
                  {state.paymentMode === "pending" ? (
                    <span style={{ color: "red", fontWeight: "bold", fontSize: "14px" }}>
                      PENDING
                    </span>
                  ) : (
                    getPaymentModeLabel(state.paymentMode)
                  )}
                </p>

                {(state.paymentMode === "qr" || state.paymentMode === "neft" || state.paymentMode === "rtgs") &&
                  state.transactionRef && (
                    <p>
                      <strong>Transaction Ref:</strong> {state.transactionRef}
                    </p>
                  )}
              </div>
              <div style={{ textAlign: "right" }}>
                <p>For Waterbase Aqua Diagnostic Center</p>
                <div style={{ height: "70px" }}></div>
              </div>
            </div>
          )}

          {isZeroInvoice && (
            <div
              style={{
                marginTop: "15px",
                textAlign: "right",
                fontSize: "12px",
              }}
            >
              <p>For Waterbase Aqua Diagnostic Center</p>
              <div style={{ height: "70px" }}></div>
              <p style={{ fontWeight: "600" }}>Authorised Signatory</p>
            </div>
          )}

          {/* Added system-generated note at the very bottom */}
          <div
            style={{
              marginTop: "30px",
              textAlign: "center",
              fontSize: "11px",
              color: "#555",
              fontStyle: "italic",
            }}
          >
            This is a system-generated invoice. No signature is required.
          </div>
        </section>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-invoice, #printable-invoice * { visibility: visible; }
          #printable-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden { display: none !important; }
          @page { size: A4; margin: 0; }
        }
      `}</style>
    </>
  );
};

export default InvoiceTemplate;