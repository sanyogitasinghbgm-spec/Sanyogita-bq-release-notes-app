import os
import time
import json
import xml.etree.ElementTree as ET
import requests
from flask import Flask, jsonify, render_template, request
from bs4 import BeautifulSoup

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
CACHE_FILE = "feed_cache.json"
CACHE_EXPIRY_SECONDS = 3600  # Cache for 1 hour by default

def parse_feed_content(xml_content):
    """
    Parses the Atom feed XML and extracts entries.
    Inside each entry, parses the HTML content to separate individual update items
    (e.g., Feature, Announcement, Issue, Change, Breaking) so that they can be
    filtered and Tweeted individually.
    """
    root = ET.fromstring(xml_content)
    ns = {'atom': 'http://www.w3.org/2005/Atom'}
    
    parsed_entries = []
    
    for entry in root.findall('atom:entry', ns):
        title = entry.find('atom:title', ns)
        title_text = title.text.strip() if title is not None else "Unknown Date"
        
        updated = entry.find('atom:updated', ns)
        updated_text = updated.text.strip() if updated is not None else ""
        
        link_elem = entry.find('atom:link[@rel="alternate"]', ns)
        link_href = link_elem.attrib.get('href', '').strip() if link_elem is not None else ""
        
        content_elem = entry.find('atom:content', ns)
        content_html = content_elem.text if content_elem is not None else ""
        
        # Parse the HTML content inside the entry
        soup = BeautifulSoup(content_html, 'html.parser')
        
        items = []
        current_type = None
        current_html = []
        
        for child in soup.children:
            if child.name == 'h3':
                # Save previous item if it exists
                if current_type and current_html:
                    items.append({
                        'type': current_type,
                        'content': "".join(str(x) for x in current_html).strip()
                    })
                current_type = child.get_text().strip()
                current_html = []
            elif child.name is not None:
                current_html.append(child)
                
        # Append the final item
        if current_type and current_html:
            items.append({
                'type': current_type,
                'content': "".join(str(x) for x in current_html).strip()
            })
            
        # Fallback if no <h3> tags were found (just treat the whole html as one general update)
        if not items and content_html.strip():
            items.append({
                'type': 'Update',
                'content': content_html.strip()
            })
            
        parsed_entries.append({
            'date': title_text,
            'updated': updated_text,
            'link': link_href,
            'items': items
        })
        
    return parsed_entries

def get_release_notes(force_refresh=False):
    """
    Fetches release notes, utilizing local cache if possible.
    """
    now = time.time()
    
    # Check cache first
    if not force_refresh and os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, 'r', encoding='utf-8') as f:
                cache_data = json.load(f)
                if now - cache_data.get('timestamp', 0) < CACHE_EXPIRY_SECONDS:
                    return cache_data.get('entries', []), True  # True indicates loaded from cache
        except Exception as e:
            # Ignore cache errors and fetch fresh data
            app.logger.warning(f"Failed to read cache: {e}")
            
    # Fetch from Google Docs Feed
    try:
        response = requests.get(FEED_URL, timeout=10)
        response.raise_for_status()
        
        entries = parse_feed_content(response.content)
        
        # Save to cache
        cache_data = {
            'timestamp': now,
            'entries': entries
        }
        with open(CACHE_FILE, 'w', encoding='utf-8') as f:
            json.dump(cache_data, f, ensure_ascii=False, indent=2)
            
        return entries, False  # False indicates fresh fetch
    except Exception as e:
        app.logger.error(f"Error fetching feed: {e}")
        # If fetch fails, try to return stale cache as fallback
        if os.path.exists(CACHE_FILE):
            try:
                with open(CACHE_FILE, 'r', encoding='utf-8') as f:
                    cache_data = json.load(f)
                    return cache_data.get('entries', []), True
            except:
                pass
        raise e

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/release-notes')
def api_release_notes():
    force_refresh = request.args.get('refresh', 'false').lower() == 'true'
    try:
        entries, from_cache = get_release_notes(force_refresh=force_refresh)
        return jsonify({
            'success': True,
            'from_cache': from_cache,
            'timestamp': time.time(),
            'entries': entries
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    # Run on port 5000 by default
    app.run(debug=True, port=5000)
