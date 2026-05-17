import re

with open('src/components/MyRoomClient.tsx', 'r') as f:
    content = f.read()

# 1. Extract the Mirror Tab Content
mirror_match = re.search(r"\{activeTab === 'mirror' && \(\s*(<div className=\"bg-white p-8 rounded-2xl shadow-sm border border-slate-100 animate-fade-in\">.*?)\s*\)\}", content, re.DOTALL)
if not mirror_match:
    print("Could not find Mirror tab content")
    exit(1)
mirror_content = mirror_match.group(1)

# 2. Extract the cards
cards_regex = re.compile(r"\{\/\* 1\. PROFILE PHOTO CARD \*\/\}.*?\{\/\* --- TAB NAVIGATION ---\s*\*\/\}", re.DOTALL)
if not cards_regex.search(content):
    print("Could not find Cards content")
    exit(1)

# Replace cards with mirror content
new_content = cards_regex.sub(mirror_content + "\n\n      {/* --- TAB NAVIGATION --- */}", content)

# 3. Remove the My Mirror Tab Button
new_content = re.sub(r"<button onClick=\{\(\) => setActiveTab\('mirror'\)\}.*?My Mirror</button>\n\s*", "", new_content)

# 4. Remove the My Mirror Tab View condition
new_content = re.sub(r"\{activeTab === 'mirror' && \(\s*<div className=\"bg-white p-8 rounded-2xl shadow-sm border border-slate-100 animate-fade-in\">.*?</div>\s*\)\}\n\s*", "", new_content, flags=re.DOTALL)

with open('src/components/MyRoomClient.tsx', 'w') as f:
    f.write(new_content)

print("Replacement successful")
