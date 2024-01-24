// Assuming your variable is named customCssValue
const customCssValue = "yourVariableValue";

// Constructing the regex pattern dynamically
const dynamicPattern = new RegExp(`<!-- !! ${customCssValue}-SESSION-ID ([0-9a-fA-F-]+) !! -->`);

// Example usage
const inputString = "<!-- !! yourVariableValue-SESSION-ID abc123 !! -->";
const match = inputString.match(dynamicPattern);

if (match) {
  const sessionId = match[1];
  console.log(`Found session ID: ${sessionId}`);
} else {
  console.log("Pattern not found in the input string.");
}
