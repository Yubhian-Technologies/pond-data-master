import React, { useState } from 'react';
import { Download, Plus, Trash2 } from 'lucide-react';

export default function AquaMicrobiologyReport() {
  const [formData, setFormData] = useState({
    name: '',
    village: '',
    mobile: '',
    date: new Date().toISOString().split('T')[0],
    noOfSamples: '01',
    sampleType: 'PL TISSUE',
    reportedBy: ''
  });

  const [testResults, setTestResults] = useState([
    {
      testCode: 'TANK B-1',
      yellowColonies: '200',
      greenColonies: '0',
      tpc: ''
    }
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTestChange = (index, field, value) => {
    const newTests = [...testResults];
    newTests[index][field] = value;
    setTestResults(newTests);
  };

  const addTest = () => {
    setTestResults([...testResults, {
      testCode: '',
      yellowColonies: '',
      greenColonies: '',
      tpc: ''
    }]);
  };

  const removeTest = (index) => {
    if (testResults.length > 1) {
      setTestResults(testResults.filter((_, i) => i !== index));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-5xl mx-auto">
        {/* Input Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 print:hidden">
          <h2 className="text-xl font-bold mb-4" style={{color: '#1e40af'}}>Enter Report Details</h2>
          
          {/* Patient Details */}
          <div className="mb-6">
            <h3 className="font-bold mb-3 text-gray-700">Patient Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="P SAI VARAMA GARU"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Village</label>
                <input
                  type="text"
                  name="village"
                  value={formData.village}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="S CHIKKALA"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mobile No</label>
                <input
                  type="text"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+91 79817 71065"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">No of Samples</label>
                <input
                  type="text"
                  name="noOfSamples"
                  value={formData.noOfSamples}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Sample Type</label>
                <input
                  type="text"
                  name="sampleType"
                  value={formData.sampleType}
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
                onClick={addTest}
                className="px-4 py-2 rounded hover:opacity-90 flex items-center gap-2 text-sm text-white"
                style={{backgroundColor: '#059669'}}
              >
                <Plus size={16} />
                Add Test
              </button>
            </div>
            {testResults.map((test, index) => (
              <div key={index} className="border border-gray-300 rounded p-4 mb-4" style={{backgroundColor: '#f9fafb'}}>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-sm">Test {index + 1}</h4>
                  {testResults.length > 1 && (
                    <button
                      onClick={() => removeTest(index)}
                      style={{color: '#dc2626'}}
                      className="hover:opacity-75"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">Test Code</label>
                    <input
                      type="text"
                      value={test.testCode}
                      onChange={(e) => handleTestChange(index, 'testCode', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="TANK B-1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Yellow Colonies</label>
                    <input
                      type="text"
                      value={test.yellowColonies}
                      onChange={(e) => handleTestChange(index, 'yellowColonies', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Green Colonies</label>
                    <input
                      type="text"
                      value={test.greenColonies}
                      onChange={(e) => handleTestChange(index, 'greenColonies', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">TPC (Total Plate Count)</label>
                    <input
                      type="text"
                      value={test.tpc}
                      onChange={(e) => handleTestChange(index, 'tpc', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Reported By */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">Reported By</label>
            <input
              type="text"
              name="reportedBy"
              value={formData.reportedBy}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="S SAI SRINIVAS"
            />
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
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="text-white px-3 py-2 rounded font-bold" style={{backgroundColor: '#2563eb'}}>
                <div className="text-xs">ABC</div>
              </div>
              <div className="text-xs" style={{color: '#4b5563'}}>
                <div>Aquaculture Disease</div>
                <div>Diagnostic Centre</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-sm" style={{color: '#1e40af'}}>The Waterbase</div>
              <div className="font-bold text-sm" style={{color: '#1e40af'}}>Limited</div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-center mb-2" style={{color: '#1e40af'}}>
            WATERBASE AQUA DIAGNOSTIC CENTER
          </h1>
          <div className="text-center text-xs mb-1">
            3-6-10, Ravi House, Town Railway Station Road, Bhimavaram-534202, West Godavari (Dt), Andhra Pradesh, India
          </div>
          <div className="text-center text-xs mb-1">
            Contact No: - 7680888002, E-mail: <span style={{color: '#2563eb'}}>bhimavaramlab@waterbaseindia.com</span>
          </div>
          <div className="text-center text-xs mb-6">
            GSTIN :- 37AABCT0601L1ZJ
          </div>

          {/* Patient Details */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-6">
            <div className="flex">
              <span className="font-bold w-32" style={{color: '#1e40af'}}>NAME</span>
              <span className="mr-4">:</span>
              <span className="uppercase">{formData.name || 'P SAI VARAMA GARU'}</span>
            </div>
            <div className="flex">
              <span className="font-bold w-32" style={{color: '#1e40af'}}>DATE</span>
              <span className="mr-4">:</span>
              <span>{formData.date ? new Date(formData.date).toLocaleDateString('en-GB', {day: '2-digit', month: '2-digit', year: 'numeric'}).replace(/\//g, '-') : '15-10-2025'}</span>
            </div>
            <div className="flex">
              <span className="font-bold w-32" style={{color: '#1e40af'}}>VILLAGE</span>
              <span className="mr-4">:</span>
              <span className="uppercase">{formData.village || 'S CHIKKALA'}</span>
            </div>
            <div className="flex">
              <span className="font-bold w-32" style={{color: '#1e40af'}}>NO OF SAMPLES</span>
              <span className="mr-4">:</span>
              <span>{formData.noOfSamples}</span>
            </div>
            <div className="flex">
              <span className="font-bold w-32" style={{color: '#1e40af'}}>MOBILE NO</span>
              <span className="mr-4">:</span>
              <span>{formData.mobile || '+91 79817 71065'}</span>
            </div>
            <div className="flex">
              <span className="font-bold w-32" style={{color: '#1e40af'}}>SAMPLE TYPE</span>
              <span className="mr-4">:</span>
              <span className="uppercase">{formData.sampleType}</span>
            </div>
          </div>

          {/* Report Section */}
          <h2 className="text-xl font-bold text-center mb-4" style={{color: '#dc2626'}}>
            MICROBIOLOGY REPORT
          </h2>

          <h3 className="text-lg font-bold text-center mb-4" style={{color: '#dc2626'}}>
            BACTERIOLOGY
          </h3>

          {/* Results Table */}
          <div className="mb-8 inline-block mx-auto" style={{display: 'table', margin: '0 auto'}}>
            <table className="text-sm" style={{border: '2px solid #1f2937'}}>
              <thead>
                <tr>
                  <th colSpan= {4} className="p-2 text-center font-bold" style={{borderBottom: '2px solid #1f2937', color: '#1e40af'}}>
                    VIBRIO CFU/ml
                  </th>
                </tr>
                <tr style={{borderBottom: '2px solid #1f2937'}}>
                  <th className="px-4 py-2 font-bold" style={{borderRight: '1px solid #1f2937', minWidth: '120px'}}>TEST CODE</th>
                  <th className="px-4 py-2 font-bold text-center" style={{borderRight: '1px solid #1f2937', backgroundColor: '#fef08a', minWidth: '120px'}}>Yellow colonies</th>
                  <th className="px-4 py-2 font-bold text-center" style={{borderRight: '1px solid #1f2937', backgroundColor: '#86efac', minWidth: '120px'}}>Green colonies</th>
                  <th className="px-4 py-2 font-bold text-center" style={{minWidth: '140px'}}>
                    TPC<br/>(total plate count)
                  </th>
                </tr>
              </thead>
              <tbody>
                {testResults.map((test, index) => (
                  <tr key={index} style={{borderBottom: '1px solid #1f2937'}}>
                    <td className="px-4 py-2 font-semibold" style={{borderRight: '1px solid #1f2937'}}>{test.testCode}</td>
                    <td className="px-4 py-2 text-center" style={{borderRight: '1px solid #1f2937'}}>{test.yellowColonies}</td>
                    <td className="px-4 py-2 text-center" style={{borderRight: '1px solid #1f2937'}}>{test.greenColonies}</td>
                    <td className="px-4 py-2 text-center">{test.tpc}</td>
                  </tr>
                ))}
                <tr>
                  <td className="px-4 py-2 font-semibold" style={{borderRight: '1px solid #1f2937', color: '#dc2626'}}>Optimum Levels</td>
                  <td className="px-4 py-2 text-center" style={{borderRight: '1px solid #1f2937'}}>&lt; 300</td>
                  <td className="px-4 py-2 text-center" style={{borderRight: '1px solid #1f2937'}}>&lt; 50</td>
                  <td className="px-4 py-2 text-center">&lt; 1000</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Signature */}
          <div className="text-right mt-16 mb-8">
            <div className="font-bold">REPORTED BY</div>
            <div className="mt-8 font-bold">{formData.reportedBy || 'S SAI SRINIVAS'}</div>
          </div>

          {/* Footer Note */}
          <div className="text-xs mb-4" style={{color: '#4b5563'}}>
            <span className="font-bold" style={{color: '#dc2626'}}>Note:</span> The samples brought by Farmer, the Results Reported above are meant for guidance only for Aquaculture Purpose. Not for any Litigation
          </div>

          <div className="text-center font-bold text-sm" style={{color: '#dc2626'}}>
            TWL ADC committed to Complete farming Solutions
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