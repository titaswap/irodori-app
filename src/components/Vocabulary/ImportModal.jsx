
import React, { useState } from 'react';
import { XCircle, ArrowRight, CheckCircle } from 'lucide-react';

const ImportModal = ({ isOpen, onClose, onImport }) => {
    const [importStep, setImportStep] = useState('input');
    const [importText, setImportText] = useState('');
    const [parsedRows, setParsedRows] = useState([]);
    const [columnMapping, setColumnMapping] = useState([]);

    if (!isOpen) return null;

    const handleParseInput = () => {
        const lines = importText.trim().split('\n');
        const rows = lines.map(line => line.split('\t')).filter(row => row.length > 0 && row.some(cell => cell.trim()));
        if (rows.length === 0) {
            // Error handling could be passed as prop or just alerted
            alert("No data found");
            return;
        }
        setParsedRows(rows);
        const colCount = Math.max(...rows.map(r => r.length));
        setColumnMapping(new Array(colCount).fill('skip'));
        setImportStep('mapping');
    };

    const handleMappingChange = (index, value) => {
        const newMapping = [...columnMapping];
        if (value !== 'skip' && newMapping.includes(value)) newMapping[newMapping.indexOf(value)] = 'skip';
        newMapping[index] = value;
        setColumnMapping(newMapping);
    };

    const handleFinalImport = () => {
        // Logic from `handleFinalImport` in original view
        // But here we might just pass the data back to parent
        // Construct objects
        const importedData = parsedRows.map(row => {
            const item = {};
            columnMapping.forEach((col, idx) => {
                if (col !== 'skip') item[col] = row[idx];
            });
            return item;
        });
        onImport(importedData);
        setImportStep('input');
        setImportText('');
        setParsedRows([]);
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-6 border-b flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">{importStep === 'input' ? 'Step 1: Paste Data' : 'Step 2: Map Columns'}</h2>
                        <p className="text-sm text-slate-500 mt-1">{importStep === 'input' ? 'Paste your vocabulary from Excel or Google Sheets.' : 'Assign column types. Hiragana is required.'}</p>
                    </div>
                    <button onClick={onClose}><XCircle className="text-slate-400 hover:text-red-500" size={24} /></button>
                </div>
                <div className="p-6 flex-1 overflow-y-auto">
                    {importStep === 'input' ? (
                        <textarea autoFocus value={importText} onChange={(e) => setImportText(e.target.value)} placeholder={`Example:\nわたし\t私\tআমি\t1\t1\nなまえ\t名前\tনাম\t1\t1`} className="w-full h-96 p-4 border border-slate-300 rounded-xl font-mono text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
                    ) : (
                        <div className="space-y-6">
                            <div className="border border-slate-200 rounded-lg overflow-x-auto">
                                <table className="w-full text-sm text-left border-collapse">
                                    <thead>
                                        <tr>
                                            {columnMapping.map((mapVal, idx) => (
                                                <th key={idx} className="p-2 border-b border-r border-slate-200 bg-slate-50 min-w-[150px]">
                                                    <div className="text-xs font-bold text-slate-400 uppercase mb-1">Column {String.fromCharCode(65 + idx)}</div>
                                                    <select value={mapVal} onChange={(e) => handleMappingChange(idx, e.target.value)} className={`w-full p-2 rounded border text-sm font-bold ${mapVal === 'skip' ? 'text-slate-400 border-slate-200' : 'text-indigo-700 border-indigo-300 bg-indigo-50'}`}>
                                                        <option value="skip">Skip</option><option value="japanese">Hiragana (Req)</option><option value="bangla">Bangla</option><option value="lesson">Lesson No.</option><option value="cando">Can-do No.</option>
                                                    </select>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>{parsedRows.slice(0, 5).map((row, rIdx) => (<tr key={rIdx} className="border-b border-slate-100 last:border-0">{columnMapping.map((_, cIdx) => (<td key={cIdx} className={`p-3 border-r border-slate-100 ${columnMapping[cIdx] === 'skip' ? 'text-slate-400 bg-slate-50' : 'text-slate-800'}`}>{row[cIdx] || <span className="italic text-slate-300">empty</span>}</td>))}</tr>))}</tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-6 border-t bg-slate-50 rounded-b-2xl flex justify-between items-center">
                    <div className="flex gap-3 ml-auto">
                        {importStep === 'mapping' && <button onClick={() => setImportStep('input')} className="px-4 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-lg transition-colors">Back</button>}
                        {importStep === 'input' ? (
                            <button onClick={handleParseInput} disabled={!importText.trim()} className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm flex items-center gap-2">Next Step <ArrowRight size={16} /></button>
                        ) : (
                            <button onClick={handleFinalImport} disabled={!columnMapping.includes('japanese')} className="px-6 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:bg-slate-400 shadow-sm transition-colors flex items-center gap-2"><CheckCircle size={16} /> Confirm Import</button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImportModal;
