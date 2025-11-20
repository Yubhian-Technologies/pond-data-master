import React, { useState } from 'react';
import { Download, Plus, Trash2 } from 'lucide-react';

export default function SoilAnalysisReport() {
  const [formData, setFormData] = useState({
    farmerName: '',
    farmerUID: '',
    farmerAddress: '',
    soilType: '',
    sourceOfSoil: '',
    noOfSamples: '',
    mobile: '',
    sampleDate: new Date().toISOString().split('T')[0],
    reportDate: new Date().toISOString().split('T')[0],
    reportedBy: '',
    checkedBy: '',
    cmisBy: ''
  });

  const [samples, setSamples] = useState([
    {
      pondNo: '',
      pH: '',
      ec: '',
      caco3: '',
      soilTexture: '',
      organicCarbon: '',
      availableNitrogen: '',
      availablePhosphorus: '',
      redoxPotential: '',
      remarks: ''
    }
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSampleChange = (index, field, value) => {
    const newSamples = [...samples];
    newSamples[index][field] = value;
    setSamples(newSamples);
  };

  const addSample = () => {
    setSamples([...samples, {
      pondNo: '',
      pH: '',
      ec: '',
      caco3: '',
      soilTexture: '',
      organicCarbon: '',
      availableNitrogen: '',
      availablePhosphorus: '',
      redoxPotential: '',
      remarks: ''
    }]);
  };

  const removeSample = (index) => {
    if (samples.length > 1) {
      setSamples(samples.filter((_, i) => i !== index));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Input Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 print:hidden">
          <h2 className="text-xl font-bold mb-4" style={{color: '#1e40af'}}>Enter Report Details</h2>
          
          {/* Farmer Details */}
          <div className="mb-6">
            <h3 className="font-bold mb-3 text-gray-700">Farmer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Farmer Name</label>
                <input
                  type="text"
                  name="farmerName"
                  value={formData.farmerName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Farmer UID</label>
                <input
                  type="text"
                  name="farmerUID"
                  value={formData.farmerUID}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mobile</label>
                <input
                  type="text"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium mb-1">Farmer Address</label>
                <input
                  type="text"
                  name="farmerAddress"
                  value={formData.farmerAddress}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Sample Details */}
          <div className="mb-6">
            <h3 className="font-bold mb-3 text-gray-700">Sample Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Soil Type</label>
                <input
                  type="text"
                  name="soilType"
                  value={formData.soilType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Source of Soil</label>
                <input
                  type="text"
                  name="sourceOfSoil"
                  value={formData.sourceOfSoil}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">No. of Samples</label>
                <input
                  type="text"
                  name="noOfSamples"
                  value={formData.noOfSamples}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Sample Date</label>
                <input
                  type="date"
                  name="sampleDate"
                  value={formData.sampleDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Report Date</label>
                <input
                  type="date"
                  name="reportDate"
                  value={formData.reportDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Test Results */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-gray-700">Test Results</h3>
              <button
                onClick={addSample}
                className="px-4 py-2 rounded hover:opacity-90 flex items-center gap-2 text-sm text-white"
                style={{backgroundColor: '#059669'}}
              >
                <Plus size={16} />
                Add Sample
              </button>
            </div>
            {samples.map((sample, index) => (
              <div key={index} className="border border-gray-300 rounded p-4 mb-4" style={{backgroundColor: '#f9fafb'}}>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-sm">Sample {index + 1}</h4>
                  {samples.length > 1 && (
                    <button
                      onClick={() => removeSample(index)}
                      style={{color: '#dc2626'}}
                      className="hover:opacity-75"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">Pond No.</label>
                    <input
                      type="text"
                      value={sample.pondNo}
                      onChange={(e) => handleSampleChange(index, 'pondNo', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">pH</label>
                    <input
                      type="text"
                      value={sample.pH}
                      onChange={(e) => handleSampleChange(index, 'pH', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">EC (ds/m)</label>
                    <input
                      type="text"
                      value={sample.ec}
                      onChange={(e) => handleSampleChange(index, 'ec', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">CaCO₃ Content(%)</label>
                    <input
                      type="text"
                      value={sample.caco3}
                      onChange={(e) => handleSampleChange(index, 'caco3', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Soil Texture</label>
                    <input
                      type="text"
                      value={sample.soilTexture}
                      onChange={(e) => handleSampleChange(index, 'soilTexture', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Organic Carbon(%)</label>
                    <input
                      type="text"
                      value={sample.organicCarbon}
                      onChange={(e) => handleSampleChange(index, 'organicCarbon', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Available Nitrogen (mg/kg)</label>
                    <input
                      type="text"
                      value={sample.availableNitrogen}
                      onChange={(e) => handleSampleChange(index, 'availableNitrogen', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Available Phosphorus (mg/kg)</label>
                    <input
                      type="text"
                      value={sample.availablePhosphorus}
                      onChange={(e) => handleSampleChange(index, 'availablePhosphorus', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Redox Potential (mV)</label>
                    <input
                      type="text"
                      value={sample.redoxPotential}
                      onChange={(e) => handleSampleChange(index, 'redoxPotential', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Remarks</label>
                    <input
                      type="text"
                      value={sample.remarks}
                      onChange={(e) => handleSampleChange(index, 'remarks', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Verification Details */}
          <div className="mb-6">
            <h3 className="font-bold mb-3 text-gray-700">Verification</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Reported By</label>
                <input
                  type="text"
                  name="reportedBy"
                  value={formData.reportedBy}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Checked By</label>
                <input
                  type="text"
                  name="checkedBy"
                  value={formData.checkedBy}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">CMIS By</label>
                <input
                  type="text"
                  name="cmisBy"
                  value={formData.cmisBy}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handlePrint}
            className="px-6 py-2 rounded hover:opacity-90 flex items-center gap-2 text-white"
            style={{backgroundColor: '#2563eb'}}
          >
            <Download size={20} />
            Generate & Print Report
          </button>
        </div>

        {/* Report Preview */}
        <div className="bg-white rounded-lg shadow-md p-8" id="report">
          {/* Header with Blue Background */}
          <div className="text-center py-2 mb-4" style={{backgroundColor: '#1e3a8a', color: '#ffffff'}}>
            <h1 className="text-xl font-bold">SOIL ANALYSIS REPORT</h1>
          </div>

          {/* Organization Details */}
          <div className="flex justify-between items-start mb-4 pb-4" style={{borderBottom: '2px solid #374151'}}>
            <div className="flex items-start gap-4">
              <div className="px-4 py-3 rounded font-bold text-2xl" style={{backgroundColor: '#dc2626', color: '#ffffff'}}>
                <div>KC</div>
                <div className="text-xs">T</div>
              </div>
              <div>
                <div className="font-bold text-lg">KCT Group Trust</div>
                <div className="text-xs" style={{color: '#4b5563'}}>Karam Chand Thapar Group</div>
              </div>
            </div>
            <div className="text-right text-sm">
              <div className="font-bold">Community Development Center</div>
              <div>(Learning, Livelihood & Research)</div>
              <div># 3-6-10, Ravi House,</div>
              <div>Town Railway Station Road,</div>
              <div>Bhimavaram-534202, (WG Dt.)</div>
              <div>Andhra pradesh, India.</div>
              <div className="mt-2">Ph : 08816-297707</div>
              <div>Email:bhimavaram@kctgroup.com</div>
            </div>
          </div>

          {/* Farmer Information Table */}
          <table className="w-full mb-4" style={{border: '2px solid #1f2937'}}>
            <tbody>
              <tr style={{borderBottom: '1px solid #1f2937'}}>
                <td className="px-2 py-1 font-semibold text-sm" style={{borderRight: '1px solid #1f2937', backgroundColor: '#d1d5db', width: '16.66%'}}>Farmer Name:</td>
                <td className="px-2 py-1 text-sm" style={{borderRight: '1px solid #1f2937', width: '33.33%'}}>{formData.farmerName}</td>
                <td className="px-2 py-1 font-semibold text-sm" style={{borderRight: '1px solid #1f2937', backgroundColor: '#d1d5db', width: '16.66%'}}>Soil Type :</td>
                <td className="px-2 py-1 text-sm" style={{borderRight: '1px solid #1f2937', width: '16.66%'}}>{formData.soilType}</td>
                <td className="px-2 py-1 font-semibold text-sm" style={{borderRight: '1px solid #1f2937', backgroundColor: '#d1d5db', width: '8.33%'}}>Mobile:</td>
                <td className="px-2 py-1 text-sm" style={{width: '8.33%'}}>{formData.mobile}</td>
              </tr>
              <tr style={{borderBottom: '1px solid #1f2937'}}>
                <td className="px-2 py-1 font-semibold text-sm" style={{borderRight: '1px solid #1f2937', backgroundColor: '#d1d5db'}}>Farmer UID :</td>
                <td className="px-2 py-1 text-sm" style={{borderRight: '1px solid #1f2937'}}>{formData.farmerUID}</td>
                <td className="px-2 py-1 font-semibold text-sm" style={{borderRight: '1px solid #1f2937', backgroundColor: '#d1d5db'}}>Source of Soil :</td>
                <td className="px-2 py-1 text-sm" style={{borderRight: '1px solid #1f2937'}}>{formData.sourceOfSoil}</td>
                <td className="px-2 py-1 font-semibold text-sm" style={{borderRight: '1px solid #1f2937', backgroundColor: '#d1d5db'}}>Sample Date :</td>
                <td className="px-2 py-1 text-sm">{formData.sampleDate}</td>
              </tr>
              <tr>
                <td className="px-2 py-1 font-semibold text-sm" style={{borderRight: '1px solid #1f2937', backgroundColor: '#d1d5db'}}>Farmer Address :</td>
                <td className="px-2 py-1 text-sm" style={{borderRight: '1px solid #1f2937'}}>{formData.farmerAddress}</td>
                <td className="px-2 py-1 font-semibold text-sm" style={{borderRight: '1px solid #1f2937', backgroundColor: '#d1d5db'}}>No.of Samples :</td>
                <td className="px-2 py-1 text-sm" style={{borderRight: '1px solid #1f2937'}}>{formData.noOfSamples}</td>
                <td className="px-2 py-1 font-semibold text-sm" style={{borderRight: '1px solid #1f2937', backgroundColor: '#d1d5db'}}>Report Date :</td>
                <td className="px-2 py-1 text-sm">{formData.reportDate}</td>
              </tr>
            </tbody>
          </table>

          {/* Test Results Table */}
          <table className="w-full mb-4 text-xs" style={{border: '2px solid #1f2937'}}>
            <thead>
              <tr style={{borderBottom: '2px solid #1f2937', backgroundColor: '#d1d5db'}}>
                <th className="px-2 py-2 font-bold" style={{borderRight: '1px solid #1f2937'}}>Pond No.</th>
                <th className="px-2 py-2 font-bold" style={{borderRight: '1px solid #1f2937'}}>pH</th>
                <th className="px-2 py-2 font-bold" style={{borderRight: '1px solid #1f2937'}}>EC (ds/m)</th>
                <th className="px-2 py-2 font-bold" style={{borderRight: '1px solid #1f2937'}}>CaCO₃ Content(%)</th>
                <th className="px-2 py-2 font-bold" style={{borderRight: '1px solid #1f2937'}}>Soil texture</th>
                <th className="px-2 py-2 font-bold" style={{borderRight: '1px solid #1f2937'}}>Organic Carbon(%)</th>
                <th className="px-2 py-2 font-bold" style={{borderRight: '1px solid #1f2937'}}>Available Nitrogen (mg/kg)</th>
                <th className="px-2 py-2 font-bold" style={{borderRight: '1px solid #1f2937'}}>Available Phos-phorus (mg/kg)</th>
                <th className="px-2 py-2 font-bold" style={{borderRight: '1px solid #1f2937'}}>Redox Potential (mV)</th>
                <th className="px-2 py-2 font-bold">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {samples.map((sample, index) => (
                <tr key={index} style={{borderBottom: '1px solid #1f2937'}}>
                  <td className="px-2 py-2 text-center" style={{borderRight: '1px solid #1f2937'}}>{sample.pondNo}</td>
                  <td className="px-2 py-2 text-center" style={{borderRight: '1px solid #1f2937'}}>{sample.pH}</td>
                  <td className="px-2 py-2 text-center" style={{borderRight: '1px solid #1f2937'}}>{sample.ec}</td>
                  <td className="px-2 py-2 text-center" style={{borderRight: '1px solid #1f2937'}}>{sample.caco3}</td>
                  <td className="px-2 py-2 text-center" style={{borderRight: '1px solid #1f2937'}}>{sample.soilTexture}</td>
                  <td className="px-2 py-2 text-center" style={{borderRight: '1px solid #1f2937'}}>{sample.organicCarbon}</td>
                  <td className="px-2 py-2 text-center" style={{borderRight: '1px solid #1f2937'}}>{sample.availableNitrogen}</td>
                  <td className="px-2 py-2 text-center" style={{borderRight: '1px solid #1f2937'}}>{sample.availablePhosphorus}</td>
                  <td className="px-2 py-2 text-center" style={{borderRight: '1px solid #1f2937'}}>{sample.redoxPotential}</td>
                  <td className="px-2 py-2 text-center">{sample.remarks}</td>
                </tr>
              ))}
              <tr style={{backgroundColor: '#e5e7eb'}}>
                <td className="px-2 py-2 text-center font-semibold italic" style={{borderRight: '1px solid #1f2937'}}>Optimum level</td>
                <td className="px-2 py-2 text-center" style={{borderRight: '1px solid #1f2937'}}>7.0-8.0</td>
                <td className="px-2 py-2 text-center" style={{borderRight: '1px solid #1f2937'}}>&gt;4</td>
                <td className="px-2 py-2 text-center" style={{borderRight: '1px solid #1f2937'}}>&gt;5.0</td>
                <td className="px-2 py-2 text-center" style={{borderRight: '1px solid #1f2937'}}></td>
                <td className="px-2 py-2 text-center" style={{borderRight: '1px solid #1f2937'}}>0.5 - 1.5</td>
                <td className="px-2 py-2 text-center" style={{borderRight: '1px solid #1f2937'}}>50 - 75</td>
                <td className="px-2 py-2 text-center" style={{borderRight: '1px solid #1f2937'}}>4 - 6</td>
                <td className="px-2 py-2 text-center" style={{borderRight: '1px solid #1f2937'}}>Less than -150</td>
                <td className="px-2 py-2 text-center"></td>
              </tr>
            </tbody>
          </table>

          {/* Footer */}
          <div className="mb-4" style={{border: '2px solid #1f2937'}}>
            <div className="text-xs px-2 py-1" style={{borderBottom: '1px solid #1f2937'}}>
              <span className="font-bold">Note :</span> The samples brought by Farmer, the Results Reported above are meant for Guidance only for Aquaculture purpose, Not for any Litigation
            </div>
            <div className="flex">
              <div className="px-2 py-1 text-xs" style={{width: '33.33%', borderRight: '1px solid #1f2937'}}>
                <span className="font-semibold">Reported by :</span> {formData.reportedBy}
              </div>
              <div className="px-2 py-1 text-xs" style={{width: '33.33%', borderRight: '1px solid #1f2937'}}>
                <span className="font-semibold">Checked by :</span> {formData.checkedBy}
              </div>
              <div className="px-2 py-1 text-xs" style={{width: '33.33%'}}>
                <span className="font-semibold">CMIS by :</span> {formData.cmisBy}
              </div>
            </div>
          </div>

          <div className="text-center font-bold text-sm" style={{color: '#dc2626'}}>
            KCT Group Trust committed for Complete Farming Solutions
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #report, #report * {
            visibility: visible;
          }
          #report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}