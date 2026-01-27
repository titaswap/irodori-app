import React from 'react';

function PracticeModeView({ practiceQueue, currentCardIndex, nextCard, finishPractice }) {
    return (
        <div className="p-4 bg-slate-100 h-screen flex flex-col items-center justify-center">
            <div className="bg-white p-8 rounded-2xl shadow-xl text-center">
                <h2 className="text-4xl font-bold mb-4">{practiceQueue[currentCardIndex]?.japanese}</h2>
                <div className="flex gap-4 mt-8">
                    <button onClick={nextCard} className="px-6 py-3 bg-red-100 text-red-600 rounded-lg font-bold">Hard</button>
                    <button onClick={nextCard} className="px-6 py-3 bg-green-100 text-green-600 rounded-lg font-bold">Easy</button>
                </div>
                <button onClick={() => finishPractice()} className="mt-8 text-slate-400 underline text-sm">Save & Exit</button>
            </div>
        </div>
    );
}

export default PracticeModeView;
