const fs = require('fs');

let content = fs.readFileSync('src/components/MyRoomClient.tsx', 'utf8');

const mirrorBlockStart = "{activeTab === 'mirror' && (";
const mirrorBlockEndStr = `        </div>
      )}

      {activeTab === 'activity' && (`

const mStart = content.indexOf(mirrorBlockStart);
if (mStart === -1) { console.error("mStart not found"); process.exit(1); }
const mEnd = content.indexOf(mirrorBlockEndStr, mStart);
if (mEnd === -1) { console.error("mEnd not found"); process.exit(1); }

// Extract the content INSIDE the {activeTab === 'mirror' && ( ... )}
const mirrorFull = content.slice(mStart, mEnd + `        </div>
      )}`.length);

let mirrorInner = mirrorFull.replace("{activeTab === 'mirror' && (", "").replace(/}\)$/, "").trim();

// Now find the cards block
const cardsStart = content.indexOf("{/* 1. PROFILE PHOTO CARD */}");
if (cardsStart === -1) { console.error("cardsStart not found"); process.exit(1); }

const cardsEndStr = `      </section>\n\n      {/* --- TAB NAVIGATION --- */}\n`;
const cardsEnd = content.indexOf("{/* --- TAB NAVIGATION --- */}");
if (cardsEnd === -1) { console.error("cardsEnd not found"); process.exit(1); }
// let's grab up to cardsEnd
const cardsEndIndex = cardsEnd;

// Replace cards with mirrorInner
let newContent = content.slice(0, cardsStart) + mirrorInner + "\n\n      " + content.slice(cardsEndIndex);

// Find the Mirror Tab button and remove it
const btnStart = newContent.indexOf("<button onClick={() => setActiveTab('mirror')}");
if (btnStart !== -1) {
    const btnEnd = newContent.indexOf("</button>", btnStart) + "</button>".length;
    // Remove the line with the button
    const beforeBtn = newContent.lastIndexOf("\n", btnStart);
    const afterBtn = newContent.indexOf("\n", btnEnd);
    newContent = newContent.slice(0, beforeBtn) + newContent.slice(afterBtn);
}

// Remove the original mirror block
const originalMirrorStart = newContent.indexOf("{activeTab === 'mirror' && (");
if (originalMirrorStart !== -1) {
    const originalMirrorEnd = newContent.indexOf(mirrorBlockEndStr, originalMirrorStart);
    if (originalMirrorEnd !== -1) {
        const afterEnd = originalMirrorEnd + `        </div>
      )}`.length;
        newContent = newContent.slice(0, originalMirrorStart) + newContent.slice(afterEnd);
    }
}

fs.writeFileSync('src/components/MyRoomClient.tsx', newContent);
console.log("Success!");