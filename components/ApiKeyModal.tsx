
import React, { useState } from 'react';
import { useApiKey } from '../contexts/ApiKeyContext';
import { CloseIcon } from './icons/Icons';

const ApiKeyModal: React.FC = () => {
    const { apiKey, setApiKey, closeModal } = useApiKey();
    const [currentKey, setCurrentKey] = useState(apiKey || '');

    const handleSave = () => {
        if (currentKey.trim()) {
            setApiKey(currentKey.trim());
            closeModal();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSave();
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100]"
            onClick={closeModal}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-yt-white dark:bg-yt-light-black rounded-lg w-full max-w-md p-6 shadow-xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-black dark:text-yt-white">YouTube APIキーを設定</h2>
                    <button onClick={closeModal} className="p-2 rounded-full hover:bg-yt-spec-light-10 dark:hover:bg-yt-spec-20" aria-label="閉じる">
                        <CloseIcon />
                    </button>
                </div>
                
                <p className="text-sm text-yt-light-gray mb-4">
                    このアプリケーションを使用するには、YouTube Data API v3のキーが必要です。
                    <a 
                        href="https://console.cloud.google.com/apis/credentials" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-yt-blue hover:underline ml-1"
                    >
                        こちら
                    </a>
                    からキーを取得できます。
                </p>

                <div className="mb-4">
                    <label htmlFor="apiKeyInput" className="block text-sm font-medium text-yt-light-gray mb-1">
                        APIキー
                    </label>
                    <input
                        id="apiKeyInput"
                        type="text"
                        value={currentKey}
                        onChange={(e) => setCurrentKey(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="APIキーをここに貼り付け"
                        className="w-full h-10 bg-transparent border border-yt-gray rounded-lg px-3 text-black dark:text-white focus:outline-none focus:border-yt-blue transition-colors"
                        autoFocus
                    />
                </div>

                <button
                    onClick={handleSave}
                    disabled={!currentKey.trim()}
                    className="w-full bg-yt-blue text-white font-semibold py-2 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                >
                    保存
                </button>
            </div>
        </div>
    );
};

export default ApiKeyModal;
