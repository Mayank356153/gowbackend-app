import React, { useEffect, useState } from 'react';
import { Preferences } from '@capacitor/preferences';
import axios from 'axios';

const SavedLoginsPage = ({ savedUsers }) => {

  const handleLogin = async (user) => {
    try {
      const res = await axios.post('https://your-api.com/login', {
        username: user.username,
        password: user.password,
      });

      console.log('Login success:', res.data);
      alert('Login successful!');
      // Navigate to dashboard or set token here
    } catch (err) {
      console.error('Login failed:', err);
      alert('Login failed!');
    }
  };
  alert("Click on any saved login to auto-fill the credentials and log in.");
  console.log("Saved users:", savedUsers);
  return (
    <div className="max-w-md p-4 mx-auto">
      <h2 className="mb-4 text-xl font-bold">Saved Logins</h2>
       {savedUsers.length === 0 ? (
        <p className="text-gray-500">No saved logins found.</p>
      ) : (
        <ul className="space-y-2">
          {savedUsers.map((user, index) => (
            <li
              key={index}
              onClick={() => handleLogin(user)}
              className="p-3 border rounded shadow-sm cursor-pointer hover:bg-blue-50"
            >
              <p className="font-semibold">{user.username}</p>
              <p className="text-sm text-gray-500">Password: {user.password}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SavedLoginsPage;
