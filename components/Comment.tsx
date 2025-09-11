import React from 'react';
import type { Comment as CommentType } from '../types';
import { LikeIcon, DislikeIcon } from './icons/Icons';

interface CommentProps {
    comment: CommentType;
}

const Comment: React.FC<CommentProps> = ({ comment }) => {
    return (
        <div className="flex items-start">
            <img src={comment.authorAvatarUrl} alt={comment.author} className="w-10 h-10 rounded-full" />
            <div className="ml-4">
                <div className="flex items-baseline">
                    <p className="font-semibold text-sm mr-2">{comment.author}</p>
                    <p className="text-xs text-yt-light-gray">{comment.publishedAt}</p>
                </div>
                <p className="text-sm">{comment.text}</p>
                <div className="flex items-center mt-2 space-x-4">
                    <button className="flex items-center">
                        <LikeIcon />
                        <span className="text-xs ml-1 text-yt-light-gray">{comment.likes}</span>
                    </button>
                    <button>
                        <DislikeIcon />
                    </button>
                    <button className="text-xs font-semibold">Reply</button>
                </div>
            </div>
        </div>
    );
};

export default Comment;
