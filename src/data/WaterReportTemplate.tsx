import React, { useState, useRef } from 'react';
import { Printer, Download, Plus, Trash2 } from 'lucide-react';

const WaterQualityReport = () => {
  const [formData, setFormData] = useState({
    farmerName: '',
    mobile: '',
    sdDoc: '',
    sampleCollectionTime: '',
    farmerUID: '',
    sourceOfWater: '',
    sampleDate: '',
    sampleTime: '',
    farmerAddress: '',
    noOfSamples: '',
    reportDate: '',
    reportTime: ''
  });

  const [ponds, setPonds] = useState([
    {
      id: 1,
      pondNo: '',
      pH: '',
      salinity: '',
      co3: '',
      hco3: '',
      alkalinity: '',
      hardness: '',
      ca: '',
      mg: '',
      na: '',
      k: '',
      totalAmmonia: '',
      unionizedAmmonia: '',
      h2s: '',
      nitrite: '',
      nitrate: '',
      iron: '',
      chlorine: '',
      dissolvedOxygen: '',
      totalDissolvedMatter: ''
    }
  ]);

  const printRef = useRef();

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePondChange = (id, field, value) => {
    setPonds(ponds.map(pond => 
      pond.id === id ? { ...pond, [field]: value } : pond
    ));
  };

  const addPond = () => {
    setPonds([...ponds, {
      id: ponds.length + 1,
      pondNo: '',
      pH: '',
      salinity: '',
      co3: '',
      hco3: '',
      alkalinity: '',
      hardness: '',
      ca: '',
      mg: '',
      na: '',
      k: '',
      totalAmmonia: '',
      unionizedAmmonia: '',
      h2s: '',
      nitrite: '',
      nitrate: '',
      iron: '',
      chlorine: '',
      dissolvedOxygen: '',
      totalDissolvedMatter: ''
    }]);
  };

  const removePond = (id) => {
    if (ponds.length > 1) {
      setPonds(ponds.filter(pond => pond.id !== id));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="print:hidden p-6 bg-white shadow-lg mb-6">
        <h2 className="text-2xl font-bold mb-6 text-blue-800">Water Quality Report - Data Entry</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1">Farmer Name</label>
            <input
              type="text"
              name="farmerName"
              value={formData.farmerName}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mobile</label>
            <input
              type="text"
              name="mobile"
              value={formData.mobile}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">S.D/D.O.C</label>
            <input
              type="text"
              name="sdDoc"
              value={formData.sdDoc}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Sample Collection Time</label>
            <input
              type="text"
              name="sampleCollectionTime"
              value={formData.sampleCollectionTime}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Farmer UID</label>
            <input
              type="text"
              name="farmerUID"
              value={formData.farmerUID}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Source of Water</label>
            <input
              type="text"
              name="sourceOfWater"
              value={formData.sourceOfWater}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Sample Date</label>
            <input
              type="date"
              name="sampleDate"
              value={formData.sampleDate}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Sample Time</label>
            <input
              type="time"
              name="sampleTime"
              value={formData.sampleTime}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Farmer Address</label>
            <input
              type="text"
              name="farmerAddress"
              value={formData.farmerAddress}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">No. of Samples</label>
            <input
              type="text"
              name="noOfSamples"
              value={formData.noOfSamples}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Report Date</label>
            <input
              type="date"
              name="reportDate"
              value={formData.reportDate}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Report Time</label>
            <input
              type="time"
              name="reportTime"
              value={formData.reportTime}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
        </div>

        <h3 className="text-xl font-bold mb-4 text-blue-700">Water Analysis Data</h3>
        
        {ponds.map((pond, index) => (
          <div key={pond.id} className="mb-6 p-4 border border-gray-300 rounded bg-gray-50">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-semibold text-lg">Pond #{index + 1}</h4>
              {ponds.length > 1 && (
                <button
                  onClick={() => removePond(pond.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 size={20} />
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Pond No.</label>
                <input
                  type="text"
                  value={pond.pondNo}
                  onChange={(e) => handlePondChange(pond.id, 'pondNo', e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">pH</label>
                <input
                  type="text"
                  value={pond.pH}
                  onChange={(e) => handlePondChange(pond.id, 'pH', e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Salinity (PPT)</label>
                <input
                  type="text"
                  value={pond.salinity}
                  onChange={(e) => handlePondChange(pond.id, 'salinity', e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">CO₃</label>
                <input
                  type="text"
                  value={pond.co3}
                  onChange={(e) => handlePondChange(pond.id, 'co3', e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">HCO₃</label>
                <input
                  type="text"
                  value={pond.hco3}
                  onChange={(e) => handlePondChange(pond.id, 'hco3', e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Alkalinity</label>
                <input
                  type="text"
                  value={pond.alkalinity}
                  onChange={(e) => handlePondChange(pond.id, 'alkalinity', e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Hardness</label>
                <input
                  type="text"
                  value={pond.hardness}
                  onChange={(e) => handlePondChange(pond.id, 'hardness', e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Ca⁺⁺</label>
                <input
                  type="text"
                  value={pond.ca}
                  onChange={(e) => handlePondChange(pond.id, 'ca', e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Mg⁺⁺</label>
                <input
                  type="text"
                  value={pond.mg}
                  onChange={(e) => handlePondChange(pond.id, 'mg', e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Na⁺</label>
                <input
                  type="text"
                  value={pond.na}
                  onChange={(e) => handlePondChange(pond.id, 'na', e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">K⁺</label>
                <input
                  type="text"
                  value={pond.k}
                  onChange={(e) => handlePondChange(pond.id, 'k', e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Total Ammonia</label>
                <input
                  type="text"
                  value={pond.totalAmmonia}
                  onChange={(e) => handlePondChange(pond.id, 'totalAmmonia', e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Unionized Ammonia</label>
                <input
                  type="text"
                  value={pond.unionizedAmmonia}
                  onChange={(e) => handlePondChange(pond.id, 'unionizedAmmonia', e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">H₂S (ppm)</label>
                <input
                  type="text"
                  value={pond.h2s}
                  onChange={(e) => handlePondChange(pond.id, 'h2s', e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Nitrite NO₂</label>
                <input
                  type="text"
                  value={pond.nitrite}
                  onChange={(e) => handlePondChange(pond.id, 'nitrite', e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Nitrate NO₃</label>
                <input
                  type="text"
                  value={pond.nitrate}
                  onChange={(e) => handlePondChange(pond.id, 'nitrate', e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Iron (Fe)</label>
                <input
                  type="text"
                  value={pond.iron}
                  onChange={(e) => handlePondChange(pond.id, 'iron', e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Chlorine</label>
                <input
                  type="text"
                  value={pond.chlorine}
                  onChange={(e) => handlePondChange(pond.id, 'chlorine', e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">DO (ppm)</label>
                <input
                  type="text"
                  value={pond.dissolvedOxygen}
                  onChange={(e) => handlePondChange(pond.id, 'dissolvedOxygen', e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">TDM (ppm)</label>
                <input
                  type="text"
                  value={pond.totalDissolvedMatter}
                  onChange={(e) => handlePondChange(pond.id, 'totalDissolvedMatter', e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>
            </div>
          </div>
        ))}

        <div className="flex gap-4">
          <button
            onClick={addPond}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            <Plus size={20} /> Add Pond
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            <Printer size={20} /> Print Report
          </button>
        </div>
      </div>

      <div ref={printRef} className="bg-white p-8 max-w-[1400px] mx-auto print:p-4">
                  <div className="flex justify-between items-start mb-4 border-b-2 border-black pb-4">
          <div className="flex items-center gap-4">
            <div className="w-32 h-24">
              <svg viewBox="0 0 120 80" className="w-full h-full">
                <text x="10" y="35" fill="black" fontSize="48" fontWeight="bold" fontFamily="Arial">A</text>
                <text x="40" y="35" fill="black" fontSize="48" fontWeight="bold" fontFamily="Arial">D</text>
                <text x="70" y="35" fill="black" fontSize="48" fontWeight="bold" fontFamily="Arial">C</text>
                <text x="5" y="55" fill="#333" fontSize="10" fontFamily="Arial">Aqua Diagnostic Centre</text>
              </svg>
            </div>
          </div>
          
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold mb-2">వాటర్‌బేస్ ఆక్వా డయాగ్నోస్టిక్ సెంటర్</h1>
            <p className="text-sm text-black">అదినారాష్ట్ర విజిని., కోటబాల్ కాంప్లెక్స., బిల్బర్స్ టౌజ్నపైట్ వదునుగా., జూబానాఫాహరీల</p>
            <p className="text-sm text-black">Contact No- 7286898936, Mail Id:- adc5@waterbaseindia.com</p>
            <h2 className="text-2xl font-bold mt-2">Water Quality Report</h2>
          </div>
          
          <div className="w-32 h-24">
            <svg viewBox="0 0 120 80" className="w-full h-full">
              <polygon points="20,20 50,10 80,20 90,50 80,70 50,80 20,70 10,50" fill="white" stroke="black" strokeWidth="2" />
              <text x="35" y="50" fill="black" fontSize="24" fontWeight="bold" fontFamily="Arial">WB</text>
            </svg>
          </div>
        </div>

        <div className="text-right mb-2">
          <span className="font-bold">Report Id:-</span>
        </div>

        <div className="grid grid-cols-6 gap-0 text-sm mb-4 border border-black">
          <div className="col-span-1 border-r border-black p-1 font-semibold bg-gray-100">Farmer Name</div>
          <div className="col-span-2 border-r border-black p-1">{formData.farmerName}</div>
          <div className="col-span-1 border-r border-black p-1 font-semibold bg-gray-100">Mobile</div>
          <div className="col-span-1 border-r border-black p-1">{formData.mobile}</div>
          <div className="col-span-1 p-1"><span className="font-semibold">S.D/D.O.C:</span> {formData.sdDoc}</div>
          
          <div className="col-span-1 border-r border-t border-black p-1 font-semibold bg-gray-100">Farmer UID</div>
          <div className="col-span-2 border-r border-t border-black p-1">{formData.farmerUID}</div>
          <div className="col-span-1 border-r border-t border-black p-1 font-semibold bg-gray-100">Source of Water</div>
          <div className="col-span-1 border-r border-t border-black p-1">{formData.sourceOfWater}</div>
          <div className="col-span-1 border-t border-black p-1"><span className="font-semibold">Sample Date:</span> {formData.sampleDate}</div>
          
          <div className="col-span-1 border-r border-t border-black p-1 font-semibold bg-gray-100">Farmer Address</div>
          <div className="col-span-2 border-r border-t border-black p-1">{formData.farmerAddress}</div>
          <div className="col-span-1 border-r border-t border-black p-1 font-semibold bg-gray-100">No.of Samples</div>
          <div className="col-span-1 border-r border-t border-black p-1">{formData.noOfSamples}</div>
          <div className="col-span-1 border-t border-black p-1"><span className="font-semibold">Report Date:</span> {formData.reportDate}</div>
        </div>

        <div className="mb-4">
          <h3 className="text-center font-bold bg-white text-black py-1 text-sm border border-black">WATER ANALYSIS</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-black text-xs">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-black p-1" rowSpan={2}>Pond No.</th>
                  <th className="border border-black p-1" rowSpan={2}>pH</th>
                  <th className="border border-black p-1" rowSpan={2}>Salinity (PPT)</th>
                  <th className="border border-black p-1" colSpan={2}>Alkalinity (PPM as CaCO₃)</th>
                  <th className="border border-black p-1" rowSpan={2}>Total Alkalinity</th>
                  <th className="border border-black p-1" rowSpan={2}>Hardness (ppm as CaCO₃)</th>
                  <th className="border border-black p-1" colSpan={4}>Minerals (ppm)</th>
                  <th className="border border-black p-1" rowSpan={2}>Total Ammonia NH₃(ppm)</th>
                  <th className="border border-black p-1" rowSpan={2}>Unionized Ammonia NH3(ppm)</th>
                  <th className="border border-black p-1" rowSpan={2}>Hydrogen Sulfide H2S(ppm)</th>
                  <th className="border border-black p-1" rowSpan={2}>Nitrite NO₂ (ppm)</th>
                  <th className="border border-black p-1" rowSpan={2}>Nitrate NO₃ (ppm)</th>
                  <th className="border border-black p-1" rowSpan={2}>Iron (Fe) (ppm)</th>
                  <th className="border border-black p-1" rowSpan={2}>Chlorine (ppm)</th>
                  <th className="border border-black p-1" rowSpan={2}>DO (ppm)</th>
                  <th className="border border-black p-1" rowSpan={2}>Total Dissolved Matter TDM (ppm)</th>
                </tr>
                <tr className="bg-gray-200">
                  <th className="border border-black p-1">CO₃</th>
                  <th className="border border-black p-1">HCO₃</th>
                  <th className="border border-black p-1">Ca⁺⁺</th>
                  <th className="border border-black p-1">Mg⁺⁺</th>
                  <th className="border border-black p-1">Na⁺</th>
                  <th className="border border-black p-1">K⁺</th>
                </tr>
              </thead>
              <tbody>
                {ponds.map((pond) => (
                  <tr key={pond.id}>
                    <td className="border border-black p-1 text-center">{pond.pondNo}</td>
                    <td className="border border-black p-1 text-center">{pond.pH}</td>
                    <td className="border border-black p-1 text-center">{pond.salinity}</td>
                    <td className="border border-black p-1 text-center">{pond.co3}</td>
                    <td className="border border-black p-1 text-center">{pond.hco3}</td>
                    <td className="border border-black p-1 text-center">{pond.alkalinity}</td>
                    <td className="border border-black p-1 text-center">{pond.hardness}</td>
                    <td className="border border-black p-1 text-center">{pond.ca}</td>
                    <td className="border border-black p-1 text-center">{pond.mg}</td>
                    <td className="border border-black p-1 text-center">{pond.na}</td>
                    <td className="border border-black p-1 text-center">{pond.k}</td>
                    <td className="border border-black p-1 text-center">{pond.totalAmmonia}</td>
                    <td className="border border-black p-1 text-center">{pond.unionizedAmmonia}</td>
                    <td className="border border-black p-1 text-center">{pond.h2s}</td>
                    <td className="border border-black p-1 text-center">{pond.nitrite}</td>
                    <td className="border border-black p-1 text-center">{pond.nitrate}</td>
                    <td className="border border-black p-1 text-center">{pond.iron}</td>
                    <td className="border border-black p-1 text-center">{pond.chlorine}</td>
                    <td className="border border-black p-1 text-center">{pond.dissolvedOxygen}</td>
                    <td className="border border-black p-1 text-center">{pond.totalDissolvedMatter}</td>
                  </tr>
                ))}
                <tr className="bg-white font-semibold">
                  <td className="border border-black p-1">Optimum Level</td>
                  <td className="border border-black p-1 text-center">7.5-8.5</td>
                  <td className="border border-black p-1 text-center">15-20</td>
                  <td className="border border-black p-1 text-center">20-40</td>
                  <td className="border border-black p-1 text-center">30-150</td>
                  <td className="border border-black p-1 text-center">175-200</td>
                  <td className="border border-black p-1 text-center">3000-5000</td>
                  <td className="border border-black p-1 text-center">&gt;100</td>
                  <td className="border border-black p-1 text-center">&gt;300</td>
                  <td className="border border-black p-1 text-center">&gt;40</td>
                  <td className="border border-black p-1 text-center">&gt;10</td>
                  <td className="border border-black p-1 text-center">&lt;0.1-1.0</td>
                  <td className="border border-black p-1 text-center">0-0.1</td>
                  <td className="border border-black p-1 text-center">0-0.4</td>
                  <td className="border border-black p-1 text-center">&lt;0.25</td>
                  <td className="border border-black p-1 text-center">&lt;0.50</td>
                  <td className="border border-black p-1 text-center">&lt;0.1</td>
                  <td className="border border-black p-1 text-center">0-0.02</td>
                  <td className="border border-black p-1 text-center">&gt;4</td>
                  <td className="border border-black p-1 text-center">40-70</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-center font-bold bg-white text-black py-1 text-sm border border-black">PLANKTON ANALYSIS</h3>
          <div className="border border-black">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black p-1 w-16">Pond No.</th>
                  <th className="border border-black p-2" colSpan={4}>USEFUL PLANKTON - ఉపయోగకరమైన పలాంక్టన్లు</th>
                  <th className="border border-black p-2" colSpan={9}>HARMFUL PLANKTON - హానికరమైన పలాంక్టన్లు</th>
                </tr>
                <tr className="bg-gray-100">
                  <th className="border border-black p-1"></th>
                  <th className="border border-black p-1 text-center" colSpan={4}>
                    <div className="font-bold mb-1">Phyto Plankton</div>
                  </th>
                  <th className="border border-black p-1 text-center" colSpan={3}>
                    <div className="font-bold mb-1">Zooplankton</div>
                  </th>
                  <th className="border border-black p-1 text-center" colSpan={2}>
                    <div className="font-bold mb-1">B.G Algae</div>
                  </th>
                  <th className="border border-black p-1 text-center" colSpan={2}>
                    <div className="font-bold mb-1">Dalton</div>
                  </th>
                  <th className="border border-black p-1 text-center" colSpan={2}>
                    <div className="font-bold mb-1">Blue Green Algae</div>
                  </th>
                </tr>
                <tr className="bg-gray-50">
                  <th className="border border-black p-1"></th>
                  <th className="border border-black p-1">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 mb-1">
                        <svg viewBox="0 0 40 40" className="w-full h-full">
                          <circle cx="20" cy="20" r="15" fill="none" stroke="black" strokeWidth="1"/>
                          <circle cx="20" cy="20" r="8" fill="lightgreen"/>
                          <line x1="8" y1="20" x2="32" y2="20" stroke="black" strokeWidth="0.5"/>
                        </svg>
                      </div>
                      <span className="text-[8px]">Phacus</span>
                    </div>
                  </th>
                  <th className="border border-black p-1">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 mb-1">
                        <svg viewBox="0 0 40 40" className="w-full h-full">
                          <circle cx="20" cy="20" r="12" fill="lightgreen" stroke="black" strokeWidth="1"/>
                          <circle cx="20" cy="20" r="6" fill="darkgreen"/>
                        </svg>
                      </div>
                      <span className="text-[8px]">Chlorella</span>
                    </div>
                  </th>
                  <th className="border border-black p-1">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 mb-1">
                        <svg viewBox="0 0 40 40" className="w-full h-full">
                          <ellipse cx="20" cy="20" rx="8" ry="12" fill="lightgreen" stroke="black" strokeWidth="1"/>
                          <line x1="20" y1="8" x2="20" y2="32" stroke="darkgreen" strokeWidth="1"/>
                        </svg>
                      </div>
                      <span className="text-[8px]">Desmids</span>
                    </div>
                  </th>
                  <th className="border border-black p-1">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 mb-1">
                        <svg viewBox="0 0 40 40" className="w-full h-full">
                          <rect x="15" y="10" width="10" height="20" fill="lightgreen" stroke="black" strokeWidth="1"/>
                          <line x1="20" y1="10" x2="20" y2="30" stroke="darkgreen" strokeWidth="0.5"/>
                        </svg>
                      </div>
                      <span className="text-[8px]">Scenedesmus</span>
                    </div>
                  </th>
                  <th className="border border-black p-1">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 mb-1">
                        <svg viewBox="0 0 40 40" className="w-full h-full">
                          <ellipse cx="20" cy="20" rx="10" ry="6" fill="lightblue" stroke="black" strokeWidth="1"/>
                          <circle cx="18" cy="18" r="2" fill="black"/>
                          <circle cx="22" cy="18" r="2" fill="black"/>
                        </svg>
                      </div>
                      <span className="text-[8px]">Copepod</span>
                    </div>
                  </th>
                  <th className="border border-black p-1">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 mb-1">
                        <svg viewBox="0 0 40 40" className="w-full h-full">
                          <circle cx="20" cy="15" r="8" fill="lightblue" stroke="black" strokeWidth="1"/>
                          <path d="M 20 23 L 15 35 M 20 23 L 25 35" stroke="black" strokeWidth="1" fill="none"/>
                        </svg>
                      </div>
                      <span className="text-[8px]">Rotifer</span>
                    </div>
                  </th>
                  <th className="border border-black p-1">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 mb-1">
                        <svg viewBox="0 0 40 40" className="w-full h-full">
                          <ellipse cx="20" cy="20" rx="12" ry="8" fill="lightblue" stroke="black" strokeWidth="1"/>
                          <line x1="8" y1="20" x2="32" y2="20" stroke="black" strokeWidth="0.5"/>
                        </svg>
                      </div>
                      <span className="text-[8px]">Nauplius</span>
                    </div>
                  </th>
                  <th className="border border-black p-1">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 mb-1">
                        <svg viewBox="0 0 40 40" className="w-full h-full">
                          <path d="M 20 10 Q 30 20 20 30 Q 10 20 20 10" fill="lightyellow" stroke="black" strokeWidth="1"/>
                        </svg>
                      </div>
                      <span className="text-[8px]">Spirulina</span>
                    </div>
                  </th>
                  <th className="border border-black p-1">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 mb-1">
                        <svg viewBox="0 0 40 40" className="w-full h-full">
                          <rect x="12" y="15" width="16" height="10" fill="lightyellow" stroke="black" strokeWidth="1"/>
                          <line x1="20" y1="15" x2="20" y2="25" stroke="black" strokeWidth="0.5"/>
                        </svg>
                      </div>
                      <span className="text-[8px]">Chaleoceras</span>
                    </div>
                  </th>
                  <th className="border border-black p-1">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 mb-1">
                        <svg viewBox="0 0 40 40" className="w-full h-full">
                          <ellipse cx="20" cy="20" rx="10" ry="14" fill="lightcoral" stroke="black" strokeWidth="1"/>
                          <circle cx="20" cy="15" r="3" fill="darkred"/>
                        </svg>
                      </div>
                      <span className="text-[8px]">Rhizoselenia</span>
                    </div>
                  </th>
                  <th className="border border-black p-1">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 mb-1">
                        <svg viewBox="0 0 40 40" className="w-full h-full">
                          <path d="M 20 10 L 25 25 L 15 25 Z" fill="lightcoral" stroke="black" strokeWidth="1"/>
                        </svg>
                      </div>
                      <span className="text-[8px]">Anabena</span>
                    </div>
                  </th>
                  <th className="border border-black p-1">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 mb-1">
                        <svg viewBox="0 0 40 40" className="w-full h-full">
                          <circle cx="20" cy="20" r="10" fill="lightblue" stroke="black" strokeWidth="1"/>
                          <circle cx="20" cy="20" r="5" fill="blue"/>
                        </svg>
                      </div>
                      <span className="text-[8px]">Oscillatoria</span>
                    </div>
                  </th>
                  <th className="border border-black p-1">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 mb-1">
                        <svg viewBox="0 0 40 40" className="w-full h-full">
                          <ellipse cx="20" cy="20" rx="8" ry="12" fill="lightblue" stroke="black" strokeWidth="1"/>
                          <rect x="18" y="15" width="4" height="10" fill="blue"/>
                        </svg>
                      </div>
                      <span className="text-[8px]">Microcystis</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {ponds.map((pond) => (
                  <tr key={pond.id}>
                    <td className="border border-black p-2 text-center font-semibold">{pond.pondNo}</td>
                    <td className="border border-black p-2"></td>
                    <td className="border border-black p-2"></td>
                    <td className="border border-black p-2"></td>
                    <td className="border border-black p-2"></td>
                    <td className="border border-black p-2"></td>
                    <td className="border border-black p-2"></td>
                    <td className="border border-black p-2"></td>
                    <td className="border border-black p-2"></td>
                    <td className="border border-black p-2"></td>
                    <td className="border border-black p-2"></td>
                    <td className="border border-black p-2"></td>
                    <td className="border border-black p-2"></td>
                    <td className="border border-black p-2"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mb-6 border border-black p-2">
          <h4 className="font-semibold text-sm mb-2">Remarks & Recommendations:</h4>
          <div className="min-h-[80px]"></div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t-2 border-black pt-4">
          <div>
            <p className="font-semibold text-sm">Reported by:</p>
          </div>
          <div>
            <p className="font-semibold text-sm">Checked by:</p>
          </div>
        </div>

        <div className="mt-4 text-xs italic text-gray-600">
          <p>Note: The Samples brought by Farmer, the Results Reported above are meant for guidance only for Aquaculture Purpose, Not for any Litigation.</p>
        </div>
      </div>
    </div>
  );
};

export default WaterQualityReport;