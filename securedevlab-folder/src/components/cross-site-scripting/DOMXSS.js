import React from 'react';

const DOMXSS = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">DOM-based XSS Lab</h1>
        <p className="mb-4">
          This lab demonstrates a DOM-based Cross-Site Scripting (XSS) vulnerability. 
          In a DOM-based XSS attack, the vulnerability exists in the client-side code rather than the server.
        </p>
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          <p className="font-bold">Warning:</p>
          <p>This is a demonstration of a security vulnerability. Do not use these techniques on real websites without permission.</p>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">Coming Soon</h2>
        <p className="mb-4">
          The DOM-based XSS lab is currently under development. This lab will demonstrate how malicious scripts can be executed through vulnerabilities in client-side JavaScript code.
        </p>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">About DOM-based XSS</h2>
        <p className="mb-4">
          DOM-based XSS occurs when a web application's client-side JavaScript code takes user input and includes it in the page's DOM without proper validation or encoding.
          The malicious script is executed in the user's browser without being sent to the server.
        </p>
        <p className="mb-4">
          Unlike reflected and stored XSS, DOM-based XSS does not involve the server at all. 
          The vulnerability exists entirely in the client-side code.
        </p>
        <h3 className="text-xl font-semibold mb-2">Prevention:</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Validate and sanitize all user input before including it in the DOM</li>
          <li>Use safe DOM manipulation methods</li>
          <li>Implement Content Security Policy (CSP) headers</li>
          <li>Avoid using eval() or similar functions that execute code from strings</li>
        </ul>
      </div>
    </div>
  );
};

export default DOMXSS; 