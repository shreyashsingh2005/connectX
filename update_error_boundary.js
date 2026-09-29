const fs = require('fs');
let file = fs.readFileSync('src/app/error.tsx', 'utf8');

file = file.replace(
`        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">
          We encountered an unexpected error. Don't worry, your data is safe.
        </p>`,
`        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">
          We encountered an unexpected error. Don't worry, your data is safe.
        </p>
        <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-xl max-w-lg mb-8 overflow-auto text-left text-sm font-mono whitespace-pre-wrap">
          {error.message}
          {'\n'}
          {error.stack}
        </div>`
);

fs.writeFileSync('src/app/error.tsx', file);
