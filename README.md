# BigQuery Release Notes Dashboard

A modern, fast, and responsive single-page web application that pulls Google Cloud BigQuery release notes, parses them into categorized updates, allows dynamic filtering, and includes a custom Twitter/X Share Composer.

---

## 🎨 Main Features

* **Granular Feed Decomposition**: The application parses Google's raw Atom XML feed and splits grouped daily release lists into specific category cards (*Features*, *Breaking Changes*, *Known Issues*, *Announcements*, *Changes*).
* **Fuzzy Text Search**: Instantly filter release notes by keywords, dates, or update categories directly on the client side.
* **Smart File-Based Caching**: Utilizes a 1-hour cache system (`feed_cache.json`) to minimize external network requests and render the UI instantly. Includes failover recovery to show cached data if the Google Cloud feed is temporarily unreachable.
* **Character-Accurate X (Twitter) Composer**: 
  * Auto-formats announcements with specific headlines based on update type.
  * Treats all links inside the editor as exactly 23 characters (exactly matching how X's t.co wrapper impacts character limits).
  * Circular SVG progress ring visualizing character capacity.
  * Easy switches to toggle documentation links and hashtags (`#BigQuery #GoogleCloud`) on/off.

---

## 📂 Project Structure

* **[app.py](file:///C:/Users/sanyo/agy-cli-projects/bq-release-notes/app.py)**: Flask backend containing the feed parsing engine (`BeautifulSoup`/`ElementTree`), caching layer, and API routing.
* **[templates/index.html](file:///C:/Users/sanyo/agy-cli-projects/bq-release-notes/templates/index.html)**: Main frontend shell structure.
* **[static/css/style.css](file:///C:/Users/sanyo/agy-cli-projects/bq-release-notes/static/css/style.css)**: Glassmorphic dark-theme design style sheet with animated transitions, color-coded badges, and media queries.
* **[static/js/main.js](file:///C:/Users/sanyo/agy-cli-projects/bq-release-notes/static/js/main.js)**: Orchestrates asynchronous requests, search index filtering, state tracking, and the Twitter modal logic.
* **[requirements.txt](file:///C:/Users/sanyo/agy-cli-projects/bq-release-notes/requirements.txt)**: Python package requirements (`Flask`, `requests`, `beautifulsoup4`, `lxml`).
* **[run.bat](file:///C:/Users/sanyo/agy-cli-projects/bq-release-notes/run.bat)**: Double-click Windows command script to boot up the application.
* **[.gitignore](file:///C:/Users/sanyo/agy-cli-projects/bq-release-notes/.gitignore)**: Standard exclusions for Python virtual environments, compiled bytecode (`__pycache__`), IDE files, and data caches.

---

## 🚀 Installation & Running the Server

### Option A: Windows Quick-Start
Simply double-click the **[run.bat](file:///C:/Users/sanyo/agy-cli-projects/bq-release-notes/run.bat)** file. It will automatically activate the virtual environment and start the development server.

### Option B: Manual Setup (Terminal)
1. **Initialize Virtual Environment**:
   ```bash
   python -m venv venv
   ```
2. **Activate the Environment**:
   * **Windows (PowerShell)**:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   * **Windows (CMD)**:
     ```cmd
     call venv\Scripts\activate.bat
     ```
   * **macOS / Linux**:
     ```bash
     source venv/bin/activate
     ```
3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
4. **Start Flask Server**:
   ```bash
   python app.py
   ```
5. **Open Browser**: Go to **[http://127.0.0.1:5000/](http://127.0.0.1:5000/)** to access the dashboard.

---

## 🛠️ Technology Stack
* **Backend**: Python 3.10+, Flask, Requests, BeautifulSoup4
* **Frontend**: Vanilla HTML5, Vanilla CSS3 (Custom Variables, Flexbox, Grid), Vanilla JavaScript (ES6)
* **Icons**: FontAwesome 6 (CDN-loaded)
* **Fonts**: Outfit & Plus Jakarta Sans (Google Fonts)
