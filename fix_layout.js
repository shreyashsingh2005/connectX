const fs = require('fs');
let code = fs.readFileSync('src/app/(app)/layout.tsx', 'utf8');

const startStr = "if (!isLoaded) {";
const searchStr = "Loading connectX...";

let startIdx = code.indexOf(startStr);
let endIdx = code.indexOf("}", code.indexOf(searchStr)) + 1;

if (startIdx !== -1 && endIdx !== -1) {
    code = code.substring(0, startIdx) + "if (!isLoaded) {\n    return <AppBootScreen />;\n  }" + code.substring(endIdx);
    fs.writeFileSync('src/app/(app)/layout.tsx', code);
    console.log("Success");
} else {
    console.log("Failed");
}
