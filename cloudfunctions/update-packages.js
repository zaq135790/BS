const fs = require('fs');
const path = require('path');

const services = [
  'content-service',
  'game-service',
  'social-service',
  'user-service',
  'utils-service'
];

const packageTemplate = (name, description) => ({
  name,
  version: '1.0.0',
  description,
  main: 'index.js',
  dependencies: {
    'wx-server-sdk': '2.6.3',
    ...(name === 'user-service' || name === 'utils-service' ? { 'crypto-js': '4.1.1' } : {})
  },
  author: 'Your Name <your.email@example.com>',
  license: 'ISC'
});

const serviceDescriptions = {
  'content-service': 'Content management service for insect identification',
  'game-service': 'Game logic and state management service',
  'social-service': 'Social features and user interactions',
  'user-service': 'User authentication and profile management',
  'utils-service': 'Shared utilities and helper functions'
};

// Update root package.json
const rootPackage = require('./package.json');
fs.writeFileSync(
  './package.json',
  JSON.stringify(rootPackage, null, 2) + '\n',
  'utf8'
);

// Update service package.json files
services.forEach(service => {
  const packagePath = `./${service}/package.json`;
  const packageData = packageTemplate(service, serviceDescriptions[service] || `${service} for insect identification`);
  
  fs.writeFileSync(
    packagePath,
    JSON.stringify(packageData, null, 2) + '\n',
    'utf8'
  );
  
  console.log(`Updated ${packagePath}`);
});

console.log('All package.json files have been updated successfully!');
