@echo off
echo ===================================================
echo Starting BigQuery Release Notes Dashboard...
echo Open your browser to http://127.0.0.1:5000/
echo ===================================================
call venv\Scripts\activate.bat
python app.py
pause
