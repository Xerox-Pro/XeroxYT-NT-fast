
import React from 'react';

const iconClasses = "fill-current text-black dark:text-white";
const secondaryIconClasses = "fill-current text-yt-icon dark:text-yt-light-gray";

export const MenuIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" focusable="false" className={iconClasses}>
    <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"></path>
  </svg>
);

export const YouTubeLogo: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-auto" viewBox="0 0 28.9 20.21" focusable="false">
        <path fill="#FF0000" d="M28.3,3.12a3.58,3.58,0,0,0-2.52-2.52C23.6,0,14.45,0,14.45,0S5.3,0,3.12,0.6A3.58,3.58,0,0,0,0.6,3.12C0,5.35,0,10.1,0,10.1s0,4.75,0.6,7a3.58,3.58,0,0,0,2.52,2.52c2.18,0.6,11.33,0.6,11.33,0.6s9.15,0,11.33-0.6a3.58,3.58,0,0,0,2.52-2.52c0.6-2.18,0.6-7,0.6-7S28.9,5.35,28.3,3.12Z"/>
        <path fill="#FFFFFF" d="M11.56,14.49,19,10.1,11.56,5.71V14.49Z"/>
    </svg>
);


export const SearchIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" focusable="false" className={iconClasses}>
    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path>
  </svg>
);

export const MicIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" focusable="false" className={iconClasses}>
    <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.49 6-3.31 6-6.72h-1.7z"></path>
  </svg>
);

export const VideoPlusIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" focusable="false" className={iconClasses}>
    <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4zM14 13h-3v3H9v-3H6v-2h3V8h2v3h3v2z"></path>
  </svg>
);

export const BellIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" focusable="false" className={iconClasses}>
    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"></path>
  </svg>
);

export const HomeIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" focusable="false" className={iconClasses}>
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"></path>
    </svg>
);

export const ShortsIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" focusable="false" className={iconClasses}>
        <path d="M10 14.5v-5l4 2.5-4 2.5zM17.5 3C18.88 3 20 4.12 20 5.5v13c0 1.38-1.12 2.5-2.5 2.5h-11C5.12 21 4 19.88 4 18.5v-13C4 4.12 5.12 3 6.5 3h11zm0 1H6.5c-.83 0-1.5.67-1.5 1.5v13c0 .83.67 1.5 1.5 1.5h11c.83 0 1.5-.67 1.5-1.5v-13c0-.83-.67-1.5-1.5-1.5z"></path>
    </svg>
);

export const SubscriptionsIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" focusable="false" className={iconClasses}>
        <path d="M10,18v-6l5,3L10,18z M17,3H7v1h10V3z M20,6H4v1h16V6z M22,9H2v12h20V9z M3,10h18v10H3V10z"></path>
    </svg>
);

export const YouIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" focusable="false" className={iconClasses}>
        <path d="M12,8c1.66,0,3,1.34,3,3s-1.34,3-3,3s-3-1.34-3-3S10.34,8,12,8z M12,6c-2.76,0-5,2.24-5,5s2.24,5,5,5s5-2.24,5-5 S14.76,6,12,6z M20,3H4v1h16V3z M20,5H4v1h16V5z M21,7H3v11h18V7z M4,17V8h16v9H4z"></path>
    </svg>
);

export const HistoryIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" focusable="false" className={iconClasses}>
        <path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6a7 7 0 0 1 7-7 7 7 0 0 1 7 7 7 7 0 0 1-7 7v2a9 9 0 0 0 9-9 9 9 0 0 0-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"></path>
    </svg>
);

export const LikeIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" focusable="false" className={iconClasses}>
        <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"></path>
    </svg>
);

export const DislikeIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" focusable="false" className={iconClasses}>
        <path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79-.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z"></path>
    </svg>
);

export const ShareIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" focusable="false" className={iconClasses}>
        <path d="M15 5.63 20.66 12 15 18.37V15v-1h-1c-3.96 0-7.14 1.28-9.04 3.81.67-3.33 3.33-6.44 9.04-7.19 0-.13.02-.27.02-.4V5.63M14 3v4.37c-5.48.55-9.84 3.9-11.23 8.84.46-2.07 1.63-3.87 3.23-5.29 1.53-1.35 3.5-2.35 5.77-2.82V12l8-9-8-9z"></path>
    </svg>
);

export const SaveIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" focusable="false" className={iconClasses}>
        <path d="M14 10H2v2h12v-2zm0-4H2v2h12V6zm4 8v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM2 16h8v-2H2v2z"></path>
    </svg>
);

export const PlaylistIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" focusable="false" className={iconClasses}>
        <path d="M3 10h11v2H3v-2zm0-4h11v2H3V6zm0 8h7v2H3v-2zm13-1v-6l5 3-5 3z"></path>
    </svg>
);

export const MoreIconHorizontal: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" focusable="false" className={iconClasses}>
        <path d="M6 10h2v2H6zm6 0h2v2h-2zm6 0h2v2h-2z"></path>
    </svg>
);

export const SunIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" focusable="false" className={iconClasses}>
    <path d="M12 9c-1.65 0-3 1.35-3 3s1.35 3 3 3 3-1.35 3-3-1.35-3-3-3m0-2c2.76 0 5 2.24 5 5s-2.24 5-5 5-5-2.24-5-5 2.24-5 5-5m-7-2h4v-2H5m11.66 3.4-2.83-2.83-1.41 1.41 2.83 2.83zM5 15.66l-2.83 2.83 1.41 1.41L6.4 17.07zM21 11v2h-4v-2zm-2.34 6.66 2.83-2.83-1.41-1.41-2.83 2.83zM3 11v2H1v-2zm12.5-5.5L14.09 4.09 11.26 1.26l1.41-1.41 2.83 2.83zM4.93 4.93 2.1 2.1l1.41-1.41 2.83 2.83zM19 21v-4h2v4zm-7.4-2.83-2.83 2.83 1.41 1.41 2.83-2.83z"></path>
  </svg>
);

export const MoonIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" focusable="false" className={iconClasses}>
    <path d="M10 2c-1.82 0-3.53.5-5 1.35C7.99 5.08 10 8.3 10 12s-2.01 6.92-5 8.65C6.47 21.5 8.18 22 10 22c5.52 0 10-4.48 10-10S15.52 2 10 2"></path>
  </svg>
);

export const CloseIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" focusable="false" className={iconClasses}>
    <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path>
  </svg>
);

export const CheckIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" focusable="false" className="fill-current text-yt-blue">
    <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path>
  </svg>
);

export const TrashIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" focusable="false" className={iconClasses}>
        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path>
    </svg>
);

export const EditIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" focusable="false" className={iconClasses}>
        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path>
    </svg>
);