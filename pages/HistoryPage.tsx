
import React from 'react';
import { useHistory } from '../contexts/HistoryContext';
import SearchVideoResultCard from '../components/SearchVideoResultCard';

const HistoryPage: React.FC = () => {
    const { history } = useHistory();

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">視聴履歴</h1>
            
            {history.length === 0 ? (
                <p className="text-center text-yt-light-gray">視聴履歴はありません。</p>
            ) : (
                <div className="flex flex-col space-y-4">
                    {history.map((video, index) => (
                        <SearchVideoResultCard key={`${video.id}-${index}`} video={video} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default HistoryPage;