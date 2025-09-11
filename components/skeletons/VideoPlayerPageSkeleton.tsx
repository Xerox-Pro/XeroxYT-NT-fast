import React from 'react';

const VideoPlayerPageSkeleton: React.FC = () => {
  const SkeletonLine: React.FC<{ width: string; height?: string }> = ({ width, height = 'h-4' }) => (
    <div className={`bg-yt-dark-gray rounded ${width} ${height}`}></div>
  );

  const RelatedVideoSkeleton = () => (
    <div className="flex">
        <div className="w-40 h-24 bg-yt-dark-gray rounded-lg flex-shrink-0"></div>
        <div className="ml-3 flex-1 space-y-2">
            <SkeletonLine width="w-full" />
            <SkeletonLine width="w-3/4" />
            <SkeletonLine width="w-1/2" />
        </div>
    </div>
  );

  const CommentSkeleton = () => (
    <div className="flex items-start">
        <div className="w-10 h-10 rounded-full bg-yt-dark-gray"></div>
        <div className="ml-4 flex-1 space-y-2">
            <SkeletonLine width="w-1/4" />
            <SkeletonLine width="w-full" />
            <SkeletonLine width="w-5/6" />
        </div>
    </div>
  );


  return (
    <div className="flex flex-col lg:flex-row gap-6 px-4 md:px-6 lg:px-8 animate-pulse">
      {/* Main content */}
      <div className="flex-grow lg:w-2/3">
        {/* Video Player Placeholder */}
        <div className="w-full aspect-video bg-yt-dark rounded-xl mb-4"></div>
        
        {/* Video Title */}
        <div className="space-y-3 mb-4">
            <SkeletonLine width="w-5/6" height="h-6" />
            <SkeletonLine width="w-3/4" height="h-6" />
        </div>
        

        {/* Channel Info and Actions */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div className="flex items-center mb-3 md:mb-0">
                <div className="w-10 h-10 rounded-full bg-yt-dark-gray"></div>
                <div className="ml-3 space-y-2">
                    <SkeletonLine width="w-32" />
                    <SkeletonLine width="w-24" />
                </div>
                <div className="ml-6 h-9 w-24 rounded-full bg-yt-dark-gray"></div>
            </div>
             <div className="flex items-center space-x-2">
                <div className="h-9 w-32 rounded-full bg-yt-dark"></div>
                <div className="h-9 w-24 rounded-full bg-yt-dark"></div>
            </div>
        </div>

        {/* Description */}
        <div className="bg-yt-dark p-3 rounded-xl mt-4 space-y-2">
            <SkeletonLine width="w-1/3" />
            <SkeletonLine width="w-full" />
            <SkeletonLine width="w-full" />
            <SkeletonLine width="w-1/2" />
        </div>

        {/* Comments */}
        <div className="mt-6 space-y-4">
            <SkeletonLine width="w-1/4" height="h-6" />
            <CommentSkeleton />
            <CommentSkeleton />
            <CommentSkeleton />
        </div>
      </div>
      
      {/* Related Videos */}
      <div className="w-full lg:w-1/3 lg:max-w-md flex-shrink-0 space-y-3">
        <SkeletonLine width="w-1/3" height="h-6" />
        <RelatedVideoSkeleton />
        <RelatedVideoSkeleton />
        <RelatedVideoSkeleton />
        <RelatedVideoSkeleton />
        <RelatedVideoSkeleton />
      </div>
    </div>
  );
};

export default VideoPlayerPageSkeleton;
