import React from 'react';
import { Loader2 } from 'lucide-react'; // Optional: use any spinner icon

const LoadingScreen = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-gray-800 bg-white">
      <Loader2 className="w-12 h-12 mb-4 text-blue-500 animate-spin" />
      <p className="text-lg font-semibold">Loading, please wait...</p>
    </div>
  );
};

export default LoadingScreen;
